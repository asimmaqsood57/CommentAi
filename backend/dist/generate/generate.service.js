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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const openai_service_1 = require("../openai/openai.service");
const analytics_service_1 = require("../analytics/analytics.service");
const date_util_1 = require("../common/utils/date.util");
const PLAN_DAILY_LIMIT = {
    FREE: 10,
    PRO: null,
    CREATOR: null,
    TEAM: null,
};
let GenerateService = class GenerateService {
    prisma;
    openai;
    analytics;
    constructor(prisma, openai, analytics) {
        this.prisma = prisma;
        this.openai = openai;
        this.analytics = analytics;
    }
    async generate(user, postText, platform, tones) {
        const needsReset = !(0, date_util_1.isSameDay)(user.lastResetAt, new Date());
        let generationsToday = needsReset ? 0 : user.generationsToday;
        const limit = PLAN_DAILY_LIMIT[user.plan];
        if (limit !== null && generationsToday >= limit) {
            throw new common_1.HttpException({
                error: 'Daily generation limit reached. Upgrade to Pro for unlimited generations.',
                code: 'LIMIT_REACHED',
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const voiceSamples = await this.prisma.voiceSample.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        const voiceContents = voiceSamples.map((v) => v.content);
        const platformEnum = platform.toUpperCase();
        const tonesUpper = tones.map((t) => t.toUpperCase());
        const model = user.plan === 'FREE' ? 'gpt-4o-mini' : 'gpt-4o';
        const suggestions = await this.openai.generateComments(postText, platformEnum, tonesUpper, user.plan, voiceContents);
        await this.prisma.generationHistory.create({
            data: {
                userId: user.id,
                platform: platformEnum,
                tone: tonesUpper[0],
                inputText: postText,
                suggestions: suggestions.map((s) => s.text),
            },
        });
        generationsToday += 1;
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                generationsToday,
                lastResetAt: needsReset ? new Date() : user.lastResetAt,
            },
        });
        this.analytics.track(user.firebaseUid, 'comment_generated', {
            platform: platformEnum,
            tones: tonesUpper,
            model_used: model,
            suggestion_count: suggestions.length,
        });
        return { suggestions };
    }
};
exports.GenerateService = GenerateService;
exports.GenerateService = GenerateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        openai_service_1.OpenAiService,
        analytics_service_1.AnalyticsService])
], GenerateService);
//# sourceMappingURL=generate.service.js.map