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
exports.VoiceSamplesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const VOICE_SAMPLE_LIMITS = {
    FREE: 0,
    PRO: 5,
    CREATOR: 5,
    TEAM: 5,
};
let VoiceSamplesService = class VoiceSamplesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async add(user, content) {
        const maxSamples = VOICE_SAMPLE_LIMITS[user.plan];
        if (maxSamples === 0) {
            throw new common_1.BadRequestException({
                error: 'Voice samples require a Pro plan or above.',
                code: 'PLAN_REQUIRED',
            });
        }
        const existing = await this.prisma.voiceSample.count({
            where: { userId: user.id },
        });
        if (existing >= maxSamples) {
            throw new common_1.BadRequestException({
                error: `You can have at most ${maxSamples} voice samples.`,
                code: 'VOICE_LIMIT_REACHED',
            });
        }
        return this.prisma.voiceSample.create({
            data: { userId: user.id, content },
        });
    }
    async list(userId) {
        return this.prisma.voiceSample.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async remove(userId, id) {
        const sample = await this.prisma.voiceSample.findUnique({ where: { id } });
        if (!sample)
            throw new common_1.NotFoundException({ error: 'Sample not found', code: 'NOT_FOUND' });
        if (sample.userId !== userId)
            throw new common_1.ForbiddenException({ error: 'Forbidden', code: 'FORBIDDEN' });
        await this.prisma.voiceSample.delete({ where: { id } });
        return { success: true };
    }
};
exports.VoiceSamplesService = VoiceSamplesService;
exports.VoiceSamplesService = VoiceSamplesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VoiceSamplesService);
//# sourceMappingURL=voice-samples.service.js.map