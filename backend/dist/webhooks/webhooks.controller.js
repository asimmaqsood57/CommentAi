"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const webhooks_service_1 = require("./webhooks.service");
const config_1 = require("@nestjs/config");
let WebhooksController = class WebhooksController {
    webhooksService;
    config;
    constructor(webhooksService, config) {
        this.webhooksService = webhooksService;
        this.config = config;
    }
    async revenueCat(authHeader, body) {
        const secret = this.config.get('REVENUECAT_WEBHOOK_SECRET');
        const provided = authHeader?.replace('Bearer ', '');
        if (!secret || provided !== secret) {
            throw new common_1.UnauthorizedException({ error: 'Invalid webhook secret', code: 'WEBHOOK_UNAUTHORIZED' });
        }
        return this.webhooksService.handleRevenueCat(body);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('revenuecat'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
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
    }),
    (0, swagger_1.ApiHeader)({
        name: 'Authorization',
        description: 'Bearer <REVENUECAT_WEBHOOK_SECRET> — shared secret set in RevenueCat dashboard',
        example: 'Bearer rc_secret_abc123',
        required: true,
    }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Event received and processed successfully.',
        schema: { example: { received: true } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid or missing webhook secret.',
        schema: { example: { error: 'Invalid webhook secret', code: 'WEBHOOK_UNAUTHORIZED' } },
    }),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "revenueCat", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService,
        config_1.ConfigService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map