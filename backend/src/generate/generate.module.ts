import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiService } from '../openai/openai.service';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Module({
  controllers: [GenerateController],
  providers: [GenerateService, PrismaService, OpenAiService, FirebaseService, FirebaseAuthGuard],
})
export class GenerateModule {}
