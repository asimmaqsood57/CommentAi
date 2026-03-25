import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, FirebaseService, FirebaseAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
