import type { NextRequest } from 'next/server';
import { deleteDiet, getDietById, updateDiet } from '@/lib/server/diets-server';
import { revalidateNutrimaxReadCaches } from '@/lib/server/read-cache';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, () => getDietById(id));
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, async () => {
    const body: unknown = await req.json();
    const row = await updateDiet(id, body);
    revalidateNutrimaxReadCaches();
    return row;
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, async () => {
    const row = await deleteDiet(id);
    revalidateNutrimaxReadCaches();
    return row;
  });
}
