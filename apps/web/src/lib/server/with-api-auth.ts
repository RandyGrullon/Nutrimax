import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, requireAuth } from '@/lib/server/auth';
import { sanitizeApiDevDetail } from '@/lib/server/sanitize-api-dev-error';

export async function withApiAuth(
  req: NextRequest,
  handler: () => Promise<unknown>,
): Promise<NextResponse> {
  try {
    await requireAuth(req);
    const data = await handler();
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ message: e.message }, { status: e.status });
    }
    if (e instanceof ZodError) {
      return NextResponse.json(
        {
          message: 'Los datos enviados no son válidos. Revisa el formulario.',
          issues: e.flatten(),
        },
        { status: 400 },
      );
    }
    console.error(e);
    const errno = e as NodeJS.ErrnoException & { hostname?: string };
    if (
      e instanceof Error &&
      errno.code === 'ENOTFOUND' &&
      /db\.[^.]+\.supabase\.co/i.test(errno.hostname ?? e.message)
    ) {
      return NextResponse.json(
        {
          message:
            'No se resolvió el host de la base de datos (ENOTFOUND). En Vercel configura DATABASE_URL con el pooler «Transaction» de Supabase (…pooler.supabase.com:6543), no el host db.PROJECT.supabase.co.',
        },
        { status: 503 },
      );
    }
    const isDev = process.env.NODE_ENV === 'development';
    const payload: { message: string; detail?: string } = { message: 'Internal server error' };
    if (isDev && e instanceof Error && e.message) {
      payload.detail = sanitizeApiDevDetail(e.message);
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
