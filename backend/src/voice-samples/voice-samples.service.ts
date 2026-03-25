import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan, User } from '@prisma/client';

const VOICE_SAMPLE_LIMITS: Record<Plan, number> = {
  FREE: 0,
  PRO: 5,
  CREATOR: 5,
  TEAM: 5,
};

@Injectable()
export class VoiceSamplesService {
  constructor(private prisma: PrismaService) {}

  async add(user: User, content: string) {
    const maxSamples = VOICE_SAMPLE_LIMITS[user.plan];
    if (maxSamples === 0) {
      throw new BadRequestException({
        error: 'Voice samples require a Pro plan or above.',
        code: 'PLAN_REQUIRED',
      });
    }

    const existing = await this.prisma.voiceSample.count({
      where: { userId: user.id },
    });

    if (existing >= maxSamples) {
      throw new BadRequestException({
        error: `You can have at most ${maxSamples} voice samples.`,
        code: 'VOICE_LIMIT_REACHED',
      });
    }

    return this.prisma.voiceSample.create({
      data: { userId: user.id, content },
    });
  }

  async list(userId: string) {
    return this.prisma.voiceSample.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const sample = await this.prisma.voiceSample.findUnique({ where: { id } });
    if (!sample) throw new NotFoundException({ error: 'Sample not found', code: 'NOT_FOUND' });
    if (sample.userId !== userId) throw new ForbiddenException({ error: 'Forbidden', code: 'FORBIDDEN' });
    await this.prisma.voiceSample.delete({ where: { id } });
    return { success: true };
  }
}
