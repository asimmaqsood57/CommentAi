import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class VoiceSamplesService {
    private prisma;
    constructor(prisma: PrismaService);
    add(user: User, content: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        userId: string;
    }>;
    list(userId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        userId: string;
    }[]>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
    }>;
}
