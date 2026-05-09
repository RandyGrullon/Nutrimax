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

  const alreadyActive = await dbQueryOne<{ id: string }>(
    `SELECT id FROM client_diet_assignments
       WHERE client_id = $1 AND diet_id = $2 AND status = 'active'`,
    [body.client_id, body.diet_id],
  );
  if (alreadyActive) {
    throw new ApiError(
      409,
      'Esta dieta ya está asignada de forma activa a este paciente. Archiva la asignación actual si quieres cambiar de plan, o elige otra dieta.',
    );
  }

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

export type ClientAssignmentDbRow = {
  id: string;
  client_id: string;
  diet_id: string;
  diet_name: string;
  meal_plan_id: string | null;
  meal_plan_name: string | null;
  status: string;
  notes: string | null;
  starts_on: string | null;
  created_at: Date | string;
  ends_on?: string | null;
};

export async function listAssignmentsForClient(clientId: string): Promise<ClientAssignmentDbRow[]> {
  await getClientById(clientId);
  return dbQuery<ClientAssignmentDbRow>(
    `SELECT a.*, d.name AS diet_name, d.meal_plan_id,
            mp.name AS meal_plan_name
       FROM client_diet_assignments a
       JOIN diets d ON d.id = a.diet_id
       LEFT JOIN meal_plans mp ON mp.id = d.meal_plan_id
       WHERE a.client_id = $1
       ORDER BY a.created_at DESC`,
    [clientId],
  );
}

export async function updateAssignment(
  assignmentId: string,
  body: { notes?: string | null; starts_on?: string | null },
): Promise<{ id: string }> {
  const row = await dbQueryOne<{
    id: string;
    client_id: string;
    status: string;
    notes: string | null;
    starts_on: string | null;
  }>(
    `SELECT id, client_id, status, notes, starts_on FROM client_diet_assignments WHERE id = $1`,
    [assignmentId],
  );
  if (!row) throw new ApiError(404, 'No encontramos esa asignación.');
  if (row.status !== 'active') {
    throw new ApiError(400, 'Solo se pueden editar asignaciones activas.');
  }
  if (body.notes === undefined && body.starts_on === undefined) {
    throw new ApiError(400, 'Indica notas o fecha de inicio para actualizar.');
  }

  const nextNotes = body.notes !== undefined ? body.notes : row.notes;
  const nextStarts = body.starts_on !== undefined ? body.starts_on : row.starts_on;

  await dbQuery(
    `UPDATE client_diet_assignments SET notes = $1, starts_on = $2 WHERE id = $3`,
    [nextNotes, nextStarts, assignmentId],
  );

  await dbQuery(
    `INSERT INTO client_timeline_events (client_id, type, title, body, payload)
       VALUES ($1, 'diet_changed', $2, $3, $4::jsonb)`,
    [
      row.client_id,
      'Asignación de dieta actualizada',
      nextNotes,
      JSON.stringify({ assignment_id: assignmentId }),
    ],
  );

  return { id: assignmentId };
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
