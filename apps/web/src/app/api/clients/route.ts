import type { NextRequest } from 'next/server';
import { createClient, listClients } from '@/lib/server/clients-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withApiAuth(req, () => listClients());
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    return createClient(body);
  });
}
