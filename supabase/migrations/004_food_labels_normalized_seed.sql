-- Nombres normalizados (minúsculas, sin acentos, espacios colapsados) para evitar duplicados.
-- La API usa normalizeFoodLabelKey() en @nutrimax/shared; el backfill usa unaccent para acercarse.

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.food_categories
  ADD COLUMN IF NOT EXISTS name_normalized text;

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS name_normalized text;

UPDATE public.food_categories
SET name_normalized = lower(unaccent(trim(regexp_replace(name, '\s+', ' ', 'g'))))
WHERE name_normalized IS NULL;

UPDATE public.foods
SET name_normalized = lower(unaccent(trim(regexp_replace(name, '\s+', ' ', 'g'))))
WHERE name_normalized IS NULL;

-- Catálogo inicial (solo inserta si no hay coincidencia por name_normalized).
INSERT INTO public.food_categories (name, sort_order, name_normalized)
SELECT v.name, v.sort_order, v.name_normalized
FROM (VALUES
  ('Verduras y hortalizas', 10, 'verduras y hortalizas'),
  ('Frutas', 20, 'frutas'),
  ('Cereales y tubérculos', 30, 'cereales y tuberculos'),
  ('Legumbres', 40, 'legumbres'),
  ('Proteínas animales', 50, 'proteinas animales'),
  ('Pescados y mariscos', 55, 'pescados y mariscos'),
  ('Lácteos', 60, 'lacteos'),
  ('Frutos secos y semillas', 70, 'frutos secos y semillas'),
  ('Grasas y aceites', 80, 'grasas y aceites'),
  ('Bebidas', 90, 'bebidas')
) AS v(name, sort_order, name_normalized)
WHERE NOT EXISTS (
  SELECT 1 FROM public.food_categories fc WHERE fc.name_normalized = v.name_normalized
);

-- Alimentos de referencia (kcal/100 g orientativas). Únicos por categoría + name_normalized.
INSERT INTO public.foods (category_id, name, kcal_per_100g, name_normalized, sort_order)
SELECT c.id, v.name, v.kcal, v.nn, v.ord
FROM (VALUES
  ('verduras y hortalizas', 'Tomate', 18::numeric, 'tomate', 1),
  ('verduras y hortalizas', 'Lechuga', 14, 'lechuga', 2),
  ('verduras y hortalizas', 'Pepino', 16, 'pepino', 3),
  ('verduras y hortalizas', 'Zanahoria', 41, 'zanahoria', 4),
  ('verduras y hortalizas', 'Brócoli', 34, 'brocoli', 5),
  ('verduras y hortalizas', 'Espinaca', 23, 'espinaca', 6),
  ('verduras y hortalizas', 'Pimiento rojo', 27, 'pimiento rojo', 7),
  ('verduras y hortalizas', 'Cebolla', 40, 'cebolla', 8),
  ('verduras y hortalizas', 'Calabacín', 17, 'calabacin', 9),
  ('verduras y hortalizas', 'Berenjena', 25, 'berenjena', 10),
  ('frutas', 'Manzana', 52, 'manzana', 1),
  ('frutas', 'Plátano', 89, 'platano', 2),
  ('frutas', 'Naranja', 47, 'naranja', 3),
  ('frutas', 'Fresa', 32, 'fresa', 4),
  ('frutas', 'Pera', 57, 'pera', 5),
  ('frutas', 'Uva', 69, 'uva', 6),
  ('frutas', 'Melón', 34, 'melon', 7),
  ('frutas', 'Sandía', 30, 'sandia', 8),
  ('cereales y tuberculos', 'Arroz blanco cocido', 130, 'arroz blanco cocido', 1),
  ('cereales y tuberculos', 'Pasta cocida', 131, 'pasta cocida', 2),
  ('cereales y tuberculos', 'Pan integral', 247, 'pan integral', 3),
  ('cereales y tuberculos', 'Avena en copos', 389, 'avena en copos', 4),
  ('cereales y tuberculos', 'Tortilla de maíz', 218, 'tortilla de maiz', 5),
  ('cereales y tuberculos', 'Patata cocida', 87, 'patata cocida', 6),
  ('cereales y tuberculos', 'Batata cocida', 86, 'batata cocida', 7),
  ('legumbres', 'Lenteja cocida', 116, 'lenteja cocida', 1),
  ('legumbres', 'Garbanzo cocido', 164, 'garbanzo cocido', 2),
  ('legumbres', 'Judía blanca cocida', 127, 'judia blanca cocida', 3),
  ('proteinas animales', 'Pechuga de pollo', 165, 'pechuga de pollo', 1),
  ('proteinas animales', 'Carne de ternera magra', 250, 'carne de ternera magra', 2),
  ('proteinas animales', 'Huevo cocido', 155, 'huevo cocido', 3),
  ('proteinas animales', 'Jamón cocido magro', 145, 'jamon cocido magro', 4),
  ('pescados y mariscos', 'Salmón', 208, 'salmon', 1),
  ('pescados y mariscos', 'Atún en conserva al natural', 116, 'atun en conserva al natural', 2),
  ('pescados y mariscos', 'Merluza', 71, 'merluza', 3),
  ('lacteos', 'Leche entera', 61, 'leche entera', 1),
  ('lacteos', 'Yogur natural', 61, 'yogur natural', 2),
  ('lacteos', 'Queso fresco batido', 72, 'queso fresco batido', 3),
  ('frutos secos y semillas', 'Almendra', 579, 'almendra', 1),
  ('frutos secos y semillas', 'Nuez de nogal', 654, 'nuez de nogal', 2),
  ('grasas y aceites', 'Aceite de oliva virgen extra', 884, 'aceite de oliva virgen extra', 1),
  ('grasas y aceites', 'Mantequilla', 717, 'mantequilla', 2),
  ('bebidas', 'Agua', 0, 'agua', 1),
  ('bebidas', 'Café solo sin azúcar', 2, 'cafe solo sin azucar', 2)
) AS v(cat_nn, name, kcal, nn, ord)
JOIN public.food_categories c ON c.name_normalized = v.cat_nn
WHERE NOT EXISTS (
  SELECT 1 FROM public.foods f
  WHERE f.category_id = c.id AND f.name_normalized = v.nn
);

ALTER TABLE public.food_categories
  ALTER COLUMN name_normalized SET NOT NULL;

ALTER TABLE public.foods
  ALTER COLUMN name_normalized SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_food_categories_name_normalized
  ON public.food_categories (name_normalized);

CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_category_name_normalized
  ON public.foods (category_id, name_normalized);
