import { Module } from '@nestjs/common';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Module({
  controllers: [DraftsController],
  providers: [DraftsService, PrismaService, FirebaseService, FirebaseAuthGuard],
})
export class DraftsModule {}
