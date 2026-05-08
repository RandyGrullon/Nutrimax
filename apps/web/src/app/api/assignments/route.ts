import type { NextRequest } from 'next/server';
import { assignDiet } from '@/lib/server/assignments-server';
import { withApiAuth } from '@/lib/server/with-api-auth';
import { ApiError } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return withApiAuth(req, async () => {
    const body = (await req.json()) as {
      client_id?: string;
      diet_id?: string;
      notes?: string;
      customization?: unknown;
      starts_on?: string;
    };
    if (!body.client_id || !body.diet_id) {
      throw new ApiError(400, 'client_id and diet_id required');
    }
    return assignDiet({
      client_id: body.client_id,
      diet_id: body.diet_id,
      notes: body.notes,
      customization: body.customization,
      starts_on: body.starts_on,
    });
  });
}
