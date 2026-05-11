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
  ('Víveres (Tubérculos)', 30, 'víveres (tuberculos)'),
  ('Cereales', 35, 'cereales'),
  ('Arroces', 40, 'arroces'),
  ('Habichuelas (Legumbres)', 50, 'habichuelas (legumbres)'),
  ('Proteínas animales', 60, 'proteinas animales'),
  ('Pescados y mariscos', 70, 'pescados y mariscos'),
  ('Lácteos y Quesos', 80, 'lacteos y quesos'),
  ('Frutos secos y Semillas', 90, 'frutos secos y semillas'),
  ('Grasas y aceites', 100, 'grasas y aceites'),
  ('Bebidas típicas', 110, 'bebidas tipicas')
) AS v(name, sort_order, name_normalized)
WHERE NOT EXISTS (
  SELECT 1 FROM public.food_categories fc WHERE fc.name_normalized = v.name_normalized
);

-- Alimentos de referencia de República Dominicana (kcal/100 g orientativas).
INSERT INTO public.foods (category_id, name, kcal_per_100g, name_normalized, sort_order)
SELECT c.id, v.name, v.kcal, v.nn, v.ord
FROM (VALUES
  -- Verduras
  ('verduras y hortalizas', 'Tomate', 18::numeric, 'tomate', 1),
  ('verduras y hortalizas', 'Lechuga romana', 15, 'lechuga romana', 2),
  ('verduras y hortalizas', 'Pepino', 16, 'pepino', 3),
  ('verduras y hortalizas', 'Zanahoria', 41, 'zanahoria', 4),
  ('verduras y hortalizas', 'Ají gustoso', 25, 'aji gustoso', 5),
  ('verduras y hortalizas', 'Ají cubanela', 20, 'aji cubanela', 6),
  ('verduras y hortalizas', 'Cebolla roja', 40, 'cebolla roja', 7),
  ('verduras y hortalizas', 'Berenjena guisada', 85, 'berenjena guisada', 8),
  ('verduras y hortalizas', 'Tayota cocida', 19, 'tayota cocida', 9),
  ('verduras y hortalizas', 'Auyama cocida', 26, 'auyama cocida', 10),
  
  -- Frutas
  ('frutas', 'Guineo maduro', 89, 'guineo maduro', 1),
  ('frutas', 'Mango', 60, 'mango', 2),
  ('frutas', 'Lechosa (Papaya)', 43, 'lechosa (papaya)', 3),
  ('frutas', 'Chinola (Parchita)', 97, 'chinola (parchita)', 4),
  ('frutas', 'Piña', 50, 'pina', 5),
  ('frutas', 'Aguacate', 160, 'aguacate', 6),
  ('frutas', 'Limón', 29, 'limon', 7),
  ('frutas', 'Guayaba', 68, 'guayaba', 8),
  ('frutas', 'Zapote', 124, 'zapote', 9),
  ('frutas', 'Naranja dulce', 47, 'naranja dulce', 10),
  
  -- Víveres
  ('víveres (tuberculos)', 'Yuca cocida', 125, 'yuca cocida', 1),
  ('víveres (tuberculos)', 'Plátano verde cocido', 132, 'platano verde cocido', 2),
  ('víveres (tuberculos)', 'Plátano maduro cocido', 155, 'platano maduro cocido', 3),
  ('víveres (tuberculos)', 'Guineito verde cocido', 116, 'guineito verde cocido', 4),
  ('víveres (tuberculos)', 'Yautía blanca cocida', 95, 'yautia blanca cocida', 5),
  ('víveres (tuberculos)', 'Yautía amarilla cocida', 100, 'yautia amarilla cocida', 6),
  ('víveres (tuberculos)', 'Batata asada/cocida', 86, 'batata asada/cocida', 7),
  ('víveres (tuberculos)', 'Ñame cocido', 118, 'name cocido', 8),
  ('víveres (tuberculos)', 'Casabe', 360, 'casabe', 9),
  ('víveres (tuberculos)', 'Mangú de plátano verde', 150, 'mangu de platano verde', 10),

  -- Arroces
  ('arroces', 'Arroz blanco cocido', 130, 'arroz blanco cocido', 1),
  ('arroces', 'Moro de habichuelas', 145, 'moro de habichuelas', 2),
  ('arroces', 'Arroz con guandules', 142, 'arroz con guandules', 3),
  ('arroces', 'Locrio de pollo', 180, 'locrio de pollo', 4),
  ('arroces', 'Locrio de arenque', 175, 'locrio de arenque', 5),

  -- Cereales
  ('cereales', 'Avena cocida con leche', 85, 'avena cocida con leche', 1),
  ('cereales', 'Harina de maíz (Funche)', 110, 'harina de maiz (funche)', 2),
  ('cereales', 'Pan de agua', 265, 'pan de agua', 3),
  ('cereales', 'Pan de sobao', 280, 'pan de sobao', 4),
  ('cereales', 'Espaguetis a la dominicana', 158, 'espaguetis a la dominicana', 5),

  -- Legumbres
  ('habichuelas (legumbres)', 'Habichuelas rojas guisadas', 110, 'habichuelas rojas guisadas', 1),
  ('habichuelas (legumbres)', 'Habichuelas negras guisadas', 115, 'habichuelas negras guisadas', 2),
  ('habichuelas (legumbres)', 'Habichuelas blancas guisadas', 120, 'habichuelas blancas guisadas', 3),
  ('habichuelas (legumbres)', 'Guandules guisados', 118, 'guandules guisados', 4),
  ('habichuelas (legumbres)', 'Lentejas guisadas', 105, 'lentejas guisadas', 5),

  -- Proteínas
  ('proteinas animales', 'Pechuga de pollo al cardero', 165, 'pechuga de pollo al cardero', 1),
  ('proteinas animales', 'Pollo frito (Pica pollo)', 290, 'pollo frito (pica pollo)', 2),
  ('proteinas animales', 'Carne de res guisada', 220, 'carne de res guisada', 3),
  ('proteinas animales', 'Carne de cerdo guisada', 242, 'carne de cerdo guisada', 4),
  ('proteinas animales', 'Chivo guisado', 143, 'chivo guisado', 5),
  ('proteinas animales', 'Huevo frito', 196, 'huevo frito', 6),
  ('proteinas animales', 'Huevo revuelto con tomate/cebolla', 150, 'huevo revuelto con tomate/cebolla', 7),
  ('proteinas animales', 'Salami dominicano frito', 310, 'salami dominicano frito', 8),
  ('proteinas animales', 'Longaniza frita', 330, 'longaniza frita', 9),

  -- Pescados
  ('pescados y mariscos', 'Bacalao guisado', 120, 'bacalao guisado', 1),
  ('pescados y mariscos', 'Arenque guisado', 180, 'arenque guisado', 2),
  ('pescados y mariscos', 'Pescado frito', 230, 'pescado frito', 3),
  ('pescados y mariscos', 'Pescado con coco', 190, 'pescado con coco', 4),
  ('pescados y mariscos', 'Atún en lata al natural', 116, 'atun en lata al natural', 5),

  -- Lácteos y Quesos
  ('lacteos y quesos', 'Leche entera', 61, 'leche entera', 1),
  ('lacteos y quesos', 'Queso de freír', 320, 'queso de freir', 2),
  ('lacteos y quesos', 'Queso de hoja', 280, 'queso de hoja', 3),
  ('lacteos y quesos', 'Queso crema', 340, 'queso crema', 4),

  -- Bebidas
  ('bebidas tipicas', 'Agua', 0, 'agua', 1),
  ('bebidas tipicas', 'Café con leche y azúcar', 45, 'cafe con leche y azucar', 2),
  ('bebidas tipicas', 'Jugo de naranja natural', 45, 'juego de naranja natural', 3),
  ('bebidas tipicas', 'Morir soñando', 95, 'morir sonando', 4),
  ('bebidas tipicas', 'Malta con leche condensada', 120, 'malta con leche condensada', 5)
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
