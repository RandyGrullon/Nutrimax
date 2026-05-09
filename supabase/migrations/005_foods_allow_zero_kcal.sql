-- Agua y bebidas sin energía pueden tener 0 kcal/100 g (el seed 004 inserta «Agua» con 0).

ALTER TABLE public.foods DROP CONSTRAINT IF EXISTS foods_kcal_per_100g_check;

ALTER TABLE public.foods
  ADD CONSTRAINT foods_kcal_per_100g_check
  CHECK (kcal_per_100g >= 0 AND kcal_per_100g <= 950);
