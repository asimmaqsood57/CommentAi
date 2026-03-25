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
exports.VoiceSamplesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const voice_samples_service_1 = require("./voice-samples.service");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
class AddVoiceSampleDto {
    content;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Really insightful breakdown — the point about async communication resonates deeply with distributed teams.',
        description: `
A real comment you have previously written on social media.
The AI uses these samples to learn your vocabulary, sentence structure,
and overall writing style, then mirrors it when generating new comments.
    `.trim(),
    }),
    __metadata("design:type", String)
], AddVoiceSampleDto.prototype, "content", void 0);
let VoiceSamplesController = class VoiceSamplesController {
    voiceSamplesService;
    constructor(voiceSamplesService) {
        this.voiceSamplesService = voiceSamplesService;
    }
    async add(user, dto) {
        return this.voiceSamplesService.add(user, dto.content);
    }
    async list(user) {
        return this.voiceSamplesService.list(user.id);
    }
    async remove(user, id) {
        return this.voiceSamplesService.remove(user.id, id);
    }
};
exports.VoiceSamplesController = VoiceSamplesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Add a voice sample',
        description: `
Adds a writing sample to the user's voice profile. Voice samples are
real comments the user has written in the past. The AI uses them as
style references when generating new comment suggestions — producing
output that sounds like **you**, not a generic bot.

**Plan restrictions:**
- FREE: voice samples are not available
- PRO / CREATOR / TEAM: up to 5 samples

When the \`/api/generate-comments\` endpoint runs, it fetches all saved
voice samples for the user and appends them to the OpenAI system prompt.

Returns 400 if the user is on the FREE plan or already has 5 samples.
    `.trim(),
    }),
    (0, swagger_1.ApiBody)({
        type: AddVoiceSampleDto,
        examples: {
            linkedin_sample: {
                summary: 'LinkedIn-style comment',
                value: {
                    content: 'Really insightful breakdown — the point about async communication resonates deeply with distributed teams. This is exactly the kind of nuance that gets lost in most productivity discussions.',
                },
            },
            twitter_sample: {
                summary: 'Twitter-style comment',
                value: {
                    content: 'Counterpoint: the "productivity" argument ignores that innovation requires serendipitous hallway conversations. Hard to replicate on Slack.',
                },
            },
            supportive_sample: {
                summary: 'Supportive / encouraging style',
                value: {
                    content: 'This is such a bold move and I love it. Takes real courage to ship something this different — rooting for you!',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Voice sample added successfully.',
        schema: {
            example: {
                id: 'clxyzabc111',
                userId: 'clxyz123abc',
                content: 'Really insightful breakdown — the point about async communication resonates deeply with distributed teams.',
                createdAt: '2026-03-25T11:00:00.000Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Either the user is on FREE plan (no voice samples allowed) or the 5-sample limit is already reached.',
        schema: {
            examples: {
                plan_required: {
                    summary: 'FREE plan restriction',
                    value: { error: 'Voice samples require a Pro plan or above.', code: 'PLAN_REQUIRED' },
                },
                limit_reached: {
                    summary: '5-sample limit hit',
                    value: { error: 'You can have at most 5 voice samples.', code: 'VOICE_LIMIT_REACHED' },
                },
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
    __metadata("design:paramtypes", [Object, AddVoiceSampleDto]),
    __metadata("design:returntype", Promise)
], VoiceSamplesController.prototype, "add", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all voice samples',
        description: `
Returns all voice samples saved by the authenticated user, ordered by
most recently added first.

Displayed in the VoiceSamplesScreen in the app. If the user has at least
one sample, a "My Voice Trained" badge is shown. The samples are also
automatically included in every \`/api/generate-comments\` call.
    `.trim(),
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Array of voice samples, newest first. Empty array if none saved.',
        schema: {
            example: [
                {
                    id: 'clxyzabc111',
                    userId: 'clxyz123abc',
                    content: 'Really insightful breakdown — the point about async communication resonates deeply.',
                    createdAt: '2026-03-25T11:00:00.000Z',
                },
                {
                    id: 'clxyzabc222',
                    userId: 'clxyz123abc',
                    content: 'Counterpoint: the productivity argument ignores serendipitous hallway conversations.',
                    createdAt: '2026-03-24T09:00:00.000Z',
                },
            ],
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceSamplesController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a voice sample',
        description: `
Permanently removes a voice sample by ID. Only the owner can delete their own samples.

Once deleted, the sample will no longer be included in future
\`/api/generate-comments\` AI prompts. If this was the last sample,
the "My Voice Trained" badge is removed in the app.
    `.trim(),
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'The unique ID of the voice sample to delete (cuid format)',
        example: 'clxyzabc111',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Voice sample deleted successfully.',
        schema: { example: { success: true } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Voice sample not found.',
        schema: { example: { error: 'Sample not found', code: 'NOT_FOUND' } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'You do not own this voice sample.',
        schema: { example: { error: 'Forbidden', code: 'FORBIDDEN' } },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VoiceSamplesController.prototype, "remove", null);
exports.VoiceSamplesController = VoiceSamplesController = __decorate([
    (0, swagger_1.ApiTags)('voice-samples'),
    (0, common_1.Controller)('voice-samples'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, swagger_1.ApiBearerAuth)('firebase-jwt'),
    __metadata("design:paramtypes", [voice_samples_service_1.VoiceSamplesService])
], VoiceSamplesController);
//# sourceMappingURL=voice-samples.controller.js.map