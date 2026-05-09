/**
 * Evita filtrar URIs o credenciales en respuestas JSON de error solo en desarrollo.
 */
export function sanitizeApiDevDetail(message: string): string {
  let m = message;
  m = m.replace(/postgresql:\/\/[^\s"'<>]+/gi, '[DB_URI_REDACTED]');
  m = m.replace(/postgres:([^@\s/'"]+)@/gi, 'postgres:***@');
  return m.length > 800 ? `${m.slice(0, 800)}…` : m;
}
