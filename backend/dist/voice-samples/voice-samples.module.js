"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceSamplesModule = void 0;
const common_1 = require("@nestjs/common");
const voice_samples_controller_1 = require("./voice-samples.controller");
const voice_samples_service_1 = require("./voice-samples.service");
const prisma_service_1 = require("../prisma/prisma.service");
const firebase_service_1 = require("../firebase/firebase.service");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
let VoiceSamplesModule = class VoiceSamplesModule {
};
exports.VoiceSamplesModule = VoiceSamplesModule;
exports.VoiceSamplesModule = VoiceSamplesModule = __decorate([
    (0, common_1.Module)({
        controllers: [voice_samples_controller_1.VoiceSamplesController],
        providers: [voice_samples_service_1.VoiceSamplesService, prisma_service_1.PrismaService, firebase_service_1.FirebaseService, firebase_auth_guard_1.FirebaseAuthGuard],
    })
], VoiceSamplesModule);
//# sourceMappingURL=voice-samples.module.js.map