import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, requireAuth } from '@/lib/server/auth';

export async function withApiAuth(
  req: NextRequest,
  handler: () => Promise<unknown>,
): Promise<NextResponse> {
  try {
    requireAuth(req);
    const data = await handler();
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ message: e.message }, { status: e.status });
    }
    if (e instanceof ZodError) {
      return NextResponse.json({ message: 'Validation error', issues: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
