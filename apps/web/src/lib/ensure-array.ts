/** Garantiza un array incluso si la API devuelve null, objeto u otro tipo. */
export function ensureArray<T>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as T[];
  return [];
}
