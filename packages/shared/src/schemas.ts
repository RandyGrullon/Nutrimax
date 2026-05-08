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
