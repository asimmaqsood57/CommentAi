import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class AnalyticsService implements OnModuleDestroy {
    private config;
    private client;
    constructor(config: ConfigService);
    track(userId: string, event: string, properties?: Record<string, any>): void;
    onModuleDestroy(): Promise<void>;
}
