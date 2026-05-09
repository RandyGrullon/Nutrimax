import type { NextRequest } from 'next/server';
import { addClientProgressSnapshot, listClientProgressSnapshots } from '@/lib/server/progress-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, () => listClientProgressSnapshots(id));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    return addClientProgressSnapshot(id, body);
  });
}
