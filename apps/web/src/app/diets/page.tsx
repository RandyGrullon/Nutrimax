'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch, apiJson } from '@/lib/api';

interface DietRow {
  id: string;
  name: string;
  description: string | null;
}

export default function DietsPage() {
  const [diets, setDiets] = useState<DietRow[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiJson<DietRow[]>('/diets');
      setDiets(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiFetch('/diets', {
        method: 'POST',
        body: JSON.stringify({ name, description, plan: {} }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName('');
      setDescription('');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dietas</h1>
        <Link href="/" className="text-sm text-brand-700 underline">
          Inicio
        </Link>
      </div>

      <form onSubmit={onCreate} className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input className="rounded-lg border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Descripción
          <textarea className="rounded-lg border border-slate-300 px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm text-white">
          Crear dieta
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {diets.map((d) => (
          <li key={d.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <span className="font-medium">{d.name}</span>
            {d.description ? <p className="mt-1 text-slate-600">{d.description}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
