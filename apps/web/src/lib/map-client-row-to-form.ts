import type { CreateClientBody } from '@nutrimax/shared';

function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Convierte la fila API/DB al shape del formulario del asistente (servidor y cliente). */
export function mapClientRowToForm(row: Record<string, unknown>): CreateClientBody {
  const clinical = (row.clinical_profile as CreateClientBody['clinical_profile']) ?? {};
  return {
    full_name: String(row.full_name ?? ''),
    email: row.email ? String(row.email) : '',
    phone: row.phone ? String(row.phone) : '',
    age: toNum(row.age),
    sex: (row.sex as CreateClientBody['sex']) ?? undefined,
    weight_kg: toNum(row.weight_kg),
    height_cm: toNum(row.height_cm),
    body_fat_pct: toNum(row.body_fat_pct),
    waist_cm: toNum(row.waist_cm),
    goal_weight_kg: toNum(row.goal_weight_kg),
    bioimpedance_report: (row.bioimpedance_report as CreateClientBody['bioimpedance_report']) ?? {},
    clinical_profile: {
      step2: clinical.step2 ?? {},
      step3: clinical.step3 ?? {},
      step4: clinical.step4 ?? {},
      step5: clinical.step5 ?? {},
      step6: clinical.step6 ?? {},
      step7: clinical.step7 ?? {},
      step8: clinical.step8 ?? {},
      step9: clinical.step9 ?? {},
    },
  };
}
