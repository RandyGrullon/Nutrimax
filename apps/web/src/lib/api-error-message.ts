const STATUS_MESSAGES: Record<number, string> = {
  400: 'No pudimos procesar la solicitud. Revisa los datos e inténtalo de nuevo.',
  401: 'Tu sesión expiró o no estás autorizado. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos el recurso solicitado.',
  409: 'Hay un conflicto con los datos actuales.',
  422: 'Los datos no cumplen las reglas de validación.',
  429: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
  500: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
  502: 'El servicio no está disponible temporalmente.',
  503: 'El servicio no está disponible temporalmente.',
};

function fallbackForStatus(status: number): string {
  return STATUS_MESSAGES[status] ?? 'Algo salió mal. Inténtalo de nuevo.';
}

/**
 * Extrae un mensaje legible de una respuesta HTTP de API (JSON `{ message }` o texto corto).
 */
export async function parseApiErrorMessage(response: Response): Promise<string> {
  const status = response.status;
  let raw = '';
  try {
    raw = await response.text();
  } catch {
    return fallbackForStatus(status);
  }

  if (raw) {
    try {
      const data = JSON.parse(raw) as { message?: unknown };
      if (typeof data.message === 'string' && data.message.trim().length > 0) {
        return data.message.trim();
      }
    } catch {
      const trimmed = raw.trim();
      if (
        trimmed.length > 0 &&
        trimmed.length < 280 &&
        !trimmed.includes('<') &&
        !trimmed.startsWith('{')
      ) {
        return trimmed;
      }
    }
  }

  return fallbackForStatus(status);
}
