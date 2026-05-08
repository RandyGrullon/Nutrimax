import { headers } from 'next/headers';

/** Origen absoluto para fetch server → Route Handlers del mismo despliegue. */
export async function getInternalApiOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  if (host) return `${proto}://${host}`;

  return 'http://localhost:3000';
}
