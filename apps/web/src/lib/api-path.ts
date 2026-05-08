/** Prefijo de API interna (Route Handlers en este mismo proyecto). */
export function toApiPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.startsWith('/api')) return p;
  return `/api${p}`;
}
