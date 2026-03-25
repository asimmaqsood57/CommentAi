import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

const PRODUCT_TO_PLAN: Record<string, Plan> = {
  commentai_pro_monthly: 'PRO',
  commentai_creator_monthly: 'CREATOR',
  commentai_team_monthly: 'TEAM',
};

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async handleRevenueCat(body: any) {
    const event = body?.event;
    if (!event) return { received: true };

    const { type, app_user_id, product_id } = event;
    this.logger.log(`RevenueCat event: ${type} for user ${app_user_id}`);

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE': {
        const plan = PRODUCT_TO_PLAN[product_id] ?? 'PRO';
        await this.prisma.user.updateMany({
          where: { firebaseUid: app_user_id },
          data: { plan },
        });
        break;
      }

      case 'CANCELLATION':
      case 'EXPIRATION': {
        await this.prisma.user.updateMany({
          where: { firebaseUid: app_user_id },
          data: { plan: 'FREE' },
        });
        break;
      }

      default:
        this.logger.log(`Unhandled event type: ${type}`);
    }

    return { received: true };
  }
}
