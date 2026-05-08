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
    throw new ApiError(401, 'Falta el token de autorización. Vuelve a iniciar sesión.');
  }
  const token = header.slice('Bearer '.length).trim();
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (!secret) {
    throw new ApiError(500, 'El servidor no puede validar sesiones. Revisa la configuración de autenticación.');
  }
  try {
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],
      clockTolerance: 120,
    }) as SupabaseJwtPayload;
  } catch {
    throw new ApiError(401, 'Tu sesión caducó o el token no es válido. Vuelve a iniciar sesión.');
  }
}
