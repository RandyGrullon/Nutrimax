import type { NextRequest } from 'next/server';
import { createDiet, listDiets } from '@/lib/server/diets-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withApiAuth(req, () => listDiets());
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    return createDiet(body);
  });
}
