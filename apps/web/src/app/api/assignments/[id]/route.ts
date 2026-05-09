import type { NextRequest } from 'next/server';
import { updateAssignment } from '@/lib/server/assignments-server';
import { withApiAuth } from '@/lib/server/with-api-auth';
import { ApiError } from '@/lib/server/auth';

export const runtime = 'nodejs';

function parseNotes(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

function parseStartsOn(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, 10);
  return t.length ? t : null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, async () => {
    const raw = (await req.json()) as { notes?: unknown; starts_on?: unknown };
    const notes = parseNotes(raw.notes);
    const starts_on = parseStartsOn(raw.starts_on);
    if (notes === undefined && starts_on === undefined) {
      throw new ApiError(400, 'Envía notas o fecha de inicio (pueden ser null para borrar).');
    }
    return updateAssignment(id, { notes, starts_on });
  });
}
