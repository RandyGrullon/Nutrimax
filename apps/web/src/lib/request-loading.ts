const listeners = new Set<() => void>();
let count = 0;

function emit() {
  listeners.forEach((cb) => cb());
}

export function subscribeRequestLoading(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInboundRequestCount(): number {
  return count;
}

function enter() {
  count += 1;
  emit();
}

function exit() {
  count = Math.max(0, count - 1);
  emit();
}

/** Envuelve una petición async y refleja carga global (barra superior). No-op en SSR. */
export async function withRequestLoading<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof window === 'undefined') {
    return fn();
  }
  enter();
  try {
    return await fn();
  } finally {
    exit();
  }
}

/**
 * Marca carga global hasta llamar al `release` devuelto (p. ej. en `finally`).
 * Útil para flujos que no pasan por `apiFetch` (Supabase auth, etc.).
 */
export function beginRequestLoading(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  enter();
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    exit();
  };
}
