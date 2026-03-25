import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
export declare class FirebaseService implements OnModuleInit {
    private config;
    private app;
    constructor(config: ConfigService);
    onModuleInit(): void;
    verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken>;
}
