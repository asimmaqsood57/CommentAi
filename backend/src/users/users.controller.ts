import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

class SyncUserDto {
  @IsString()
  @ApiProperty({
    example: 'uid_abc123XYZ',
    description: 'Firebase UID obtained from the client SDK after sign-in',
  })
  firebaseUid: string;

  @IsString()
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address from Firebase Auth',
  })
  email: string;

  @IsString()
  @ApiProperty({
    example: 'John Doe',
    description: 'Display name from Firebase Auth (Google profile or manually set)',
  })
  name: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Sync user after Firebase sign-in',
    description: `
Called immediately after a successful Firebase sign-in on the client.
Creates a new user in PostgreSQL if they don't exist yet, or updates
their email/name if they do (upsert by \`firebaseUid\`).

This must be called before any authenticated endpoint, since the
Firebase Auth Guard looks up the user by \`firebaseUid\` in the database.

**No auth header required** — this is the first call after login.
    `.trim(),
  })
  @ApiBody({
    type: SyncUserDto,
    examples: {
      google_signin: {
        summary: 'Google Sign-In',
        value: {
          firebaseUid: 'uid_google_abc123',
          email: 'john@gmail.com',
          name: 'John Doe',
        },
      },
      email_signup: {
        summary: 'Email / Password Sign-Up',
        value: {
          firebaseUid: 'uid_email_xyz789',
          email: 'jane@company.com',
          name: 'Jane Smith',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created or updated. Returns the full user record.',
    schema: {
      example: {
        id: 'clxyz123abc',
        firebaseUid: 'uid_google_abc123',
        email: 'john@gmail.com',
        name: 'John Doe',
        plan: 'FREE',
        generationsToday: 0,
        lastResetAt: '2026-03-25T00:00:00.000Z',
        createdAt: '2026-03-25T10:00:00.000Z',
      },
    },
  })
  async sync(@Body() dto: SyncUserDto) {
    return this.usersService.syncUser(dto.firebaseUid, dto.email, dto.name);
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('firebase-jwt')
  @ApiOperation({
    summary: 'Get current user profile',
    description: `
Returns the authenticated user's profile including their active plan,
how many comment generations they've used today, and the daily limit
for their plan.

**Plan limits:**
- FREE: 10 generations/day
- PRO / CREATOR / TEAM: unlimited (generationsLimit = null)

Use this endpoint to render the usage progress bar and plan badge in the app.
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: 'User profile with plan and daily usage info.',
    schema: {
      examples: {
        free_user: {
          summary: 'FREE plan user',
          value: {
            id: 'clxyz123abc',
            email: 'john@gmail.com',
            name: 'John Doe',
            plan: 'FREE',
            generationsToday: 4,
            generationsLimit: 10,
          },
        },
        pro_user: {
          summary: 'PRO plan user',
          value: {
            id: 'clxyz456def',
            email: 'jane@company.com',
            name: 'Jane Smith',
            plan: 'PRO',
            generationsToday: 42,
            generationsLimit: null,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase Bearer token.',
    schema: { example: { error: 'Invalid token', code: 'AUTH_INVALID' } },
  })
  async me(@CurrentUser() user: User) {
    return this.usersService.getMe(user);
  }
}
