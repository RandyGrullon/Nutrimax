import type { NextRequest } from 'next/server';
import { createFood, listFoodsWithCategories } from '@/lib/server/foods-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withApiAuth(req, () => listFoodsWithCategories());
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    return createFood(body);
  });
}
