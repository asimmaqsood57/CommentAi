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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
const PLATFORM_INSTRUCTIONS = {
    LINKEDIN: 'Write in a professional tone that adds value. Avoid fluff. Can be 2–3 sentences.',
    INSTAGRAM: 'Be casual, emoji-friendly, short and punchy. Max 1–2 sentences.',
    TWITTER: 'Ultra-concise, under 280 characters. Witty or insightful.',
    YOUTUBE: 'Be enthusiastic, reference the video topic, encourage discussion.',
    FACEBOOK: 'Be conversational and community-oriented.',
    REDDIT: 'Match subreddit culture. Be genuine and avoid sounding promotional.',
};
const TONE_INSTRUCTIONS = {
    PROFESSIONAL: 'Use formal language and industry terminology.',
    WITTY: 'Use clever wordplay and light humor.',
    SUPPORTIVE: 'Be encouraging and validating.',
    CURIOUS: 'Ask an insightful question.',
    CONTRARIAN: 'Respectfully challenge the premise.',
};
let OpenAiService = class OpenAiService {
    config;
    client;
    constructor(config) {
        this.config = config;
        this.client = new openai_1.default({
            apiKey: this.config.get('OPENAI_API_KEY'),
        });
    }
    buildSystemPrompt(platform, tones, voiceSamples) {
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
    async generateComments(postText, platform, tones, plan, voiceSamples) {
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
        const suggestions = parsed.suggestions ?? [];
        return suggestions.map((s) => ({
            tone: s.tone,
            text: s.text,
            characterCount: s.text?.length ?? 0,
        }));
    }
};
exports.OpenAiService = OpenAiService;
exports.OpenAiService = OpenAiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAiService);
//# sourceMappingURL=openai.service.js.map