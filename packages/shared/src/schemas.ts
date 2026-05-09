import { z } from 'zod';

export const sexSchema = z.enum(['female', 'male', 'other', 'unknown']);

const segmentSchema = z
  .object({
    right_arm: z.number().optional(),
    left_arm: z.number().optional(),
    trunk: z.number().optional(),
    right_leg: z.number().optional(),
    left_leg: z.number().optional(),
  })
  .optional();

const numOpt = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

export const bioimpedanceReportSchema = z
  .object({
    record_id: z.string().optional(),
    gender: z.string().optional(),
    age: numOpt,
    height: numOpt,
    measured_at: z.string().optional(),
    weight: numOpt,
    body_fat_pct: numOpt,
    skeletal_mass: numOpt,
    protein_mass: numOpt,
    body_water: numOpt,
    muscle_mass: numOpt,
    skeletal_muscle: numOpt,
    body_score: numOpt,
    recommended_target_weight: numOpt,
    weight_control: numOpt,
    fat_control: numOpt,
    muscle_control: numOpt,
    bmi: numOpt,
    body_fat_rate: numOpt,
    obesity_assessment: z.string().optional(),
    visceral_fat_grade: numOpt,
    basal_metabolic_rate: numOpt,
    fat_free_body_weight: numOpt,
    subcutaneous_fat: numOpt,
    smi: numOpt,
    body_age: numOpt,
    whr: numOpt,
    segmental_fat: segmentSchema,
    muscular_balance: segmentSchema,
    bioelectrical_impedance: segmentSchema,
  })
  .passthrough();

