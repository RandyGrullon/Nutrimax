import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ClientsService } from '../clients/clients.service';
import { DietsService } from '../diets/diets.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly clients: ClientsService,
    private readonly diets: DietsService,
  ) {}

  async assign(body: {
    client_id: string;
    diet_id: string;
    notes?: string;
    customization?: unknown;
    starts_on?: string;
  }) {
    await this.clients.getById(body.client_id);
    await this.diets.getById(body.diet_id);

    const dup = await this.db.queryOne<{ id: string }>(
      `SELECT id FROM client_diet_assignments
         WHERE client_id = $1 AND diet_id = $2 AND status = 'active'`,
      [body.client_id, body.diet_id],
    );
    if (dup) {
      throw new ConflictException(
        'Esta dieta ya está asignada de forma activa a este paciente.',
      );
    }

    await this.db.query(
      `UPDATE client_diet_assignments SET status = 'archived', ends_on = COALESCE(ends_on, CURRENT_DATE)
       WHERE client_id = $1 AND status = 'active'`,
      [body.client_id],
    );

    const rows = await this.db.query<{ id: string }>(
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

    await this.db.query(
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

  async listForClient(clientId: string) {
    await this.clients.getById(clientId);
    return this.db.query(
      `SELECT a.*, d.name AS diet_name
       FROM client_diet_assignments a
       JOIN diets d ON d.id = a.diet_id
       WHERE a.client_id = $1
       ORDER BY a.created_at DESC`,
      [clientId],
    );
  }

  async archive(assignmentId: string) {
    const row = await this.db.queryOne<{ client_id: string }>(
      `UPDATE client_diet_assignments SET status = 'archived', ends_on = CURRENT_DATE
       WHERE id = $1 RETURNING client_id`,
      [assignmentId],
    );
    if (!row) throw new NotFoundException('Assignment not found');
    await this.db.query(
      `INSERT INTO client_timeline_events (client_id, type, title, body, payload)
       VALUES ($1, 'diet_changed', 'Asignación de dieta archivada', null, $2::jsonb)`,
      [row.client_id, JSON.stringify({ assignment_id: assignmentId })],
    );
    return { ok: true };
  }
}
