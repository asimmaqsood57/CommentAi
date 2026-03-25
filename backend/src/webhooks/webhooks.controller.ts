import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @Post('revenuecat')
  @HttpCode(200)
  @ApiOperation({
    summary: 'RevenueCat subscription lifecycle webhook',
    description: `
Receives subscription lifecycle events from RevenueCat and updates the
user's plan in the database accordingly.

**Authentication:** This endpoint uses a shared secret instead of Firebase
JWT. Set your RevenueCat webhook secret in the dashboard and add it to
the \`REVENUECAT_WEBHOOK_SECRET\` environment variable. RevenueCat will
send it as \`Authorization: Bearer <secret>\`.

**Handled event types:**

| Event | Action |
|-------|--------|
| \`INITIAL_PURCHASE\` | Upgrades user plan (PRO / CREATOR / TEAM) |
| \`RENEWAL\` | Re-confirms active plan |
| \`PRODUCT_CHANGE\` | Switches user to new plan tier |
| \`CANCELLATION\` | Downgrades user to FREE at period end |
| \`EXPIRATION\` | Downgrades user to FREE immediately |

**Product ID → Plan mapping:**
- \`commentai_pro_monthly\` → PRO
- \`commentai_creator_monthly\` → CREATOR
- \`commentai_team_monthly\` → TEAM

The \`app_user_id\` in the RevenueCat event must match the user's \`firebaseUid\`
in the database. Set this in the RevenueCat SDK on the client using
\`Purchases.logIn(firebaseUid)\`.
    `.trim(),
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <REVENUECAT_WEBHOOK_SECRET> — shared secret set in RevenueCat dashboard',
    example: 'Bearer rc_secret_abc123',
    required: true,
  })
  @ApiBody({
    schema: { type: 'object' },
    examples: {
      initial_purchase: {
        summary: 'New PRO subscription purchased',
        value: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: 'uid_google_abc123',
            product_id: 'commentai_pro_monthly',
            period_type: 'NORMAL',
            purchased_at_ms: 1742900400000,
            expiration_at_ms: 1745578800000,
          },
        },
      },
      cancellation: {
        summary: 'Subscription cancelled — downgrade to FREE',
        value: {
          event: {
            type: 'CANCELLATION',
            app_user_id: 'uid_google_abc123',
            product_id: 'commentai_pro_monthly',
            cancel_reason: 'UNSUBSCRIBE',
          },
        },
      },
      renewal: {
        summary: 'Subscription renewed for another month',
        value: {
          event: {
            type: 'RENEWAL',
            app_user_id: 'uid_google_abc123',
            product_id: 'commentai_creator_monthly',
          },
        },
      },
      product_change: {
        summary: 'User upgraded from PRO to CREATOR',
        value: {
          event: {
            type: 'PRODUCT_CHANGE',
            app_user_id: 'uid_google_abc123',
            product_id: 'commentai_creator_monthly',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Event received and processed successfully.',
    schema: { example: { received: true } },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing webhook secret.',
    schema: { example: { error: 'Invalid webhook secret', code: 'WEBHOOK_UNAUTHORIZED' } },
  })
  async revenueCat(
    @Headers('authorization') authHeader: string,
    @Body() body: any,
  ) {
    const secret = this.config.get<string>('REVENUECAT_WEBHOOK_SECRET');
    const provided = authHeader?.replace('Bearer ', '');

    if (!secret || provided !== secret) {
      throw new UnauthorizedException({ error: 'Invalid webhook secret', code: 'WEBHOOK_UNAUTHORIZED' });
    }

    return this.webhooksService.handleRevenueCat(body);
  }
}
