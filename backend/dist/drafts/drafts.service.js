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
exports.DraftsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DraftsService = class DraftsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(userId, title, content, platform) {
        return this.prisma.savedDraft.create({
            data: {
                userId,
                title,
                content,
                platform: platform.toUpperCase(),
            },
        });
    }
    async list(userId) {
        return this.prisma.savedDraft.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async remove(userId, id) {
        const draft = await this.prisma.savedDraft.findUnique({ where: { id } });
        if (!draft)
            throw new common_1.NotFoundException({ error: 'Draft not found', code: 'NOT_FOUND' });
        if (draft.userId !== userId)
            throw new common_1.ForbiddenException({ error: 'Forbidden', code: 'FORBIDDEN' });
        await this.prisma.savedDraft.delete({ where: { id } });
        return { success: true };
    }
};
exports.DraftsService = DraftsService;
exports.DraftsService = DraftsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DraftsService);
//# sourceMappingURL=drafts.service.js.map