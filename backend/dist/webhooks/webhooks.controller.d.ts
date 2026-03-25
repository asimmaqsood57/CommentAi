import { WebhooksService } from './webhooks.service';
import { ConfigService } from '@nestjs/config';
export declare class WebhooksController {
    private readonly webhooksService;
    private readonly config;
    constructor(webhooksService: WebhooksService, config: ConfigService);
    revenueCat(authHeader: string, body: any): Promise<{
        received: boolean;
    }>;
}
