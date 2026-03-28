import { PrismaService } from '../prisma/prisma.service';
export declare class DraftsService {
    private prisma;
    constructor(prisma: PrismaService);
    save(userId: string, title: string, content: string, platform: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        content: string;
        userId: string;
        platform: import(".prisma/client").$Enums.Platform;
    }>;
    list(userId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        content: string;
        userId: string;
        platform: import(".prisma/client").$Enums.Platform;
    }[]>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
    }>;
}
