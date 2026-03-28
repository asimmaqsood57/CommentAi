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
import { DraftsService } from './drafts.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

class SaveDraftDto {
  @IsString()
  @ApiProperty({
    example: 'LinkedIn — product launch comment',
    description: 'Short label used to identify the draft in your saved list.',
  })
  title: string;

  @IsString()
  @ApiProperty({
    example: 'Congratulations on the launch — 18 months of sustained effort reflects exceptional team discipline.',
    description: 'The full comment text to save as a draft.',
  })
  content: string;

  @IsString()
  @ApiProperty({
    example: 'linkedin',
    enum: ['linkedin', 'instagram', 'twitter', 'youtube', 'facebook', 'reddit'],
    description: 'The platform this comment was generated for (used for display/filtering).',
  })
  platform: string;
}

@ApiTags('drafts')
@Controller('drafts')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase-jwt')
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  @Post()
  @ApiOperation({
    summary: 'Save a comment as a draft',
    description: `
Saves a generated comment suggestion to the user's draft list for later use.

Drafts are typically created when the user taps "Save as Draft" after
generating comments on the HomeScreen. They can be retrieved later from
the DraftsScreen, copied to clipboard, or deleted.

There is no limit on the number of drafts a user can save.
    `.trim(),
  })
  @ApiBody({
    type: SaveDraftDto,
    examples: {
      linkedin_draft: {
        summary: 'LinkedIn comment draft',
        value: {
          title: 'LinkedIn — product launch comment',
          content: 'Congratulations on the launch — 18 months of sustained effort reflects exceptional team discipline.',
          platform: 'linkedin',
        },
      },
      twitter_draft: {
        summary: 'Twitter comment draft',
        value: {
          title: 'Twitter — remote work hot take',
          content: 'The data doesn\'t lie — async-first teams consistently outperform. Worth revisiting your assumptions here.',
          platform: 'twitter',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Draft saved successfully. Returns the created draft object.',
    schema: {
      example: {
        id: 'clxyz789ghi',
        userId: 'clxyz123abc',
        title: 'LinkedIn — product launch comment',
        content: 'Congratulations on the launch — 18 months of sustained effort reflects exceptional team discipline.',
        platform: 'LINKEDIN',
        createdAt: '2026-03-25T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase Bearer token.',
    schema: { example: { error: 'Invalid token', code: 'AUTH_INVALID' } },
  })
  async save(@CurrentUser() user: User, @Body() dto: SaveDraftDto) {
    return this.draftsService.save(user.id, dto.title, dto.content, dto.platform);
  }

  @Get()
  @ApiOperation({
    summary: 'List all saved drafts',
    description: `
Returns all drafts saved by the authenticated user, ordered by most recent first.

Used to populate the DraftsScreen in the app. Each draft includes its title,
content, platform, and creation timestamp. Tap to copy, swipe to delete.
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: 'Array of drafts ordered by newest first. Empty array if no drafts exist.',
    schema: {
      example: [
        {
          id: 'clxyz789ghi',
          userId: 'clxyz123abc',
          title: 'LinkedIn — product launch comment',
          content: 'Congratulations on the launch — 18 months of sustained effort.',
          platform: 'LINKEDIN',
          createdAt: '2026-03-25T10:30:00.000Z',
        },
        {
          id: 'clxyz000jkl',
          userId: 'clxyz123abc',
          title: 'Twitter — remote work hot take',
          content: 'The data doesn\'t lie — async-first teams consistently outperform.',
          platform: 'TWITTER',
          createdAt: '2026-03-24T08:15:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase Bearer token.',
    schema: { example: { error: 'Invalid token', code: 'AUTH_INVALID' } },
  })
  async list(@CurrentUser() user: User) {
    return this.draftsService.list(user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a draft',
    description: `
Permanently deletes a draft by its ID.

Only the owner of the draft can delete it — if the draft belongs to
a different user, a 403 Forbidden is returned. If the ID doesn't exist,
a 404 is returned.

Triggered in the app when the user swipes a draft row to the left.
    `.trim(),
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the draft to delete (cuid format)',
    example: 'clxyz789ghi',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft deleted successfully.',
    schema: { example: { success: true } },
  })
  @ApiResponse({
    status: 404,
    description: 'Draft not found.',
    schema: { example: { error: 'Draft not found', code: 'NOT_FOUND' } },
  })
  @ApiResponse({
    status: 403,
    description: 'You do not own this draft.',
    schema: { example: { error: 'Forbidden', code: 'FORBIDDEN' } },
  })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.draftsService.remove(user.id, id);
  }
}
