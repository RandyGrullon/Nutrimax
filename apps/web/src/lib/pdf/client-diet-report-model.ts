/** Tipos serializables para el informe PDF (sin dependencias de React). */

export type ProgressSnapPdf = {
  recorded_at: string;
  period_month: string | null;
  weight_kg: number | null;
  waist_cm: number | null;
  body_fat_pct: number | null;
  note: string;
};

export type AssignmentOptionPdf = {
  id: string;
  diet_id: string;
  diet_name: string;
  meal_plan_name: string | null;
  status: string;
  starts_on: string | null;
  notes: string | null;
};

export type ClientDietPdfContext = {
  client: {
    fullName: string;
    email: string | null;
    phone: string | null;
    age: number | null;
    sex: string | null;
  };
  clinicalGoal: {
    objective: string | null;
    timeframe: string | null;
  };
  baseline: {
    weightKg: string | null;
    heightCm: string | null;
    waistCm: string | null;
    bodyFatPct: string | null;
    goalWeightKg: string | null;
    bmi: string | null;
    targetKcal: string | null;
  };
  heightCm: number | null;
  progressSnapshots: ProgressSnapPdf[];
  assignments: AssignmentOptionPdf[];
};
