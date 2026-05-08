import type { NextRequest } from 'next/server';
import { getTimeline } from '@/lib/server/clients-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, () => getTimeline(id));
}
