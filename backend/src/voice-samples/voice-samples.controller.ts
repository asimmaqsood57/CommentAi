import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { VoiceSamplesService } from './voice-samples.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

class AddVoiceSampleDto {
  @IsString()
  @ApiProperty({
    example: 'Really insightful breakdown — the point about async communication resonates deeply with distributed teams.',
    description: `
A real comment you have previously written on social media.
The AI uses these samples to learn your vocabulary, sentence structure,
and overall writing style, then mirrors it when generating new comments.
    `.trim(),
  })
  content: string;
}

@ApiTags('voice-samples')
@Controller('voice-samples')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase-jwt')
export class VoiceSamplesController {
  constructor(private readonly voiceSamplesService: VoiceSamplesService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a voice sample',
    description: `
Adds a writing sample to the user's voice profile. Voice samples are
real comments the user has written in the past. The AI uses them as
style references when generating new comment suggestions — producing
output that sounds like **you**, not a generic bot.

**Plan restrictions:**
- FREE: voice samples are not available
- PRO / CREATOR / TEAM: up to 5 samples

When the \`/api/generate-comments\` endpoint runs, it fetches all saved
voice samples for the user and appends them to the OpenAI system prompt.

Returns 400 if the user is on the FREE plan or already has 5 samples.
    `.trim(),
  })
  @ApiBody({
    type: AddVoiceSampleDto,
    examples: {
      linkedin_sample: {
        summary: 'LinkedIn-style comment',
        value: {
          content: 'Really insightful breakdown — the point about async communication resonates deeply with distributed teams. This is exactly the kind of nuance that gets lost in most productivity discussions.',
        },
      },
      twitter_sample: {
        summary: 'Twitter-style comment',
        value: {
          content: 'Counterpoint: the "productivity" argument ignores that innovation requires serendipitous hallway conversations. Hard to replicate on Slack.',
        },
      },
      supportive_sample: {
        summary: 'Supportive / encouraging style',
        value: {
          content: 'This is such a bold move and I love it. Takes real courage to ship something this different — rooting for you!',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Voice sample added successfully.',
    schema: {
      example: {
        id: 'clxyzabc111',
        userId: 'clxyz123abc',
        content: 'Really insightful breakdown — the point about async communication resonates deeply with distributed teams.',
        createdAt: '2026-03-25T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Either the user is on FREE plan (no voice samples allowed) or the 5-sample limit is already reached.',
    schema: {
      examples: {
        plan_required: {
          summary: 'FREE plan restriction',
          value: { error: 'Voice samples require a Pro plan or above.', code: 'PLAN_REQUIRED' },
        },
        limit_reached: {
          summary: '5-sample limit hit',
          value: { error: 'You can have at most 5 voice samples.', code: 'VOICE_LIMIT_REACHED' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase Bearer token.',
    schema: { example: { error: 'Invalid token', code: 'AUTH_INVALID' } },
  })
  async add(@CurrentUser() user: User, @Body() dto: AddVoiceSampleDto) {
    return this.voiceSamplesService.add(user, dto.content);
  }

  @Get()
  @ApiOperation({
    summary: 'List all voice samples',
    description: `
Returns all voice samples saved by the authenticated user, ordered by
most recently added first.

Displayed in the VoiceSamplesScreen in the app. If the user has at least
one sample, a "My Voice Trained" badge is shown. The samples are also
automatically included in every \`/api/generate-comments\` call.
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: 'Array of voice samples, newest first. Empty array if none saved.',
    schema: {
      example: [
        {
          id: 'clxyzabc111',
          userId: 'clxyz123abc',
          content: 'Really insightful breakdown — the point about async communication resonates deeply.',
          createdAt: '2026-03-25T11:00:00.000Z',
        },
        {
          id: 'clxyzabc222',
          userId: 'clxyz123abc',
          content: 'Counterpoint: the productivity argument ignores serendipitous hallway conversations.',
          createdAt: '2026-03-24T09:00:00.000Z',
        },
      ],
    },
  })
  async list(@CurrentUser() user: User) {
    return this.voiceSamplesService.list(user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a voice sample',
    description: `
Permanently removes a voice sample by ID. Only the owner can delete their own samples.

Once deleted, the sample will no longer be included in future
\`/api/generate-comments\` AI prompts. If this was the last sample,
the "My Voice Trained" badge is removed in the app.
    `.trim(),
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the voice sample to delete (cuid format)',
    example: 'clxyzabc111',
  })
  @ApiResponse({
    status: 200,
    description: 'Voice sample deleted successfully.',
    schema: { example: { success: true } },
  })
  @ApiResponse({
    status: 404,
    description: 'Voice sample not found.',
    schema: { example: { error: 'Sample not found', code: 'NOT_FOUND' } },
  })
  @ApiResponse({
    status: 403,
    description: 'You do not own this voice sample.',
    schema: { example: { error: 'Forbidden', code: 'FORBIDDEN' } },
  })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.voiceSamplesService.remove(user.id, id);
  }
}
