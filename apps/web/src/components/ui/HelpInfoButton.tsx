'use client';

import { Info } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type HelpInfoButtonProps = {
  /** Texto corto para accesibilidad (ej. «Ayuda sobre pacientes»). */
  label: string;
  title: string;
  children: ReactNode;
  /** Clases extra del botón circular de información. */
  triggerClassName?: string;
};

export function HelpInfoButton({ label, title, children, triggerClassName }: HelpInfoButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        className={cn(
          'inline-flex shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
          triggerClassName,
        )}
        aria-label={`Información: ${label}`}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(100%,28rem)] rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/50 dark:border-white/[0.08]"
        aria-labelledby={titleId}
      >
        <div className="max-h-[80dvh] overflow-y-auto p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {title}
            </h2>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => dialogRef.current?.close()}
            >
              Cerrar
            </button>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
            {children}
          </div>
        </div>
      </dialog>
    </>
  );
}
