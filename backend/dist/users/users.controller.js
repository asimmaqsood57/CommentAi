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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const users_service_1 = require("./users.service");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
class SyncUserDto {
    firebaseUid;
    email;
    name;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        example: 'uid_abc123XYZ',
        description: 'Firebase UID obtained from the client SDK after sign-in',
    }),
    __metadata("design:type", String)
], SyncUserDto.prototype, "firebaseUid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        example: 'john@example.com',
        description: 'User email address from Firebase Auth',
    }),
    __metadata("design:type", String)
], SyncUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        example: 'John Doe',
        description: 'Display name from Firebase Auth (Google profile or manually set)',
    }),
    __metadata("design:type", String)
], SyncUserDto.prototype, "name", void 0);
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async sync(dto) {
        return this.usersService.syncUser(dto.firebaseUid, dto.email, dto.name);
    }
    async me(user) {
        return this.usersService.getMe(user);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({
        summary: 'Sync user after Firebase sign-in',
        description: `
Called immediately after a successful Firebase sign-in on the client.
Creates a new user in PostgreSQL if they don't exist yet, or updates
their email/name if they do (upsert by \`firebaseUid\`).

This must be called before any authenticated endpoint, since the
Firebase Auth Guard looks up the user by \`firebaseUid\` in the database.

**No auth header required** — this is the first call after login.
    `.trim(),
    }),
    (0, swagger_1.ApiBody)({
        type: SyncUserDto,
        examples: {
            google_signin: {
                summary: 'Google Sign-In',
                value: {
                    firebaseUid: 'uid_google_abc123',
                    email: 'john@gmail.com',
                    name: 'John Doe',
                },
            },
            email_signup: {
                summary: 'Email / Password Sign-Up',
                value: {
                    firebaseUid: 'uid_email_xyz789',
                    email: 'jane@company.com',
                    name: 'Jane Smith',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User successfully created or updated. Returns the full user record.',
        schema: {
            example: {
                id: 'clxyz123abc',
                firebaseUid: 'uid_google_abc123',
                email: 'john@gmail.com',
                name: 'John Doe',
                plan: 'FREE',
                generationsToday: 0,
                lastResetAt: '2026-03-25T00:00:00.000Z',
                createdAt: '2026-03-25T10:00:00.000Z',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SyncUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "sync", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, swagger_1.ApiBearerAuth)('firebase-jwt'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current user profile',
        description: `
Returns the authenticated user's profile including their active plan,
how many comment generations they've used today, and the daily limit
for their plan.

**Plan limits:**
- FREE: 10 generations/day
- PRO / CREATOR / TEAM: unlimited (generationsLimit = null)

Use this endpoint to render the usage progress bar and plan badge in the app.
    `.trim(),
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User profile with plan and daily usage info.',
        schema: {
            examples: {
                free_user: {
                    summary: 'FREE plan user',
                    value: {
                        id: 'clxyz123abc',
                        email: 'john@gmail.com',
                        name: 'John Doe',
                        plan: 'FREE',
                        generationsToday: 4,
                        generationsLimit: 10,
                    },
                },
                pro_user: {
                    summary: 'PRO plan user',
                    value: {
                        id: 'clxyz456def',
                        email: 'jane@company.com',
                        name: 'Jane Smith',
                        plan: 'PRO',
                        generationsToday: 42,
                        generationsLimit: null,
                    },
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "me", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map