import { UsersService } from './users.service';
import type { User } from '@prisma/client';
declare class SyncUserDto {
    firebaseUid: string;
    email: string;
    name: string;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    sync(dto: SyncUserDto): Promise<{
        id: string;
        firebaseUid: string;
        email: string;
        name: string;
        plan: import(".prisma/client").$Enums.Plan;
        generationsToday: number;
        lastResetAt: Date;
        createdAt: Date;
    }>;
    me(user: User): Promise<{
        id: string;
        email: string;
        name: string;
        plan: import(".prisma/client").$Enums.Plan;
        generationsToday: number;
        generationsLimit: number | null;
    }>;
}
export {};
