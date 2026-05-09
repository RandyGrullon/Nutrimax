import type { NextRequest } from 'next/server';
import { createFood, listFoodsWithCategories } from '@/lib/server/foods-server';
import { revalidateNutrimaxReadCaches } from '@/lib/server/read-cache';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withApiAuth(req, () => listFoodsWithCategories());
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    const row = await createFood(body);
    revalidateNutrimaxReadCaches();
    return row;
  });
}
