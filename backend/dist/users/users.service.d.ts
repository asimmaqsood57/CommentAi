import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    syncUser(firebaseUid: string, email: string, name: string): Promise<{
        id: string;
        firebaseUid: string;
        email: string;
        name: string;
        plan: import(".prisma/client").$Enums.Plan;
        generationsToday: number;
        lastResetAt: Date;
        createdAt: Date;
    }>;
    getMe(user: User): Promise<{
        id: string;
        email: string;
        name: string;
        plan: import(".prisma/client").$Enums.Plan;
        generationsToday: number;
        generationsLimit: number | null;
    }>;
}
