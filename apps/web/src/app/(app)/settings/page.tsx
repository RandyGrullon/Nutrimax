'use client';

import { useFontSize, FontSizePreference } from '@/components/theme/FontSizeProvider';
import { cn } from '@/lib/cn';
import { Type, Check, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const FONT_OPTIONS: { label: string; value: FontSizePreference; description: string }[] = [
  { label: 'Pequeño', value: 'small', description: '14px - Ideal para pantallas con mucha información.' },
  { label: 'Normal', value: 'medium', description: '16px - El tamaño estándar recomendado.' },
  { label: 'Grande', value: 'large', description: '18px - Mayor legibilidad y comodidad visual.' },
  { label: 'Extra Grande', value: 'extra-large', description: '20px - Máxima accesibilidad.' },
];

export default function SettingsPage() {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes del sistema</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia en NutriMax.</p>
      </header>

      <section className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Type className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium">Tamaño de letra</h2>
              <p className="text-sm text-muted-foreground">Ajusta el tamaño de la fuente para todo el proyecto.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {FONT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFontSize(option.value)}
                className={cn(
                  'relative flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all',
                  fontSize === option.value
                    ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500 dark:border-brand-500/50 dark:bg-brand-500/10'
                    : 'border-border bg-background hover:bg-muted/50 dark:border-white/[0.08] dark:bg-white/[0.02]',
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={cn(
                    "font-medium",
                    option.value === 'small' && "text-[13px]",
                    option.value === 'medium' && "text-[15px]",
                    option.value === 'large' && "text-[17px]",
                    option.value === 'extra-large' && "text-[19px]",
                  )}>
                    {option.label}
                  </span>
                  {fontSize === option.value && (
                    <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02]">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Vista previa</h3>
          <div className="space-y-3">
            <p className="text-foreground">
              Este es un ejemplo de cómo se verá el texto en el sistema. Puedes ajustar el tamaño para que sea más cómodo para ti.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Etiqueta</span>
              <button className="rounded-md bg-brand-500 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-brand-600">Botón de prueba</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
