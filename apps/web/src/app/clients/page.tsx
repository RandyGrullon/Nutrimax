import Link from 'next/link';
import { apiServerJson } from '@/lib/api-server';

export interface ClientRow {
  id: string;
  full_name: string;
  email: string | null;
  updated_at: string;
}

export default async function ClientsPage() {
  let clients: ClientRow[] = [];
  let err: string | null = null;
  try {
    clients = await apiServerJson<ClientRow[]>('/clients');
  } catch (e: unknown) {
    err = e instanceof Error ? e.message : 'Error al cargar';
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Pacientes</h1>
        <Link href="/clients/new" className="rounded-lg bg-brand-700 px-3 py-2 text-sm text-white">
          Nuevo
        </Link>
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <ul className="flex flex-col gap-2">
        {clients.map((c) => (
          <li key={c.id}>
            <Link
              href={`/clients/${c.id}`}
              className="block rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-brand-500"
            >
              <span className="font-medium">{c.full_name}</span>
              {c.email ? (
                <span className="mt-1 block text-xs text-slate-500">{c.email}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      {clients.length === 0 && !err ? (
        <p className="text-sm text-slate-600">No hay pacientes aún.</p>
      ) : null}
      <Link href="/" className="mt-8 inline-block text-sm text-brand-700 underline">
        Inicio
      </Link>
    </main>
  );
}
