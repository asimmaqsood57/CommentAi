import { VoiceSamplesService } from './voice-samples.service';
import type { User } from '@prisma/client';
declare class AddVoiceSampleDto {
    content: string;
}
export declare class VoiceSamplesController {
    private readonly voiceSamplesService;
    constructor(voiceSamplesService: VoiceSamplesService);
    add(user: User, dto: AddVoiceSampleDto): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        userId: string;
    }>;
    list(user: User): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        userId: string;
    }[]>;
    remove(user: User, id: string): Promise<{
        success: boolean;
    }>;
}
export {};
