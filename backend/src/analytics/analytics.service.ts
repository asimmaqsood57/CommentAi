import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private client: PostHog | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('POSTHOG_API_KEY');
    if (apiKey) {
      this.client = new PostHog(apiKey, {
        host: this.config.get<string>('POSTHOG_HOST') ?? 'https://app.posthog.com',
      });
    }
  }

  track(userId: string, event: string, properties?: Record<string, any>) {
    if (!this.client) return;
    this.client.capture({ distinctId: userId, event, properties });
  }

  async onModuleDestroy() {
    await this.client?.shutdown();
  }
}
