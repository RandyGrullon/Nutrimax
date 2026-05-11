-- Separa "Cereales y tubérculos" en dos categorías y amplía el catálogo con víveres/granos típicos en RD.
-- Idempotente: convive con instalaciones que ya ejecutaron 004 antiguo o el 004 actualizado.
-- Mantén la lista de alimentos alineada con cereales/tubérculos en 004_food_labels_normalized_seed.sql.

INSERT INTO public.food_categories (name, sort_order, name_normalized)
SELECT v.name, v.sort_order, v.name_normalized
FROM (VALUES
  ('Cereales', 30, 'cereales'),
  ('Tubérculos', 35, 'tuberculos')
) AS v(name, sort_order, name_normalized)
WHERE NOT EXISTS (
  SELECT 1 FROM public.food_categories fc WHERE fc.name_normalized = v.name_normalized
);

-- Reasignar alimentos desde la categoría combinada legada (si existe).
UPDATE public.foods AS f
SET category_id = c_tub.id
FROM public.food_categories AS c_old
CROSS JOIN LATERAL (
  SELECT id FROM public.food_categories WHERE name_normalized = 'tuberculos' LIMIT 1
) AS c_tub
WHERE f.category_id = c_old.id
  AND c_old.name_normalized = 'cereales y tuberculos'
  AND f.name_normalized IN (
    'patata cocida',
    'batata cocida',
    'yuca cocida',
    'platano verde cocido',
    'platano maduro cocido',
    'name cocido',
    'malanga cocida',
    'guineo verde cocido',
    'casabe'
  );

UPDATE public.foods AS f
SET category_id = c_cer.id
FROM public.food_categories AS c_old
CROSS JOIN LATERAL (
  SELECT id FROM public.food_categories WHERE name_normalized = 'cereales' LIMIT 1
) AS c_cer
WHERE f.category_id = c_old.id
  AND c_old.name_normalized = 'cereales y tuberculos'
  AND f.name_normalized IN (
    'arroz blanco cocido',
    'moro de habichuelas',
    'arroz con guandules',
    'pan de agua',
    'pasta cocida',
    'avena en copos',
    'harina de maiz cocida (funche)',
    'maiz en mazorca cocido',
    'quinoa cocida',
    'tortilla de maiz',
    'pan integral'
  );

UPDATE public.foods AS f
SET category_id = c_cer.id
FROM public.food_categories AS c_old
CROSS JOIN LATERAL (
  SELECT id FROM public.food_categories WHERE name_normalized = 'cereales' LIMIT 1
) AS c_cer
WHERE f.category_id = c_old.id
  AND c_old.name_normalized = 'cereales y tuberculos';

DELETE FROM public.food_categories
WHERE name_normalized = 'cereales y tuberculos'
  AND NOT EXISTS (
    SELECT 1 FROM public.foods fd WHERE fd.category_id = food_categories.id
  );

INSERT INTO public.foods (category_id, name, kcal_per_100g, name_normalized, sort_order)
SELECT c.id, v.name, v.kcal, v.nn, v.ord
FROM (VALUES
  ('cereales', 'Arroz blanco cocido', 130::numeric, 'arroz blanco cocido', 1),
  ('cereales', 'Moro de habichuelas', 145, 'moro de habichuelas', 2),
  ('cereales', 'Arroz con guandules', 142, 'arroz con guandules', 3),
  ('cereales', 'Pan de agua', 265, 'pan de agua', 4),
  ('cereales', 'Pasta cocida', 131, 'pasta cocida', 5),
  ('cereales', 'Avena en copos', 389, 'avena en copos', 6),
  ('cereales', 'Harina de maíz cocida (funche)', 110, 'harina de maiz cocida (funche)', 7),
  ('cereales', 'Maíz en mazorca cocido', 96, 'maiz en mazorca cocido', 8),
  ('cereales', 'Quinoa cocida', 120, 'quinoa cocida', 9),
  ('cereales', 'Tortilla de maíz', 218, 'tortilla de maiz', 10),
  ('cereales', 'Pan integral', 247, 'pan integral', 11),
  ('tuberculos', 'Yuca cocida', 125, 'yuca cocida', 1),
  ('tuberculos', 'Plátano verde cocido', 132, 'platano verde cocido', 2),
  ('tuberculos', 'Plátano maduro cocido', 155, 'platano maduro cocido', 3),
  ('tuberculos', 'Ñame cocido', 118, 'name cocido', 4),
  ('tuberculos', 'Batata cocida', 86, 'batata cocida', 5),
  ('tuberculos', 'Malanga cocida', 87, 'malanga cocida', 6),
  ('tuberculos', 'Guineo verde cocido', 116, 'guineo verde cocido', 7),
  ('tuberculos', 'Patata cocida', 87, 'patata cocida', 8),
  ('tuberculos', 'Casabe', 360, 'casabe', 9)
) AS v(cat_nn, name, kcal, nn, ord)
JOIN public.food_categories c ON c.name_normalized = v.cat_nn
WHERE NOT EXISTS (
  SELECT 1 FROM public.foods f
  WHERE f.category_id = c.id AND f.name_normalized = v.nn
);
