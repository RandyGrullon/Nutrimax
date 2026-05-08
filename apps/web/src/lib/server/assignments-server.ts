import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { getClientById } from '@/lib/server/clients-server';
import { getDietById } from '@/lib/server/diets-server';

export async function assignDiet(body: {
  client_id: string;
  diet_id: string;
  notes?: string;
  customization?: unknown;
  starts_on?: string;
}): Promise<{ id: string }> {
  await getClientById(body.client_id);
  await getDietById(body.diet_id);

  await dbQuery(
    `UPDATE client_diet_assignments SET status = 'archived', ends_on = COALESCE(ends_on, CURRENT_DATE)
       WHERE client_id = $1 AND status = 'active'`,
    [body.client_id],
  );

  const rows = await dbQuery<{ id: string }>(
    `INSERT INTO client_diet_assignments (
        client_id, diet_id, status, starts_on, notes, customization
      ) VALUES ($1, $2, 'active', $3, $4, $5::jsonb)
      RETURNING id`,
    [
      body.client_id,
      body.diet_id,
      body.starts_on ?? null,
      body.notes ?? null,
      body.customization ? JSON.stringify(body.customization) : null,
    ],
  );

  await dbQuery(
    `INSERT INTO client_timeline_events (client_id, type, title, body, payload)
       VALUES ($1, 'diet_assigned', $2, $3, $4::jsonb)`,
    [
      body.client_id,
      'Dieta asignada',
      body.notes ?? null,
      JSON.stringify({ diet_id: body.diet_id, assignment_id: rows[0].id }),
    ],
  );

  return rows[0];
}

export async function listAssignmentsForClient(clientId: string) {
  await getClientById(clientId);
  return dbQuery(
    `SELECT a.*, d.name AS diet_name
       FROM client_diet_assignments a
       JOIN diets d ON d.id = a.diet_id
       WHERE a.client_id = $1
       ORDER BY a.created_at DESC`,
    [clientId],
  );
}

export async function archiveAssignment(assignmentId: string): Promise<{ ok: boolean }> {
  const row = await dbQueryOne<{ client_id: string }>(
    `UPDATE client_diet_assignments SET status = 'archived', ends_on = CURRENT_DATE
       WHERE id = $1 RETURNING client_id`,
    [assignmentId],
  );
  if (!row) throw new ApiError(404, 'No encontramos esa asignación.');
  await dbQuery(
    `INSERT INTO client_timeline_events (client_id, type, title, body, payload)
       VALUES ($1, 'diet_changed', 'Asignación de dieta archivada', null, $2::jsonb)`,
    [row.client_id, JSON.stringify({ assignment_id: assignmentId })],
  );
  return { ok: true };
}
