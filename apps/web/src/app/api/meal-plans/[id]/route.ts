import type { NextRequest } from 'next/server';
import { deleteMealPlan, getMealPlanById, updateMealPlan } from '@/lib/server/meal-plans-server';
import { revalidateNutrimaxReadCaches } from '@/lib/server/read-cache';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, () => getMealPlanById(id));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    const row = await updateMealPlan(id, body);
    revalidateNutrimaxReadCaches();
    return row;
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, async () => {
    const row = await deleteMealPlan(id);
    revalidateNutrimaxReadCaches();
    return row;
  });
}
