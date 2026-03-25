import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Platform } from '@prisma/client';

@Injectable()
export class DraftsService {
  constructor(private prisma: PrismaService) {}

  async save(userId: string, title: string, content: string, platform: string) {
    return this.prisma.savedDraft.create({
      data: {
        userId,
        title,
        content,
        platform: platform.toUpperCase() as Platform,
      },
    });
  }

  async list(userId: string) {
    return this.prisma.savedDraft.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const draft = await this.prisma.savedDraft.findUnique({ where: { id } });
    if (!draft) throw new NotFoundException({ error: 'Draft not found', code: 'NOT_FOUND' });
    if (draft.userId !== userId) throw new ForbiddenException({ error: 'Forbidden', code: 'FORBIDDEN' });
    await this.prisma.savedDraft.delete({ where: { id } });
    return { success: true };
  }
}
