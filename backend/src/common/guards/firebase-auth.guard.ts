import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private firebase: FirebaseService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ error: 'Missing token', code: 'AUTH_MISSING' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await this.firebase.verifyIdToken(token);
      const user = await this.prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (!user) {
        throw new UnauthorizedException({ error: 'User not synced. Please log out and log in again.', code: 'USER_NOT_FOUND' });
      }

      request.user = user;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('[FirebaseAuthGuard] Token verification failed:', err);
      throw new UnauthorizedException({ error: 'Invalid token', code: 'AUTH_INVALID' });
    }
  }
}
