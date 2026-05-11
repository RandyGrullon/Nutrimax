import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { getClientById } from '@/lib/server/clients-server';

export interface ClientIntakeTokenRow {
  id: string;
  client_id: string;
  token: string;
  status: 'pending' | 'completed' | 'expired';
  created_at: Date;
  expires_at: Date;
  completed_at: Date | null;
  preferences_data: unknown;
}

export async function createIntakeToken(clientId: string): Promise<ClientIntakeTokenRow> {
  await getClientById(clientId);

  // Inactivar tokens pendientes previos
  await dbQuery(
    `UPDATE client_intake_tokens SET status = 'expired'
       WHERE client_id = $1 AND status = 'pending'`,
    [clientId],
  );

  const rows = await dbQuery<ClientIntakeTokenRow>(
    `INSERT INTO client_intake_tokens (client_id)
       VALUES ($1)
       RETURNING *`,
    [clientId],
  );
  return rows[0];
}

export async function getIntakeTokenByValue(tokenValue: string): Promise<ClientIntakeTokenRow> {
  const row = await dbQueryOne<ClientIntakeTokenRow>(
    `SELECT * FROM client_intake_tokens WHERE token = $1`,
    [tokenValue],
  );
  if (!row) throw new ApiError(404, 'Enlace no válido o expirado.');
  if (row.status !== 'pending') throw new ApiError(403, 'Este formulario ya ha sido completado o ha caducado.');
  if (new Date(row.expires_at) < new Date()) {
    await dbQuery(`UPDATE client_intake_tokens SET status = 'expired' WHERE id = $1`, [row.id]);
    throw new ApiError(403, 'El enlace ha caducado.');
  }
  return row;
}

export async function submitIntakeForm(tokenValue: string, preferencesData: unknown): Promise<void> {
  const token = await getIntakeTokenByValue(tokenValue);

  await dbQuery(
    `UPDATE client_intake_tokens SET
        status = 'completed',
        completed_at = NOW(),
        preferences_data = $1::jsonb
      WHERE id = $2`,
    [JSON.stringify(preferencesData), token.id],
  );

  await dbQuery(
    `INSERT INTO client_timeline_events (client_id, type, title, body, payload)
       VALUES ($1, 'intake_completed', 'Formulario de preferencias completado', 'El paciente ha seleccionado sus alimentos preferidos.', $2::jsonb)`,
    [token.client_id, JSON.stringify({ token_id: token.id })],
  );
}

export async function getLatestIntakeForClient(clientId: string): Promise<ClientIntakeTokenRow | null> {
  const row = await dbQueryOne<ClientIntakeTokenRow>(
    `SELECT * FROM client_intake_tokens
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
    [clientId],
  );
  return row ?? null;
}
