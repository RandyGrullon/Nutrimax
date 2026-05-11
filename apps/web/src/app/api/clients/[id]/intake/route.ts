import type { NextRequest } from 'next/server';
import { withApiAuth } from '@/lib/server/with-api-auth';
import { createIntakeToken, getLatestIntakeForClient } from '@/lib/server/client-intake-server';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  return withApiAuth(req, () => getLatestIntakeForClient(id));
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  return withApiAuth(req, () => createIntakeToken(id));
}
