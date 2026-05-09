'use client';

import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { showErrorToast } from '@/lib/errors';
import { beginRequestLoading } from '@/lib/request-loading';
import { ClipboardList, Monitor, Tablet, UtensilsCrossed, Users } from 'lucide-react';
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
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-background">
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-br from-brand-600/[0.08] via-background to-violet-600/[0.06] dark:from-brand-500/12 dark:via-background dark:to-violet-600/10"
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 nb-surface-glow opacity-90 dark:opacity-100" aria-hidden />

      <div className="absolute right-0 top-0 z-20 flex items-center gap-2 px-4 py-4 sm:px-6 md:px-8 lg:right-6 lg:top-5 lg:px-0">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1600px] lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,480px)] xl:grid-cols-[1.15fr_minmax(400px,460px)]">
        {/* Panel de marca: escritorio y portátiles amplios */}
        <aside
          className="relative hidden flex-col justify-center border-border/50 px-8 py-16 lg:flex lg:border-r lg:border-border/40 lg:bg-muted/15 xl:px-14 2xl:px-20 dark:lg:bg-muted/10 dark:lg:border-white/[0.06]"
          aria-label="Presentación de NutriMax"
        >
          <div className="max-w-lg xl:max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
              Panel profesional
            </p>
            <h1 className="mt-3 text-4xl font-normal tracking-tight text-foreground xl:text-[2.75rem] xl:leading-tight">
              NutriMax
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Acceso privado al mismo panel en <strong className="font-medium text-foreground">ordenador</strong>,{' '}
              <strong className="font-medium text-foreground">tablet</strong> y{' '}
              <strong className="font-medium text-foreground">móvil</strong>: pacientes, dietas y seguimiento en un solo
              lugar.
            </p>
            <ul className="mt-10 space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <Users className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="font-medium text-foreground">Pacientes</span> — fichas, historial y asistente de
                  registro.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <UtensilsCrossed className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="font-medium text-foreground">Dietas</span> — biblioteca de planes y asignaciones.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <ClipboardList className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="font-medium text-foreground">Responsive</span> — diseño adaptable a pantalla grande,
                  intermedia y táctil.
                </span>
              </li>
            </ul>
            <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                Escritorio
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Tablet className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                Tablet
              </span>
              <span className="text-muted-foreground/80">Móvil</span>
            </p>
          </div>
        </aside>

        {/* Formulario: móvil, tablet y columna derecha en lg+ */}
        <section className="relative flex flex-col justify-center px-4 pb-14 pt-[4.25rem] sm:px-8 sm:pb-16 sm:pt-20 md:px-10 md:pb-20 lg:px-12 lg:py-16 lg:pt-16 xl:px-14">
          <div className="mx-auto w-full max-w-md md:max-w-lg lg:max-w-[420px]">
            <div className="mb-6 sm:mb-8 lg:hidden">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400">
                NutriMax
              </p>
              <div className="mt-2 flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-[1.75rem]">
                    Iniciar sesión
                  </h2>
                  <p className="mt-2 max-w-prose text-[15px] leading-snug text-muted-foreground sm:text-base sm:leading-relaxed">
                    Acceso privado desde cualquier dispositivo: misma experiencia en escritorio, tablet y móvil.
                  </p>
                </div>
                <HelpInfoButton title="Acceso y sesión" label="inicio de sesión" triggerClassName="mt-1 shrink-0">
                  <p>
                    Introduce el <strong className="text-foreground">correo y contraseña</strong> que configuraste en
                    Supabase. Si aún no tienes cuenta, usa «Crear cuenta» con el mismo correo que quieras usar.
                  </p>
                  <p>
                    La app está pensada para mantener la sesión <strong className="text-foreground">mucho tiempo</strong>{' '}
                    en este navegador (cookies largas y renovación automática). La duración máxima también depende del
                    proyecto Supabase: en el panel ve a{' '}
                    <strong className="text-foreground">Authentication → Settings → JWT expiry</strong> y súbelo si
                    quieres que casi nunca pida contraseña (por ejemplo 31536000 segundos ≈ un año).
                  </p>
                  <p className="text-xs">
                    Si entras desde otro ordenador o navegador, tendrás que volver a iniciar sesión ahí. El botón de tema
                    (luna) solo cambia cómo se ve la pantalla, no cierra sesión.
                  </p>
                </HelpInfoButton>
              </div>
            </div>

            <div className="mb-4 hidden lg:block">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-normal tracking-tight text-foreground xl:text-2xl">
                    {mode === 'login' ? 'Entrar al panel' : 'Crear cuenta'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === 'login'
                      ? 'Introduce tus credenciales para continuar.'
                      : 'Registro con correo y contraseña.'}
                  </p>
                </div>
                <HelpInfoButton title="Acceso y sesión" label="ayuda acceso" triggerClassName="mt-0.5 shrink-0">
                  <p>
                    Introduce el <strong className="text-foreground">correo y contraseña</strong> que configuraste en
                    Supabase. Si aún no tienes cuenta, usa «Crear cuenta».
                  </p>
                  <p>
                    La sesión puede mantenerse <strong className="text-foreground">mucho tiempo</strong> según la
                    configuración JWT en Supabase (Authentication → Settings).
                  </p>
                  <p className="text-xs">El tema solo afecta la apariencia, no cierra sesión.</p>
                </HelpInfoButton>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PwaInstallButton variant="secondary" className="w-full sm:w-auto sm:min-w-[11rem]" />
              <p className="text-xs text-muted-foreground sm:max-w-[14rem] lg:max-w-none">
                Opcional: instala la app en el dispositivo para abrirla como aplicación.
              </p>
            </div>

            <Card className="relative border-border/60 p-0 shadow-nb dark:border-white/[0.06]">
              <CardHeader className="border-b border-border/60 p-5 sm:p-6 dark:border-white/[0.06] lg:hidden">
                <CardTitle className="text-xl font-normal">
                  {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                </CardTitle>
                <CardDescription className="text-[15px] sm:text-base">
                  {mode === 'login' ? 'Accede al panel de trabajo.' : 'Registro con correo y contraseña.'}
                </CardDescription>
              </CardHeader>
              <CardHeader className="hidden border-b border-border/60 p-5 sm:p-6 dark:border-white/[0.06] lg:block">
                <CardTitle className="sr-only">
                  {mode === 'login' ? 'Formulario de acceso' : 'Formulario de registro'}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Los campos se adaptan al ancho de tu pantalla; en tablet puedes usar el teclado en horizontal o vertical.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                <form onSubmit={onSubmit} className="flex flex-col gap-5">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-foreground">Correo</span>
                    <Input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-foreground">Contraseña</span>
                    <Input
                      type="password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                    />
                  </label>
                  <Button type="submit" variant="primary" loading={loading} disabled={loading} className="min-h-11 w-full sm:min-h-10">
                    {mode === 'login' ? 'Continuar' : 'Registrarse'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 w-full text-[15px] sm:min-h-10"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  >
                    {mode === 'login' ? '¿Sin cuenta? Crear cuenta' : '¿Ya tienes cuenta? Entrar'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-8 text-center text-sm text-muted-foreground sm:mt-10 md:mt-12">
              <Link
                href="/"
                className="font-medium text-brand-500 underline-offset-4 hover:text-brand-400 hover:underline"
              >
                Volver al inicio
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
