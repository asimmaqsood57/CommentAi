import { CanActivate, ExecutionContext } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class FirebaseAuthGuard implements CanActivate {
    private firebase;
    private prisma;
    constructor(firebase: FirebaseService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
