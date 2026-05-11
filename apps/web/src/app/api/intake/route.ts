import { NextRequest, NextResponse } from 'next/server';
import { submitIntakeForm, getIntakeTokenByValue } from '@/lib/server/client-intake-server';

export const runtime = 'nodejs';

/** Obtener info del token (público) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 });

  try {
    const row = await getIntakeTokenByValue(token);
    return NextResponse.json(row);
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return NextResponse.json({ error: err.message || 'Error' }, { status: err.status || 500 });
  }
}

/** Enviar formulario (público) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, preferences } = body;
    if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 });

    await submitIntakeForm(token, preferences);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return NextResponse.json({ error: err.message || 'Error' }, { status: err.status || 500 });
  }
}
