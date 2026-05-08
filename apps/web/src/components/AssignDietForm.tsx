'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dietId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/assignments', {
        method: 'POST',
        body: JSON.stringify({ client_id: clientId, diet_id: dietId, notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNotes('');
      setDietId('');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  if (diets.length === 0) {
    return <p className="text-sm text-slate-600">Crea una dieta en la biblioteca primero.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Asignar dieta
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={dietId}
          onChange={(e) => setDietId(e.target.value)}
        >
          <option value="">—</option>
          {diets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-[2] flex-col gap-1 text-sm">
        Notas
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading || !dietId}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? '…' : 'Asignar'}
      </button>
      {error ? <p className="w-full text-sm text-red-600 sm:col-span-full">{error}</p> : null}
    </form>
  );
}
