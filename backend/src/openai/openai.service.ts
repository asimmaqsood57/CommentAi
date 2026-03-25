import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Plan, Platform } from '@prisma/client';

export interface CommentSuggestion {
  tone: string;
  text: string;
  characterCount: number;
}

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
  LINKEDIN:
    'Write in a professional tone that adds value. Avoid fluff. Can be 2–3 sentences.',
  INSTAGRAM:
    'Be casual, emoji-friendly, short and punchy. Max 1–2 sentences.',
  TWITTER:
    'Ultra-concise, under 280 characters. Witty or insightful.',
  YOUTUBE:
    'Be enthusiastic, reference the video topic, encourage discussion.',
  FACEBOOK:
    'Be conversational and community-oriented.',
  REDDIT:
    'Match subreddit culture. Be genuine and avoid sounding promotional.',
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  PROFESSIONAL: 'Use formal language and industry terminology.',
  WITTY: 'Use clever wordplay and light humor.',
  SUPPORTIVE: 'Be encouraging and validating.',
  CURIOUS: 'Ask an insightful question.',
  CONTRARIAN: 'Respectfully challenge the premise.',
};

@Injectable()
export class OpenAiService {
  private client: OpenAI;

  constructor(private config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  buildSystemPrompt(
    platform: Platform,
    tones: string[],
    voiceSamples: string[],
  ): string {
    const platformRule = PLATFORM_INSTRUCTIONS[platform];
    const toneRules = tones
      .map((t) => `- ${t}: ${TONE_INSTRUCTIONS[t] ?? ''}`)
      .join('\n');

    let prompt = `You are CommentAI, an expert social media engagement specialist.

Platform: ${platform}
Platform rule: ${platformRule}

Generate one comment suggestion per tone listed below. For each tone, apply the tone modifier on top of the platform rule.

Tones requested:
${toneRules}`;

    if (voiceSamples.length > 0) {
      prompt += `\n\nThe user has provided voice samples — mirror their style and vocabulary:\n${voiceSamples.map((s, i) => `Sample ${i + 1}: "${s}"`).join('\n')}`;
    }

    prompt += `\n\nRespond ONLY with a valid JSON object in this exact shape (no markdown, no explanation):
{ "suggestions": [{ "tone": "<TONE>", "text": "<comment>", "characterCount": <number> }] }`;

    return prompt;
  }

  async generateComments(
    postText: string,
    platform: Platform,
    tones: string[],
    plan: Plan,
    voiceSamples: string[],
  ): Promise<CommentSuggestion[]> {
    const model = plan === 'FREE' ? 'gpt-4o-mini' : 'gpt-4o';
    const systemPrompt = this.buildSystemPrompt(platform, tones, voiceSamples);

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Post: "${postText}"` },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content ?? '{"suggestions":[]}';
    const parsed = JSON.parse(raw);
    const suggestions: CommentSuggestion[] = parsed.suggestions ?? [];

    return suggestions.map((s) => ({
      tone: s.tone,
      text: s.text,
      characterCount: s.text?.length ?? 0,
    }));
  }
}