export const clinicalProfileSchema = z
  .object({
    step2: z
      .object({
        goal: z.string().optional(),
        timeframe: z.string().optional(),
        pastDiets: z.string().optional(),
      })
      .optional(),
    step3: z
      .object({
        conditions: z.string().optional(),
        digestive: z.string().optional(),
        allergies: z.string().optional(),
        pregnancyLactation: z.string().optional(),
        medications: z.string().optional(),
      })
      .optional(),
    step4: z
      .object({
        emotionalEating: z.string().optional(),
        bingeEpisodes: z.string().optional(),
        foodRelationship: z.string().optional(),
        guiltOrRestriction: z.string().optional(),
      })
      .optional(),
    step5: z
      .object({
        mealsPerDay: z.string().optional(),
        usualMealTimes: z.string().optional(),
        breakfast: z.string().optional(),
        snacks: z.string().optional(),
        eatingOutFrequency: z.string().optional(),
        sugar: z.string().optional(),
        alcohol: z.string().optional(),
        sodasJuices: z.string().optional(),
        waterDaily: z.string().optional(),
      })
      .optional(),
    step6: z
      .object({
        wakeSleep: z.string().optional(),
        workType: z.enum(['sedentary', 'active']).optional(),
        stressLevel: z.enum(['low', 'medium', 'high']).optional(),
        sleepQuality: z.string().optional(),
      })
      .optional(),
    step7: z
      .object({
        exercises: z.enum(['yes', 'no']).optional(),
        exerciseType: z.string().optional(),
        frequencyPerWeek: z.coerce.number().optional(),
        durationMinutes: z.coerce.number().optional(),
      })
      .optional(),
    step8: z
      .object({
        likes: z.string().optional(),
        dislikes: z.string().optional(),
        budget: z.string().optional(),
        kitchenAccess: z.string().optional(),
        foodCulture: z.string().optional(),
      })
      .optional(),
    step9: z
      .object({
        bowelFrequency: z.string().optional(),
        bloating: z.string().optional(),
        reflux: z.string().optional(),
        perceivedIntolerances: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export type ClinicalProfile = z.infer<typeof clinicalProfileSchema>;
export type BioimpedanceReport = z.infer<typeof bioimpedanceReportSchema>;

export const createClientBodySchema = z.object({
  full_name: z.string().min(1),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().optional(),
  age: z.coerce.number().int().positive().optional(),
  sex: sexSchema.optional(),
  weight_kg: z.coerce.number().positive().optional(),
  height_cm: z.coerce.number().positive().optional(),
  body_fat_pct: z.coerce.number().min(0).max(100).optional(),
  waist_cm: z.coerce.number().positive().optional(),
  goal_weight_kg: z.coerce.number().positive().optional(),
  bioimpedance_report: bioimpedanceReportSchema.nullable().optional(),
  clinical_profile: clinicalProfileSchema.default({}),
});

export type CreateClientBody = z.infer<typeof createClientBodySchema>;

const reqStr = (msg: string) => z.string().trim().min(1, msg);

const emptyToNumUndefined = (v: unknown): unknown => {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Paso 1: antropometría + datos mínimos para IMC, peso ideal y TMB (deriveAllMetrics). */
export const wizardStep1MetricsSchema = z.object({
  full_name: reqStr('El nombre completo es obligatorio.'),
  email: z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v).trim()),
    z.union([z.literal(''), z.string().email('Introduce un email válido o déjalo vacío.')]),
  ),
  age: z.coerce
    .number({ invalid_type_error: 'Indica la edad en años.' })
    .int('La edad debe ser un número entero.')
    .positive('Indica una edad válida.'),
  sex: z.enum(['female', 'male', 'other'], {
    message:
      'Selecciona sexo biológico (femenino, masculino u otro). Es necesario para TMB y recomendaciones.',
  }),
  weight_kg: z.coerce
    .number({ invalid_type_error: 'Indica el peso actual en kg.' })
    .positive('El peso debe ser mayor que 0.'),
  height_cm: z.coerce
    .number({ invalid_type_error: 'Indica la estatura en cm.' })
    .positive('La estatura debe ser mayor que 0.'),
  body_fat_pct: z.preprocess(
    emptyToNumUndefined,
    z
      .number({ invalid_type_error: 'El % grasa debe ser un número entre 0 y 100.' })
      .min(0, 'El % grasa debe estar entre 0 y 100.')
      .max(100, 'El % grasa debe estar entre 0 y 100.')
      .optional(),
  ),
  waist_cm: z.preprocess(
    emptyToNumUndefined,
    z
      .number({ invalid_type_error: 'La cintura debe ser un número positivo.' })
      .positive('La cintura debe ser mayor que 0.')
      .max(400, 'La cintura parece fuera de rango (revisa el valor en cm).')
      .optional(),
  ),
  goal_weight_kg: z.preprocess(
    emptyToNumUndefined,
    z
      .number({ invalid_type_error: 'El peso meta debe ser un número positivo.' })
      .positive('El peso meta debe ser mayor que 0.')
      .max(500, 'El peso meta parece fuera de rango (revisa el valor en kg).')
      .optional(),
  ),
});

/** Paso 2: objetivo en texto para calorías objetivo y reparto de macros. */
export const wizardStep2MetricsSchema = z.object({
  clinical_profile: z.object({
    step2: z.object({
      goal: reqStr('Describe el objetivo (sirve para ajustar calorías y macros).'),
      timeframe: reqStr('Indica el plazo o meta temporal.'),
      pastDiets: z.string().optional(),
    }),
  }),
});

/** Paso 6: PAL / estrés para GET y gasto estimado. */
export const wizardStep6MetricsSchema = z.object({
  clinical_profile: z.object({
    step6: z.object({
      wakeSleep: reqStr('Indica horarios de sueño y vigilia.'),
      workType: z.enum(['sedentary', 'active'], {
        message: 'Indica si el trabajo es principalmente sedentario o activo (afecta el gasto energético).',
      }),
      stressLevel: z.enum(['low', 'medium', 'high'], {
        message: 'Indica el nivel de estrés habitual.',
      }),
      sleepQuality: reqStr('Describe la calidad del sueño.'),
    }),
  }),
});

/** Paso 7: ejercicio y volumen para factor de actividad y agua orientativa. */
export const wizardStep7MetricsSchema = z
  .object({
    clinical_profile: z.object({
      step7: z.object({
        exercises: z.enum(['yes', 'no'], {
          message: 'Indica si realiza ejercicio físico habitual.',
        }),
        exerciseType: z.string().optional(),
        frequencyPerWeek: z.coerce.number().optional(),
        durationMinutes: z.coerce.number().optional(),
      }),
    }),
  })
  .superRefine((data, ctx) => {
    const s7 = data.clinical_profile.step7;
    if (s7.exercises === 'yes') {
      const freq = s7.frequencyPerWeek;
      if (
        freq == null ||
        Number.isNaN(freq) ||
        !Number.isFinite(freq) ||
        !Number.isInteger(freq) ||
        freq < 1 ||
        freq > 14
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indica cuántos días por semana entrena (entre 1 y 14).',
          path: ['clinical_profile', 'step7', 'frequencyPerWeek'],
        });
      }
      const dur = s7.durationMinutes;
      if (dur == null || Number.isNaN(dur) || !Number.isFinite(dur) || dur <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indica la duración habitual de la sesión en minutos.',
          path: ['clinical_profile', 'step7', 'durationMinutes'],
        });
      }
    }
  });
