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
exports.FirebaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../firebase/firebase.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let FirebaseAuthGuard = class FirebaseAuthGuard {
    firebase;
    prisma;
    constructor(firebase, prisma) {
        this.firebase = firebase;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException({ error: 'Missing token', code: 'AUTH_MISSING' });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = await this.firebase.verifyIdToken(token);
            const user = await this.prisma.user.findUnique({
                where: { firebaseUid: decoded.uid },
            });
            if (!user) {
                throw new common_1.UnauthorizedException({ error: 'User not synced. Please log out and log in again.', code: 'USER_NOT_FOUND' });
            }
            request.user = user;
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException)
                throw err;
            console.error('[FirebaseAuthGuard] Token verification failed:', err);
            throw new common_1.UnauthorizedException({ error: 'Invalid token', code: 'AUTH_INVALID' });
        }
    }
};
exports.FirebaseAuthGuard = FirebaseAuthGuard;
exports.FirebaseAuthGuard = FirebaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        prisma_service_1.PrismaService])
], FirebaseAuthGuard);
//# sourceMappingURL=firebase-auth.guard.js.map