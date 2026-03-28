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
exports.DraftsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const drafts_service_1 = require("./drafts.service");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
class SaveDraftDto {
    title;
    content;
    platform;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        example: 'LinkedIn — product launch comment',
        description: 'Short label used to identify the draft in your saved list.',
    }),
    __metadata("design:type", String)
], SaveDraftDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        example: 'Congratulations on the launch — 18 months of sustained effort reflects exceptional team discipline.',
        description: 'The full comment text to save as a draft.',
    }),
    __metadata("design:type", String)
], SaveDraftDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        example: 'linkedin',
        enum: ['linkedin', 'instagram', 'twitter', 'youtube', 'facebook', 'reddit'],
        description: 'The platform this comment was generated for (used for display/filtering).',
    }),
    __metadata("design:type", String)
], SaveDraftDto.prototype, "platform", void 0);
let DraftsController = class DraftsController {
    draftsService;
    constructor(draftsService) {
        this.draftsService = draftsService;
    }
    async save(user, dto) {
        return this.draftsService.save(user.id, dto.title, dto.content, dto.platform);
    }
    async list(user) {
        return this.draftsService.list(user.id);
    }
    async remove(user, id) {
        return this.draftsService.remove(user.id, id);
    }
};
exports.DraftsController = DraftsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Save a comment as a draft',
        description: `
Saves a generated comment suggestion to the user's draft list for later use.

Drafts are typically created when the user taps "Save as Draft" after
generating comments on the HomeScreen. They can be retrieved later from
the DraftsScreen, copied to clipboard, or deleted.

There is no limit on the number of drafts a user can save.
    `.trim(),
    }),
    (0, swagger_1.ApiBody)({
        type: SaveDraftDto,
        examples: {
            linkedin_draft: {
                summary: 'LinkedIn comment draft',
                value: {
                    title: 'LinkedIn — product launch comment',
                    content: 'Congratulations on the launch — 18 months of sustained effort reflects exceptional team discipline.',
                    platform: 'linkedin',
                },
            },
            twitter_draft: {
                summary: 'Twitter comment draft',
                value: {
                    title: 'Twitter — remote work hot take',
                    content: 'The data doesn\'t lie — async-first teams consistently outperform. Worth revisiting your assumptions here.',
                    platform: 'twitter',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Draft saved successfully. Returns the created draft object.',
        schema: {
            example: {
                id: 'clxyz789ghi',
                userId: 'clxyz123abc',
                title: 'LinkedIn — product launch comment',
                content: 'Congratulations on the launch — 18 months of sustained effort reflects exceptional team discipline.',
                platform: 'LINKEDIN',
                createdAt: '2026-03-25T10:30:00.000Z',
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
    __metadata("design:paramtypes", [Object, SaveDraftDto]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "save", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all saved drafts',
        description: `
Returns all drafts saved by the authenticated user, ordered by most recent first.

Used to populate the DraftsScreen in the app. Each draft includes its title,
content, platform, and creation timestamp. Tap to copy, swipe to delete.
    `.trim(),
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Array of drafts ordered by newest first. Empty array if no drafts exist.',
        schema: {
            example: [
                {
                    id: 'clxyz789ghi',
                    userId: 'clxyz123abc',
                    title: 'LinkedIn — product launch comment',
                    content: 'Congratulations on the launch — 18 months of sustained effort.',
                    platform: 'LINKEDIN',
                    createdAt: '2026-03-25T10:30:00.000Z',
                },
                {
                    id: 'clxyz000jkl',
                    userId: 'clxyz123abc',
                    title: 'Twitter — remote work hot take',
                    content: 'The data doesn\'t lie — async-first teams consistently outperform.',
                    platform: 'TWITTER',
                    createdAt: '2026-03-24T08:15:00.000Z',
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Missing or invalid Firebase Bearer token.',
        schema: { example: { error: 'Invalid token', code: 'AUTH_INVALID' } },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a draft',
        description: `
Permanently deletes a draft by its ID.

Only the owner of the draft can delete it — if the draft belongs to
a different user, a 403 Forbidden is returned. If the ID doesn't exist,
a 404 is returned.

Triggered in the app when the user swipes a draft row to the left.
    `.trim(),
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'The unique ID of the draft to delete (cuid format)',
        example: 'clxyz789ghi',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Draft deleted successfully.',
        schema: { example: { success: true } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Draft not found.',
        schema: { example: { error: 'Draft not found', code: 'NOT_FOUND' } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'You do not own this draft.',
        schema: { example: { error: 'Forbidden', code: 'FORBIDDEN' } },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "remove", null);
exports.DraftsController = DraftsController = __decorate([
    (0, swagger_1.ApiTags)('drafts'),
    (0, common_1.Controller)('drafts'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, swagger_1.ApiBearerAuth)('firebase-jwt'),
    __metadata("design:paramtypes", [drafts_service_1.DraftsService])
], DraftsController);
//# sourceMappingURL=drafts.controller.js.map