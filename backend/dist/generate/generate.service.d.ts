import { PrismaService } from '../prisma/prisma.service';
import { OpenAiService } from '../openai/openai.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { User } from '@prisma/client';
export declare class GenerateService {
    private prisma;
    private openai;
    private analytics;
    constructor(prisma: PrismaService, openai: OpenAiService, analytics: AnalyticsService);
    generate(user: User, postText: string, platform: string, tones: string[]): Promise<{
        suggestions: import("../openai/openai.service").CommentSuggestion[];
    }>;
}
