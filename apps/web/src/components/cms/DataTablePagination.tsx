'use client';

import { Button } from '@/components/ui/Button';
import { rangeLabel, totalPagesFor } from '@/lib/paginate';
import { cn } from '@/lib/cn';

type DataTablePaginationProps = {
  page: number;
  pageSize: number;
  totalFiltered: number;
  /** Total sin filtrar (opcional: “de N en biblioteca”). */
  datasetTotal?: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function DataTablePagination({
  page,
  pageSize,
  totalFiltered,
  datasetTotal,
  onPageChange,
  className,
}: DataTablePaginationProps) {
  const totalPages = totalPagesFor(totalFiltered, pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const { from, to } = rangeLabel(safePage, pageSize, totalFiltered);

  const suffix =
    datasetTotal !== undefined && datasetTotal !== totalFiltered
      ? ` (filtrado de ${datasetTotal})`
      : '';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-sm dark:border-white/[0.06]',
        className,
      )}
    >
      <p className="text-muted-foreground">
        Mostrando{' '}
        <span className="tabular-nums font-medium text-foreground">
          {from}–{to}
        </span>{' '}
        de{' '}
        <span className="tabular-nums font-medium text-foreground">{totalFiltered}</span>
        {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-9 px-3 text-xs"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Anterior
        </Button>
        <span className="tabular-nums text-muted-foreground">
          Página {safePage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          className="h-9 px-3 text-xs"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
