import { z } from 'zod';

export const dietPlanGoalValues = [
  'weight_loss',
  'weight_maintenance',
  'muscle_gain',
  'general_health',
  'therapeutic',
  'other',
] as const;

export type DietPlanGoal = (typeof dietPlanGoalValues)[number];

export const dietPlanActivityValues = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const;

export type DietPlanActivity = (typeof dietPlanActivityValues)[number];

export const dietPlanGoalLabels: Record<DietPlanGoal, string> = {
  weight_loss: 'Pérdida de peso',
  weight_maintenance: 'Mantenimiento',
  muscle_gain: 'Ganancia muscular',
  general_health: 'Salud general / hábitos',
  therapeutic: 'Enfoque terapéutico / condición médica',
  other: 'Otro (especificar en notas)',
};

export const dietPlanActivityLabels: Record<DietPlanActivity, string> = {
  sedentary: 'Sedentario',
  light: 'Ligera',
  moderate: 'Moderada',
  active: 'Activa',
  very_active: 'Muy activa',
};

function optTrim(max: number) {
  return z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : ''),
    z.string().max(max),
  );
}

function optNumInt(min: number, max: number) {
  return z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().int().min(min).max(max).optional());
}

function optNumFloat(min: number, max: number) {
  return z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().min(min).max(max).optional());
}

export const dietPlanSchema = z
  .object({
    goal: z.enum(dietPlanGoalValues, {
      message: 'Selecciona el objetivo principal del plan.',
    }),
    goalNotes: optTrim(2000),
    targetKcal: z.coerce
      .number({ invalid_type_error: 'Indica las kcal objetivo (número).' })
      .int('Las kcal deben ser un número entero.')
      .min(1000, 'Las kcal objetivo deben ser al menos 1000.')
      .max(5500, 'Las kcal objetivo no deben superar 5500.'),
    proteinG: z.coerce
      .number({ invalid_type_error: 'Indica proteínas en gramos.' })
      .min(20, 'Proteínas mínimas 20 g/día.')
      .max(350, 'Proteínas máximas 350 g/día.'),
    carbsG: z.coerce
      .number({ invalid_type_error: 'Indica carbohidratos en gramos.' })
      .min(30, 'Carbohidratos mínimos 30 g/día.')
      .max(700, 'Carbohidratos máximos 700 g/día.'),
    fatG: z.coerce
      .number({ invalid_type_error: 'Indica grasas en gramos.' })
      .min(15, 'Grasas mínimas 15 g/día.')
      .max(250, 'Grasas máximas 250 g/día.'),
    durationWeeks: optNumInt(1, 104),
    mealsPerDay: z.coerce
      .number({ invalid_type_error: 'Indica comidas al día.' })
      .int('Comidas al día debe ser un entero.')
      .min(1, 'Al menos 1 comida al día.')
      .max(8, 'Como máximo 8 tomas al día.'),
    mealStructureNotes: optTrim(4000),
    waterLitersPerDay: optNumFloat(0.5, 8),
    expectedActivity: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.enum(dietPlanActivityValues).optional(),
    ),
    foodsToEmphasize: optTrim(4000),
    foodsToLimit: optTrim(4000),
    restrictionsAllergies: optTrim(4000),
    patientInstructions: z.preprocess(
      (v) => (typeof v === 'string' ? v.trim() : ''),
      z
        .string()
        .min(25, 'Las instrucciones al paciente deben tener al menos 25 caracteres.')
        .max(8000, 'Máximo 8000 caracteres en instrucciones al paciente.'),
    ),
    professionalNotes: optTrim(8000),
  })
  .strict()
  .superRefine((data, ctx) => {
    const p = data.proteinG;
    const c = data.carbsG;
    const f = data.fatG;
    const k = data.targetKcal;
    const fromMacros = Math.round(p * 4 + c * 4 + f * 9);
    const tol = Math.max(100, k * 0.14);
    if (Math.abs(fromMacros - k) > tol) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Las gramos de macronutrientes suman ~${fromMacros} kcal (4·P + 4·CH + 9·G) y no encajan con el objetivo de ${k} kcal (tolerancia ±14%). Ajusta P, CH, G o las kcal.`,
        path: ['targetKcal'],
      });
    }
  });

export type DietPlan = z.infer<typeof dietPlanSchema>;

export const createDietBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(200, 'El nombre no puede superar 200 caracteres.'),
  description: z
    .string()
    .trim()
    .min(30, 'La descripción resumida del plan debe tener al menos 30 caracteres.')
    .max(8000, 'La descripción no puede superar 8000 caracteres.'),
  plan: dietPlanSchema,
});

export type CreateDietBody = z.infer<typeof createDietBodySchema>;

export const updateDietBodySchema = createDietBodySchema;

/** Valores por defecto al crear o al migrar planes antiguos vacíos. */
export function defaultDietPlan(): DietPlan {
  return dietPlanSchema.parse({
    goal: 'general_health',
    goalNotes: '',
    targetKcal: 2000,
    proteinG: 125,
    carbsG: 200,
    fatG: 78,
    durationWeeks: 4,
    mealsPerDay: 5,
    mealStructureNotes: '',
    waterLitersPerDay: 2,
    expectedActivity: 'moderate',
    foodsToEmphasize: '',
    foodsToLimit: '',
    restrictionsAllergies: '',
    patientInstructions:
      'Distribuir las tomas a lo largo del día, priorizar alimentos frescos y ajustar porciones según tolerancia. Consultar dudas con el profesional.',
    professionalNotes: '',
  });
}

/** Fusiona un `plan` guardado (posiblemente incompleto) con defaults y valida cuando sea posible. */
export function normalizeDietPlan(raw: unknown): DietPlan {
  const base = defaultDietPlan();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return base;
  }
  const merged = { ...base, ...(raw as Record<string, unknown>) };
  const parsed = dietPlanSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}
