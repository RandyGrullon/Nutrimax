'use client';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PAGE_SIZE_OPTIONS } from '@/lib/paginate';
import { cn } from '@/lib/cn';

type DataTableToolbarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchAriaLabel: string;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  /** Controles extra (filtros, orden…). */
  filters?: ReactNode;
  className?: string;
};

export function DataTableToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchAriaLabel,
  pageSize,
  onPageSizeChange,
  filters,
  className,
}: DataTableToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      <div className="relative min-w-[200px] flex-1 sm:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={searchAriaLabel}
        />
      </div>
      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        <span>Por página</span>
        <Select
          className="w-auto min-w-[4.5rem]"
          value={String(pageSize)}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Filas por página"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}
