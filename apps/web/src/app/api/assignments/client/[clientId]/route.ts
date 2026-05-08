import type { NextRequest } from 'next/server';
import { listAssignmentsForClient } from '@/lib/server/assignments-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await ctx.params;
  return withApiAuth(req, () => listAssignmentsForClient(clientId));
}
