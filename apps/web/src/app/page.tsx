import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogOutButton } from '@/components/LogOutButton';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">NutriMax</h1>
          <p className="text-sm text-slate-600">
            {user?.email ? `Sesión: ${user.email}` : 'Profesional'}
          </p>
        </div>
        <LogOutButton />
      </header>
      <nav className="flex flex-col gap-3">
        <Link
          href="/clients"
          className="rounded-xl border border-slate-200 bg-white px-4 py-4 font-medium shadow-sm transition hover:border-brand-500"
        >
          Pacientes
        </Link>
        <Link
          href="/clients/new"
          className="rounded-xl border border-slate-200 bg-white px-4 py-4 font-medium shadow-sm transition hover:border-brand-500"
        >
          Nuevo paciente (asistente)
        </Link>
        <Link
          href="/diets"
          className="rounded-xl border border-slate-200 bg-white px-4 py-4 font-medium shadow-sm transition hover:border-brand-500"
        >
          Dietas
        </Link>
      </nav>
    </main>
  );
}
