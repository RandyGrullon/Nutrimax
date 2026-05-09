-- Plan alimenticio: categorías, alimentos, planes con ítems JSON y vínculo opcional en dietas.

CREATE TABLE public.food_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TRIGGER food_categories_updated_at
BEFORE UPDATE ON public.food_categories
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX idx_food_categories_sort ON public.food_categories (sort_order, name);

CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  category_id uuid NOT NULL REFERENCES public.food_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  kcal_per_100g numeric(8, 2) NOT NULL CHECK (kcal_per_100g >= 0 AND kcal_per_100g <= 950),
  protein_g_per_100g numeric(8, 2),
  carbs_g_per_100g numeric(8, 2),
  fat_g_per_100g numeric(8, 2),
  notes text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TRIGGER foods_updated_at
BEFORE UPDATE ON public.foods
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX idx_foods_category ON public.foods (category_id, sort_order, name);

CREATE TABLE public.meal_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  description text,
  kcal_range_min integer NOT NULL CHECK (kcal_range_min >= 1000 AND kcal_range_min <= 5500),
  kcal_range_max integer NOT NULL CHECK (kcal_range_max >= 1000 AND kcal_range_max <= 5500),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  CHECK (kcal_range_max >= kcal_range_min)
);

CREATE TRIGGER meal_plans_updated_at
BEFORE UPDATE ON public.meal_plans
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX idx_meal_plans_updated ON public.meal_plans (updated_at DESC);

ALTER TABLE public.diets
  ADD COLUMN meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE SET NULL;

CREATE INDEX idx_diets_meal_plan ON public.diets (meal_plan_id);
