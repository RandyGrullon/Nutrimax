import type { NextRequest } from 'next/server';
import { archiveAssignment } from '@/lib/server/assignments-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, () => archiveAssignment(id));
}
