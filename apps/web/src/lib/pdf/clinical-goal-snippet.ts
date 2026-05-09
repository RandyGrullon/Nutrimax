/** Extrae objetivo y plazo del paso 2 del perfil clínico (sin validar todo el esquema). */
export function extractClinicalGoalStep2(profile: unknown): {
  objective: string | null;
  timeframe: string | null;
} {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return { objective: null, timeframe: null };
  }
  const s2 = (profile as Record<string, unknown>).step2;
  if (!s2 || typeof s2 !== 'object' || Array.isArray(s2)) {
    return { objective: null, timeframe: null };
  }
  const r = s2 as Record<string, unknown>;
  const goal = typeof r.goal === 'string' ? r.goal.trim() : '';
  const timeframe = typeof r.timeframe === 'string' ? r.timeframe.trim() : '';
  return {
    objective: goal.length > 0 ? goal : null,
    timeframe: timeframe.length > 0 ? timeframe : null,
  };
}
