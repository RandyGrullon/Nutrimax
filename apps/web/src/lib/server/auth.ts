import type { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function requireAuth(req: NextRequest): SupabaseJwtPayload {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing Bearer token');
  }
  const token = header.slice('Bearer '.length).trim();
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, 'Server misconfigured: SUPABASE_JWT_SECRET');
  }
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as SupabaseJwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}
