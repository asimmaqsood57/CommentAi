import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan, User } from '@prisma/client';

const PLAN_LIMITS: Record<Plan, number | null> = {
  FREE: 10,
  PRO: null,
  CREATOR: null,
  TEAM: null,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async syncUser(firebaseUid: string, email: string, name: string) {
    return this.prisma.user.upsert({
      where: { firebaseUid },
      update: { email, name },
      create: { firebaseUid, email, name, plan: 'FREE' },
    });
  }

  async getMe(user: User) {
    const limit = PLAN_LIMITS[user.plan];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      generationsToday: user.generationsToday,
      generationsLimit: limit,
    };
  }
}
