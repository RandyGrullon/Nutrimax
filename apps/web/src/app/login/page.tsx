'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <h1 className="mb-2 text-2xl font-semibold text-brand-900">NutriMax</h1>
      <p className="mb-6 text-sm text-slate-600">
        Inicia sesión con tu cuenta de Supabase Auth.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Contraseña</span>
          <input
            type="password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-700 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Registrarse'}
        </button>
        <button
          type="button"
          className="text-sm text-brand-700 underline"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? '¿Sin cuenta? Registrarse' : '¿Ya tienes cuenta? Entrar'}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-slate-500">
        <Link href="/" className="underline">
          Volver
        </Link>
      </p>
    </main>
  );
}
