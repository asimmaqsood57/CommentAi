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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const posthog_node_1 = require("posthog-node");
let AnalyticsService = class AnalyticsService {
    config;
    client = null;
    constructor(config) {
        this.config = config;
        const apiKey = this.config.get('POSTHOG_API_KEY');
        if (apiKey) {
            this.client = new posthog_node_1.PostHog(apiKey, {
                host: this.config.get('POSTHOG_HOST') ?? 'https://app.posthog.com',
            });
        }
    }
    track(userId, event, properties) {
        if (!this.client)
            return;
        this.client.capture({ distinctId: userId, event, properties });
    }
    async onModuleDestroy() {
        await this.client?.shutdown();
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map