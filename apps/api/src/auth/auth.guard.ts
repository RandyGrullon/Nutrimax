import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const token = header.slice('Bearer '.length).trim();
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Server misconfigured: SUPABASE_JWT_SECRET');
    }
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as SupabaseJwtPayload;
      (req as Request & { user: SupabaseJwtPayload }).user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
