import type { NextRequest } from 'next/server';
import { createMealPlan, listMealPlans } from '@/lib/server/meal-plans-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withApiAuth(req, () => listMealPlans());
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    return createMealPlan(body);
  });
}
