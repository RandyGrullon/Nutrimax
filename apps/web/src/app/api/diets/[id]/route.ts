import type { NextRequest } from 'next/server';
import { getDietById, updateDiet } from '@/lib/server/diets-server';
import { withApiAuth } from '@/lib/server/with-api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, () => getDietById(id));
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApiAuth(req, async () => {
    const body = (await req.json()) as { name?: string; description?: string; plan?: unknown };
    return updateDiet(id, body);
  });
}
