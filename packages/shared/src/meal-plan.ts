import { z } from 'zod';

/** Ítem de un plan alimenticio (porciones por toma). */
export const mealPlanItemSchema = z
  .object({
    meal: z.string().trim().min(1, 'Indica la toma (ej. Desayuno).').max(80),
    food_id: z.string().uuid('El alimento debe tener un id válido.'),
    portion_grams: z.coerce
      .number({ invalid_type_error: 'La porción en gramos debe ser un número.' })
      .positive('La porción debe ser mayor que 0.')
      .max(5000, 'Porción demasiado alta.'),
    order: z.coerce
      .number({ invalid_type_error: 'El orden debe ser un número entero.' })
      .int()
      .min(0)
      .max(999),
  })
  .strict();

export type MealPlanItem = z.infer<typeof mealPlanItemSchema>;

export const mealPlanItemsSchema = z.array(mealPlanItemSchema).max(80, 'Máximo 80 ítems por plan.');

export function parseMealPlanItems(raw: unknown): MealPlanItem[] {
  const parsed = mealPlanItemsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export type FoodKcalRow = {
  id: string;
  kcal_per_100g: number;
};

/** Energía estimada del día a partir de porciones y kcal/100g de cada alimento. */
export function estimateMealPlanKcalFromItems(
  items: MealPlanItem[],
  foodsById: Map<string, Pick<FoodKcalRow, 'kcal_per_100g'>>,
): number {
  let sum = 0;
  for (const it of items) {
    const f = foodsById.get(it.food_id);
    if (!f) continue;
    sum += (Number(f.kcal_per_100g) * it.portion_grams) / 100;
  }
  return Math.round(sum);
}

export type MealPlanCompatibilityCode = 'RANGE' | 'ENERGY' | 'MISSING_FOOD';

export type MealPlanDietCompatibility =
  | { ok: true }
  | { ok: false; code: MealPlanCompatibilityCode; message: string };

/**
 * Reglas combinadas (uso clínico orientativo):
 * 1) El objetivo energético de la dieta debe caer en el rango declarado del plan [min, max].
 * 2) La suma estimada de las porciones no debe superar el objetivo de la dieta más una tolerancia (10% o 75 kcal).
 * 3) Si falta algún alimento del catálogo, se bloquea hasta corregir datos.
 */
export function mealPlanDietCompatibility(args: {
  dietTargetKcal: number;
  kcalRangeMin: number;
  kcalRangeMax: number;
  estimatedMealKcal: number;
  missingFoodIds: string[];
}): MealPlanDietCompatibility {
  const { dietTargetKcal, kcalRangeMin, kcalRangeMax, estimatedMealKcal, missingFoodIds } = args;

  if (missingFoodIds.length > 0) {
    return {
      ok: false,
      code: 'MISSING_FOOD',
      message:
        'El plan referencia alimentos que ya no existen en el catálogo. Actualiza el plan alimenticio o restaura esos alimentos.',
    };
  }

  if (dietTargetKcal < kcalRangeMin || dietTargetKcal > kcalRangeMax) {
    return {
      ok: false,
      code: 'RANGE',
      message: `El objetivo de la dieta (${dietTargetKcal} kcal/día) está fuera del rango del plan alimenticio (${kcalRangeMin}–${kcalRangeMax} kcal). Ajusta las kcal del plan nutricional, el rango del plan alimenticio o elige otro plan.`,
    };
  }

  const tol = Math.max(75, Math.round(dietTargetKcal * 0.1));
  if (estimatedMealKcal > dietTargetKcal + tol) {
    return {
      ok: false,
      code: 'ENERGY',
      message: `Las porciones del plan suman ~${estimatedMealKcal} kcal y superan el objetivo de la dieta (${dietTargetKcal} kcal, tolerancia +${tol} kcal). Reduce porciones, cambia alimentos o elige un plan más ligero.`,
    };
  }

  return { ok: true };
}

export const createFoodCategoryBodySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
});

export type CreateFoodCategoryBody = z.infer<typeof createFoodCategoryBodySchema>;

export const updateFoodCategoryBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const createFoodBodySchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(200),
  kcal_per_100g: z.coerce
    .number({ invalid_type_error: 'Las kcal por 100 g deben ser un número.' })
    .min(0, 'Las kcal por 100 g no pueden ser negativas (usa 0 para agua o bebidas sin energía).')
    .max(950),
  protein_g_per_100g: z.coerce.number().min(0).max(100).optional(),
  carbs_g_per_100g: z.coerce.number().min(0).max(100).optional(),
  fat_g_per_100g: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
});

export type CreateFoodBody = z.infer<typeof createFoodBodySchema>;

export const updateFoodBodySchema = createFoodBodySchema.partial().extend({
  category_id: z.string().uuid().optional(),
});

const mealPlanFieldsSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(200),
    description: z.string().trim().max(8000).optional().nullable(),
    kcal_range_min: z.coerce
      .number({ invalid_type_error: 'Indica kcal mínimas del rango.' })
      .int()
      .min(1000)
      .max(5500),
    kcal_range_max: z.coerce
      .number({ invalid_type_error: 'Indica kcal máximas del rango.' })
      .int()
      .min(1000)
      .max(5500),
    items: mealPlanItemsSchema.default([]),
  })
  .strict();

export const createMealPlanBodySchema = mealPlanFieldsSchema.superRefine((data, ctx) => {
  if (data.kcal_range_max < data.kcal_range_min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Las kcal máximas del rango deben ser mayores o iguales que las mínimas.',
      path: ['kcal_range_max'],
    });
  }
});

export type CreateMealPlanBody = z.infer<typeof createMealPlanBodySchema>;

export const updateMealPlanBodySchema = mealPlanFieldsSchema.partial();

/** Modelo de solo lectura para UI y API (plan alimenticio resuelto con alimentos). */
export type MealPlanFoodRef = {
  id: string;
  name: string;
  kcal_per_100g: number;
};

export type MealPlanReadItem = {
  meal: string;
  portion_grams: number;
  order: number;
  food: MealPlanFoodRef | null;
};

export type MealPlanReadModel = {
  id: string;
  name: string;
  description: string | null;
  kcal_range_min: number;
  kcal_range_max: number;
  estimated_kcal: number;
  items: MealPlanReadItem[];
};
