import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './analytics/analytics.module';
import { UsersModule } from './users/users.module';
import { GenerateModule } from './generate/generate.module';
import { DraftsModule } from './drafts/drafts.module';
import { VoiceSamplesModule } from './voice-samples/voice-samples.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AnalyticsModule,
    UsersModule,
    GenerateModule,
    DraftsModule,
    VoiceSamplesModule,
    WebhooksModule,
  ],
})
export class AppModule {}
