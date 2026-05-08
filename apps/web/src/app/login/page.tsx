'use client';

import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { showErrorToast } from '@/lib/errors';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim();
    const pw = password.trim();
    if (!em) {
      showErrorToast('Introduce tu correo electrónico.');
      return;
    }
    if (!pw || pw.length < 6) {
      showErrorToast('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: em, password: pw });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email: em, password: pw });
        if (err) throw err;
      }
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string'
          ? (err as { message: string }).message
          : 'No pudimos completar el acceso. Revisa tus datos.';
      showErrorToast(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">NutriMax</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inicia sesión con tu cuenta de Supabase Auth.</p>
      </div>
      <Card className="p-0 shadow-card dark:shadow-card-dark">
        <CardHeader className="border-b border-border p-5">
          <CardTitle>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Accede al panel de profesionales.' : 'Registro con email y contraseña.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Email</span>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Contraseña</span>
              <Input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              {mode === 'login' ? 'Entrar' : 'Registrarse'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? '¿Sin cuenta? Registrarse' : '¿Ya tienes cuenta? Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link href="/" className="font-medium text-brand-700 underline underline-offset-2 dark:text-brand-400">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
