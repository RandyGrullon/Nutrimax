import type { NextRequest } from 'next/server';
import { previewMetrics } from '@/lib/server/clients-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    return previewMetrics(body);
  });
}
