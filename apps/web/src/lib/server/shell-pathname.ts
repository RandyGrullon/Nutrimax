import { cache } from 'react';
import { headers } from 'next/headers';

/** Ruta activa para el nav del shell (middleware envía `x-nutrimax-pathname`). */
export const getShellPathname = cache(async (): Promise<string> => {
  const h = await headers();
  return h.get('x-nutrimax-pathname') ?? '';
});
