/** Opciones estándar de tamaño de página para tablas del CMS. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function totalPagesFor(count: number, pageSize: number): number {
  const n = Math.max(1, pageSize);
  return Math.max(1, Math.ceil(Math.max(0, count) / n));
}

export function clampPage(page: number, totalPages: number): number {
  const tp = Math.max(1, totalPages);
  return Math.min(Math.max(1, page), tp);
}

export function slicePage<T>(items: T[], page: number, pageSize: number): { slice: T[]; page: number; totalPages: number } {
  const totalPages = totalPagesFor(items.length, pageSize);
  const p = clampPage(page, totalPages);
  const start = (p - 1) * pageSize;
  return { slice: items.slice(start, start + pageSize), page: p, totalPages };
}

export function rangeLabel(page: number, pageSize: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  const p = clampPage(page, totalPagesFor(total, pageSize));
  const from = (p - 1) * pageSize + 1;
  const to = Math.min(p * pageSize, total);
  return { from, to };
}
