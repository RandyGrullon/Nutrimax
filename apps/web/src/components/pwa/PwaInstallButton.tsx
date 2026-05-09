'use client';

import { Download, Share2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt: () => Promise<void>;
};

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)');
  if (mq.matches) return true;
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function PwaInstallButton({
  className,
  variant = 'secondary',
  compact = false,
}: {
  className?: string;
  variant?: ButtonVariant;
  compact?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isStandalone()) setHidden(true);
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const openGuide = useCallback(() => setGuideOpen(true), []);
  const closeGuide = useCallback(() => setGuideOpen(false), []);

  useEffect(() => {
    if (!guideOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGuide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guideOpen, closeGuide]);

  const onInstallClick = useCallback(async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } finally {
        setDeferred(null);
      }
      return;
    }
    openGuide();
  }, [deferred, openGuide]);

  if (!mounted || hidden) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={onInstallClick}
        className={cn(compact ? 'gap-1.5 px-2.5 py-2 text-xs sm:px-3 sm:text-sm' : 'gap-2', className)}
        aria-haspopup={!deferred ? 'dialog' : undefined}
      >
        <Download className={cn('shrink-0', compact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4')} aria-hidden />
        <span className={compact ? 'max-sm:sr-only' : undefined}>
          {deferred ? 'Instalar app' : isAppleMobile() ? 'Instalar (iPhone/iPad)' : 'Instalar app'}
        </span>
      </Button>

      {guideOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          onClick={closeGuide}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-xl dark:border-white/[0.08]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="pwa-install-title" className="text-lg font-medium text-foreground">
                  Instalar NutriMax
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAppleMobile()
                    ? 'En iPhone y iPad la instalación se hace desde Safari con «Añadir a la pantalla de inicio».'
                    : isAndroid()
                      ? 'En Android suele aparecer un aviso del navegador; si no, usa el menú de Chrome.'
                      : 'Instala la app desde un navegador compatible (Chrome, Edge o Safari en Mac).'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeGuide}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAppleMobile() ? (
              <ol className="list-decimal space-y-3 pl-5 text-sm text-foreground">
                <li>
                  Abre esta página en <strong className="text-foreground">Safari</strong> (recomendado). Si usas otro
                  navegador en iOS, prueba a abrir el enlace en Safari.
                </li>
                <li>
                  Pulsa el botón <strong className="text-foreground">Compartir</strong>{' '}
                  <Share2 className="mx-0.5 inline h-4 w-4 align-text-bottom text-brand-500" aria-hidden /> (cuadrado con
                  flecha hacia arriba) en la barra inferior.
                </li>
                <li>
                  En el menú, baja y elige <strong className="text-foreground">Añadir a la pantalla de inicio</strong>{' '}
                  (o «Add to Home Screen»).
                </li>
                <li>
                  Confirma con <strong className="text-foreground">Añadir</strong>. Verás el icono de NutriMax en tu
                  inicio; al abrirlo, la app va a pantalla completa como una aplicación.
                </li>
              </ol>
            ) : (
              <ol className="list-decimal space-y-3 pl-5 text-sm text-foreground">
                <li>
                  Usa <strong className="text-foreground">Chrome</strong> o el navegador que venga en tu móvil con
                  servicios Google.
                </li>
                <li>
                  Abre el <strong className="text-foreground">menú</strong> (tres puntos ⋮) y busca{' '}
                  <strong className="text-foreground">Instalar aplicación</strong>,{' '}
                  <strong className="text-foreground">Añadir a pantalla de inicio</strong> o similar.
                </li>
                <li>
                  Acepta el aviso. Si ya habías visitado el sitio, a veces el navegador muestra un icono de instalación
                  en la barra de direcciones.
                </li>
                <li>
                  En escritorio, <strong className="text-foreground">Chrome y Edge</strong> suelen mostrar un icono de
                  instalación junto a la URL cuando la página es instalable.
                </li>
              </ol>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Si ya pulsaste «Instalar» y el navegador no mostró nada, revisa que no estés en modo incógnito y vuelve a
              intentarlo más tarde.
            </p>

            <Button type="button" variant="primary" className="mt-5 w-full" onClick={closeGuide}>
              Entendido
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
