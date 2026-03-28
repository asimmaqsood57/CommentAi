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
exports.GenerateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const generate_service_1 = require("./generate.service");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
class GenerateCommentsDto {
    postText;
    platform;
    tones;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        example: 'Just launched our new SaaS product after 18 months of building. Grateful for the team that made it happen.',
        description: 'The full text of the social media post you want to comment on.',
    }),
    __metadata("design:type", String)
], GenerateCommentsDto.prototype, "postText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        example: 'linkedin',
        enum: ['linkedin', 'instagram', 'twitter', 'youtube', 'facebook', 'reddit'],
        description: 'The platform the post lives on. Determines the AI tone, length, and style rules applied.',
    }),
    __metadata("design:type", String)
], GenerateCommentsDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, swagger_1.ApiProperty)({
        example: ['professional', 'witty'],
        enum: ['professional', 'witty', 'supportive', 'curious', 'contrarian'],
        isArray: true,
        description: 'One or more tones to generate. The API returns one suggestion per tone requested.',
    }),
    __metadata("design:type", Array)
], GenerateCommentsDto.prototype, "tones", void 0);
let GenerateController = class GenerateController {
    generateService;
    constructor(generateService) {
        this.generateService = generateService;
    }
    async generate(user, dto) {
        return this.generateService.generate(user, dto.postText, dto.platform, dto.tones);
    }
};
exports.GenerateController = GenerateController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, swagger_1.ApiBearerAuth)('firebase-jwt'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate AI comment suggestions',
        description: `
The core feature of CommentAI. Accepts a social media post and returns
one AI-generated comment suggestion per requested tone.

**How it works:**
1. Verifies the Firebase Bearer token and loads the user from the database
2. Checks the user's daily generation limit (FREE = 10/day, PRO+ = unlimited)
3. Fetches any voice samples the user has saved — these are appended to the
   prompt so the AI mirrors the user's personal writing style
4. Calls OpenAI (\`gpt-4o-mini\` for FREE users, \`gpt-4o\` for PRO+)
5. Parses the JSON response into structured suggestions
6. Saves the generation to history and increments the daily counter
7. Returns an array of \`{ tone, text, characterCount }\`

**Platform-specific rules applied by the AI:**
- **LinkedIn** — professional, value-adding, 2–3 sentences
- **Instagram** — casual, emoji-friendly, short
- **Twitter/X** — under 280 characters, witty or insightful
- **YouTube** — enthusiastic, encourages discussion
- **Facebook** — conversational, community-oriented
- **Reddit** — genuine, matches subreddit culture

**Tone modifiers:**
- \`professional\` — formal language, industry terminology
- \`witty\` — clever wordplay, light humour
- \`supportive\` — encouraging, validating
- \`curious\` — asks an insightful question
- \`contrarian\` — respectfully challenges the premise
    `.trim(),
    }),
    (0, swagger_1.ApiBody)({
        type: GenerateCommentsDto,
        examples: {
            linkedin_professional: {
                summary: 'LinkedIn — two tones',
                value: {
                    postText: 'Just launched our new SaaS product after 18 months of building. Grateful for the team that made it happen.',
                    platform: 'linkedin',
                    tones: ['professional', 'witty'],
                },
            },
            twitter_single: {
                summary: 'Twitter — single tone',
                value: {
                    postText: 'Hot take: remote work is more productive than the office and the data proves it.',
                    platform: 'twitter',
                    tones: ['contrarian'],
                },
            },
            instagram_full: {
                summary: 'Instagram — all tones',
                value: {
                    postText: 'New collection just dropped! 🎨 Handmade ceramics inspired by coastal living.',
                    platform: 'instagram',
                    tones: ['supportive', 'curious', 'witty'],
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully generated comment suggestions — one per requested tone.',
        schema: {
            example: {
                suggestions: [
                    {
                        tone: 'PROFESSIONAL',
                        text: 'Congratulations on the launch — 18 months of sustained effort reflects exceptional team discipline. Excited to see the impact this product makes.',
                        characterCount: 152,
                    },
                    {
                        tone: 'WITTY',
                        text: '18 months, zero sleep, and one very caffeinated team later — it\'s live! Congrats on shipping the thing.',
                        characterCount: 104,
                    },
                ],
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'FREE plan daily limit of 10 generations reached. Upgrade to Pro for unlimited access.',
        schema: {
            example: {
                error: 'Daily generation limit reached. Upgrade to Pro for unlimited generations.',
                code: 'LIMIT_REACHED',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Missing or invalid Firebase Bearer token.',
        schema: { example: { error: 'Invalid token', code: 'AUTH_INVALID' } },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, GenerateCommentsDto]),
    __metadata("design:returntype", Promise)
], GenerateController.prototype, "generate", null);
exports.GenerateController = GenerateController = __decorate([
    (0, swagger_1.ApiTags)('generate'),
    (0, common_1.Controller)('generate-comments'),
    __metadata("design:paramtypes", [generate_service_1.GenerateService])
], GenerateController);
//# sourceMappingURL=generate.controller.js.map