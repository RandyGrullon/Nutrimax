'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch } from '@/lib/api';

export function AssignDietForm({
  clientId,
  diets,
}: {
  clientId: string;
  diets: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [dietId, setDietId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dietId) {
      showErrorToast('Selecciona una dieta para asignar.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/assignments', {
        method: 'POST',
        body: JSON.stringify({ client_id: clientId, diet_id: dietId, notes }),
      });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      setNotes('');
      setDietId('');
      showSuccessToast('Dieta asignada correctamente.');
      router.refresh();
    } catch {
      showErrorToast('No pudimos asignar la dieta.');
    } finally {
      setLoading(false);
    }
  }

  if (diets.length === 0) {
    return <p className="text-sm text-muted-foreground">Crea una dieta en la biblioteca primero.</p>;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-end"
    >
      <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-foreground">
        Asignar dieta
        <Select value={dietId} onChange={(e) => setDietId(e.target.value)}>
          <option value="">—</option>
          {diets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-[2] flex-col gap-1.5 text-sm font-medium text-foreground">
        Notas
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Button type="submit" variant="primary" disabled={loading || !dietId} loading={loading}>
        Asignar
      </Button>
    </form>
  );
}
