import { DraftsService } from './drafts.service';
import type { User } from '@prisma/client';
declare class SaveDraftDto {
    title: string;
    content: string;
    platform: string;
}
export declare class DraftsController {
    private readonly draftsService;
    constructor(draftsService: DraftsService);
    save(user: User, dto: SaveDraftDto): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        content: string;
        platform: import(".prisma/client").$Enums.Platform;
        userId: string;
    }>;
    list(user: User): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        content: string;
        platform: import(".prisma/client").$Enums.Platform;
        userId: string;
    }[]>;
    remove(user: User, id: string): Promise<{
        success: boolean;
    }>;
}
export {};
