import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleRevenueCat(body: any): Promise<{
        received: boolean;
    }>;
}
