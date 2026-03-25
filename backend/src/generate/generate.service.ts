import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiService } from '../openai/openai.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Plan, Platform, User } from '@prisma/client';
import { isSameDay } from '../common/utils/date.util';

const PLAN_DAILY_LIMIT: Record<Plan, number | null> = {
  FREE: 10,
  PRO: null,
  CREATOR: null,
  TEAM: null,
};

@Injectable()
export class GenerateService {
  constructor(
    private prisma: PrismaService,
    private openai: OpenAiService,
    private analytics: AnalyticsService,
  ) {}

  async generate(
    user: User,
    postText: string,
    platform: string,
    tones: string[],
  ) {
    // Reset daily count if it's a new day
    const needsReset = !isSameDay(user.lastResetAt, new Date());
    let generationsToday = needsReset ? 0 : user.generationsToday;

    // Check limit
    const limit = PLAN_DAILY_LIMIT[user.plan];
    if (limit !== null && generationsToday >= limit) {
      throw new HttpException(
        {
          error: 'Daily generation limit reached. Upgrade to Pro for unlimited generations.',
          code: 'LIMIT_REACHED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Fetch voice samples for style reference
    const voiceSamples = await this.prisma.voiceSample.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const voiceContents = voiceSamples.map((v) => v.content);

    // Generate comments via OpenAI
    const platformEnum = platform.toUpperCase() as Platform;
    const tonesUpper = tones.map((t) => t.toUpperCase());
    const model = user.plan === 'FREE' ? 'gpt-4o-mini' : 'gpt-4o';

    const suggestions = await this.openai.generateComments(
      postText,
      platformEnum,
      tonesUpper,
      user.plan,
      voiceContents,
    );

    // Save generation history
    await this.prisma.generationHistory.create({
      data: {
        userId: user.id,
        platform: platformEnum,
        tone: tonesUpper[0] as any,
        inputText: postText,
        suggestions: suggestions.map((s) => s.text),
      },
    });

    // Increment counter
    generationsToday += 1;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        generationsToday,
        lastResetAt: needsReset ? new Date() : user.lastResetAt,
      },
    });

    // Track analytics
    this.analytics.track(user.firebaseUid, 'comment_generated', {
      platform: platformEnum,
      tones: tonesUpper,
      model_used: model,
      suggestion_count: suggestions.length,
    });

    return { suggestions };
  }
}
