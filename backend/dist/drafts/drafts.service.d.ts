import { PrismaService } from '../prisma/prisma.service';
export declare class DraftsService {
    private prisma;
    constructor(prisma: PrismaService);
    save(userId: string, title: string, content: string, platform: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        userId: string;
        platform: import(".prisma/client").$Enums.Platform;
        title: string;
    }>;
    list(userId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        userId: string;
        platform: import(".prisma/client").$Enums.Platform;
        title: string;
    }[]>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
    }>;
}
