import { revalidateTag } from 'next/cache';

/**
 * Tag compartido para lecturas RSC cacheadas (listados + dashboard).
 * Tras mutaciones vía API se llama `revalidateNutrimaxReadCaches()` para datos al día.
 */
export const NUTRIMAX_READ_CACHE_TAG = 'nutrimax-read-caches';

export function revalidateNutrimaxReadCaches(): void {
  revalidateTag(NUTRIMAX_READ_CACHE_TAG);
}
