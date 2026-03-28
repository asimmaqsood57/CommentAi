import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { GenerateService } from './generate.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

class GenerateCommentsDto {
  @IsString()
  @ApiProperty({
    example: 'Just launched our new SaaS product after 18 months of building. Grateful for the team that made it happen.',
    description: 'The full text of the social media post you want to comment on.',
  })
  postText: string;

  @IsString()
  @ApiProperty({
    example: 'linkedin',
    enum: ['linkedin', 'instagram', 'twitter', 'youtube', 'facebook', 'reddit'],
    description: 'The platform the post lives on. Determines the AI tone, length, and style rules applied.',
  })
  platform: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['professional', 'witty'],
    enum: ['professional', 'witty', 'supportive', 'curious', 'contrarian'],
    isArray: true,
    description: 'One or more tones to generate. The API returns one suggestion per tone requested.',
  })
  tones: string[];
}

@ApiTags('generate')
@Controller('generate-comments')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('firebase-jwt')
  @ApiOperation({
    summary: 'Generate AI comment suggestions',
    description: `
The core feature of CommentAI. Accepts a social media post and returns
one AI-generated comment suggestion per requested tone.

**How it works:**
1. Verifies the Firebase Bearer token and loads the user from the database
2. Checks the user's daily generation limit (FREE = 10/day, PRO+ = unlimited)
3. Fetches any voice samples the user has saved — these are appended to the
   prompt so the AI mirrors the user's personal writing style
4. Calls OpenAI (\`gpt-4o-mini\` for FREE users, \`gpt-4o\` for PRO+)
5. Parses the JSON response into structured suggestions
6. Saves the generation to history and increments the daily counter
7. Returns an array of \`{ tone, text, characterCount }\`

**Platform-specific rules applied by the AI:**
- **LinkedIn** — professional, value-adding, 2–3 sentences
- **Instagram** — casual, emoji-friendly, short
- **Twitter/X** — under 280 characters, witty or insightful
- **YouTube** — enthusiastic, encourages discussion
- **Facebook** — conversational, community-oriented
- **Reddit** — genuine, matches subreddit culture

**Tone modifiers:**
- \`professional\` — formal language, industry terminology
- \`witty\` — clever wordplay, light humour
- \`supportive\` — encouraging, validating
- \`curious\` — asks an insightful question
- \`contrarian\` — respectfully challenges the premise
    `.trim(),
  })
  @ApiBody({
    type: GenerateCommentsDto,
    examples: {
      linkedin_professional: {
        summary: 'LinkedIn — two tones',
        value: {
          postText: 'Just launched our new SaaS product after 18 months of building. Grateful for the team that made it happen.',
          platform: 'linkedin',
          tones: ['professional', 'witty'],
        },
      },
      twitter_single: {
        summary: 'Twitter — single tone',
        value: {
          postText: 'Hot take: remote work is more productive than the office and the data proves it.',
          platform: 'twitter',
          tones: ['contrarian'],
        },
      },
      instagram_full: {
        summary: 'Instagram — all tones',
        value: {
          postText: 'New collection just dropped! 🎨 Handmade ceramics inspired by coastal living.',
          platform: 'instagram',
          tones: ['supportive', 'curious', 'witty'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated comment suggestions — one per requested tone.',
    schema: {
      example: {
        suggestions: [
          {
            tone: 'PROFESSIONAL',
            text: 'Congratulations on the launch — 18 months of sustained effort reflects exceptional team discipline. Excited to see the impact this product makes.',
            characterCount: 152,
          },
          {
            tone: 'WITTY',
            text: '18 months, zero sleep, and one very caffeinated team later — it\'s live! Congrats on shipping the thing.',
            characterCount: 104,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'FREE plan daily limit of 10 generations reached. Upgrade to Pro for unlimited access.',
    schema: {
      example: {
        error: 'Daily generation limit reached. Upgrade to Pro for unlimited generations.',
        code: 'LIMIT_REACHED',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase Bearer token.',
    schema: { example: { error: 'Invalid token', code: 'AUTH_INVALID' } },
  })
  async generate(
    @CurrentUser() user: User,
    @Body() dto: GenerateCommentsDto,
  ) {
    return this.generateService.generate(user, dto.postText, dto.platform, dto.tones);
  }
}
