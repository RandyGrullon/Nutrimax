/**
 * Clave estable para comparar nombres de alimentos/categorías sin duplicar variantes:
 * minúsculas, sin marcas diacríticas, espacios colapsados y trim.
 */
export function normalizeFoodLabelKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
