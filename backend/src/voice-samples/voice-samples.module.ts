import { Module } from '@nestjs/common';
import { VoiceSamplesController } from './voice-samples.controller';
import { VoiceSamplesService } from './voice-samples.service';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Module({
  controllers: [VoiceSamplesController],
  providers: [VoiceSamplesService, PrismaService, FirebaseService, FirebaseAuthGuard],
})
export class VoiceSamplesModule {}
