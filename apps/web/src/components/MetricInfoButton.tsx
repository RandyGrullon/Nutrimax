'use client';

import { Info } from 'lucide-react';
import { useId, useRef } from 'react';

type MetricInfoButtonProps = {
  label: string;
  title: string;
  children: React.ReactNode;
};

export function MetricInfoButton({ label, title, children }: MetricInfoButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        className="inline-flex rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Información sobre ${label}`}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(100%,28rem)] rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/50"
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
          <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">{children}</div>
        </div>
      </dialog>
    </>
  );
}
