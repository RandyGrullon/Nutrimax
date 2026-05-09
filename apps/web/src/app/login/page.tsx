'use client';

import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { showErrorToast } from '@/lib/errors';
import { beginRequestLoading } from '@/lib/request-loading';
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
    const release = beginRequestLoading();
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
      release();
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8 nb-surface-glow">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-600/[0.08] via-transparent to-transparent dark:from-brand-500/10" aria-hidden />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative mb-8 flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.75rem] font-normal tracking-tight text-foreground">NutriMax</h1>
          <p className="mt-2 text-[15px] leading-snug text-muted-foreground">
            Acceso privado: tus datos de nutrición en un solo lugar.
          </p>
        </div>
        <HelpInfoButton title="Acceso y sesión" label="inicio de sesión" triggerClassName="mt-1">
          <p>
            Introduce el <strong className="text-foreground">correo y contraseña</strong> que configuraste en Supabase.
            Si aún no tienes cuenta, usa «Crear cuenta» con el mismo correo que quieras usar.
          </p>
          <p>
            La app está pensada para mantener la sesión <strong className="text-foreground">mucho tiempo</strong> en
            este navegador (cookies largas y renovación automática). La duración máxima también depende del proyecto
            Supabase: en el panel ve a <strong className="text-foreground">Authentication → Settings → JWT expiry</strong>{' '}
            y súbelo si quieres que casi nunca pida contraseña (por ejemplo 31536000 segundos ≈ un año).
          </p>
          <p className="text-xs">
            Si entras desde otro ordenador o navegador, tendrás que volver a iniciar sesión ahí. El botón de tema (luna)
            solo cambia cómo se ve la pantalla, no cierra sesión.
          </p>
        </HelpInfoButton>
      </div>
      <Card className="relative border-border/60 p-0 shadow-nb dark:border-white/[0.06]">
        <CardHeader className="border-b border-border/60 p-6 dark:border-white/[0.06]">
          <CardTitle className="text-xl font-normal">{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</CardTitle>
          <CardDescription className="text-[15px]">
            {mode === 'login' ? 'Accede al panel de trabajo.' : 'Registro con correo y contraseña.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Correo</span>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Contraseña</span>
              <Input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              {mode === 'login' ? 'Continuar' : 'Registrarse'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-[15px]"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? '¿Sin cuenta? Crear cuenta' : '¿Ya tienes cuenta? Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="relative mt-10 text-center text-sm text-muted-foreground">
        <Link href="/" className="font-medium text-brand-500 underline-offset-4 hover:text-brand-400 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
