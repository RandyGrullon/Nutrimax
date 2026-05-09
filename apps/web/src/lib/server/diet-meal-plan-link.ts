import type { DietPlan } from '@nutrimax/shared';
import {
  estimateMealPlanKcalFromItems,
  mealPlanDietCompatibility,
  parseMealPlanItems,
} from '@nutrimax/shared';
import { ApiError } from '@/lib/server/auth';
import { listFoodsByIds } from '@/lib/server/foods-server';
import { getMealPlanById } from '@/lib/server/meal-plans-server';

export async function assertMealPlanCompatibleWithDiet(args: {
  mealPlanId: string | null | undefined;
  dietPlan: DietPlan;
}): Promise<void> {
  const { mealPlanId, dietPlan } = args;
  if (mealPlanId == null || mealPlanId === undefined) return;

  const mp = await getMealPlanById(mealPlanId);
  const items = parseMealPlanItems(mp.items);
  const ids = [...new Set(items.map((i) => i.food_id))];
  const foods = ids.length ? await listFoodsByIds(ids) : [];
  const map = new Map(foods.map((f) => [f.id, { kcal_per_100g: Number(f.kcal_per_100g) }]));
  const missing = ids.filter((id) => !map.has(id));
  const estimated = estimateMealPlanKcalFromItems(items, map);

  const result = mealPlanDietCompatibility({
    dietTargetKcal: dietPlan.targetKcal,
    kcalRangeMin: mp.kcal_range_min,
    kcalRangeMax: mp.kcal_range_max,
    estimatedMealKcal: estimated,
    missingFoodIds: missing,
  });

  if (!result.ok) throw new ApiError(400, result.message);
}
