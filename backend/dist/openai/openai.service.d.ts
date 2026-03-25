import { ConfigService } from '@nestjs/config';
import { Plan, Platform } from '@prisma/client';
export interface CommentSuggestion {
    tone: string;
    text: string;
    characterCount: number;
}
export declare class OpenAiService {
    private config;
    private client;
    constructor(config: ConfigService);
    buildSystemPrompt(platform: Platform, tones: string[], voiceSamples: string[]): string;
    generateComments(postText: string, platform: Platform, tones: string[], plan: Plan, voiceSamples: string[]): Promise<CommentSuggestion[]>;
}
