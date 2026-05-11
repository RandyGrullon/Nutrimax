-- SCRIPT DE REESTABLECIMIENTO DEL CATÁLOGO DOMINICANO
-- ADVERTENCIA: Este script ELIMINA los alimentos y categorías actuales para cargar la lista dominicana limpia.

-- 1. Limpiar datos actuales (con precaución)
-- Si tienes dietas asignadas, esto fallará por llaves foráneas. 
-- En ese caso, usa DELETE CASCADE o elimina las asignaciones primero.
TRUNCATE public.foods, public.food_categories RESTART IDENTITY CASCADE;

-- 2. Insertar categorías dominicanas organizadas
INSERT INTO public.food_categories (name, sort_order, name_normalized)
VALUES
  ('Víveres (Tubérculos)', 10, 'víveres (tuberculos)'),
  ('Arroces', 20, 'arroces'),
  ('Habichuelas (Legumbres)', 30, 'habichuelas (legumbres)'),
  ('Proteínas animales', 40, 'proteinas animales'),
  ('Víveres blancos', 45, 'viveres blancos'), -- Opcional, si quieres separar yautía/ñame
  ('Vegetales y Ensaladas', 50, 'vegetales y ensaladas'),
  ('Frutas Tropicales', 60, 'frutas tropicales'),
  ('Cereales y Harinas', 70, 'cereales y harinas'),
  ('Lácteos y Quesos', 80, 'lacteos y quesos'),
  ('Grasas y Aceites', 90, 'grasas y aceites'),
  ('Pescados y Mariscos', 100, 'pescados y mariscos'),
  ('Bebidas y Jugos', 110, 'bebidas y jugos');

-- 3. Insertar alimentos dominicanos vinculados por name_normalized
INSERT INTO public.foods (category_id, name, kcal_per_100g, name_normalized, sort_order)
SELECT c.id, v.name, v.kcal, v.nn, v.ord
FROM (VALUES
  -- Víveres
  ('víveres (tuberculos)', 'Plátano verde hervido', 132::numeric, 'platano verde hervido', 1),
  ('víveres (tuberculos)', 'Plátano maduro hervido', 155, 'platano maduro hervido', 2),
  ('víveres (tuberculos)', 'Guineito verde', 116, 'guineito verde', 3),
  ('víveres (tuberculos)', 'Yuca hervida', 125, 'yuca hervida', 4),
  ('víveres (tuberculos)', 'Mangú de plátano', 150, 'mangu de platano', 5),
  ('víveres (tuberculos)', 'Batata asada', 86, 'batata asada', 6),
  ('víveres (tuberculos)', 'Ñame', 118, 'name', 7),
  ('víveres (tuberculos)', 'Yautía blanca', 95, 'yautia blanca', 8),
  ('víveres (tuberculos)', 'Yautía amarilla', 100, 'yautia amarilla', 9),
  ('víveres (tuberculos)', 'Casabe', 360, 'casabe', 10),

  -- Arroces
  ('arroces', 'Arroz blanco', 130, 'arroz blanco', 1),
  ('arroces', 'Moro de habichuelas rojas', 145, 'moro de habichuelas rojas', 2),
  ('arroces', 'Arroz con guandules', 142, 'arroz con guandules', 3),
  ('arroces', 'Locrio de pollo', 180, 'locrio de pollo', 4),
  ('arroces', 'Locrio de arenque', 175, 'locrio de arenque', 5),
  ('arroces', 'Locrio de salami', 210, 'locrio de salami', 6),

  -- Habichuelas
  ('habichuelas (legumbres)', 'Habichuelas rojas guisadas', 110, 'habichuelas rojas guisadas', 1),
  ('habichuelas (legumbres)', 'Habichuelas negras guisadas', 115, 'habichuelas negras guisadas', 2),
  ('habichuelas (legumbres)', 'Guandules guisados', 118, 'guandules guisados', 3),
  ('habichuelas (legumbres)', 'Habichuelas con dulce', 140, 'habichuelas con dulce', 4),

  -- Proteínas
  ('proteinas animales', 'Pechuga de pollo al cardero', 165, 'pechuga de pollo al cardero', 1),
  ('proteinas animales', 'Carne de res guisada', 220, 'carne de res guisada', 2),
  ('proteinas animales', 'Salami dominicano frito', 310, 'salami dominicano frito', 3),
  ('proteinas animales', 'Longaniza dominicana', 330, 'longaniza dominicana', 4),
  ('proteinas animales', 'Chivo guisado', 143, 'chivo guisado', 5),
  ('proteinas animales', 'Huevo frito', 196, 'huevo frito', 6),
  ('proteinas animales', 'Cerdo asado (Puerca)', 250, 'cerdo asado', 7),

  -- Vegetales
  ('vegetales y ensaladas', 'Ensalada de coditos', 160, 'ensalada de coditos', 1),
  ('vegetales y ensaladas', 'Ensalada rusa', 150, 'ensalada rusa', 2),
  ('vegetales y ensaladas', 'Tayota hervida', 19, 'tayota hervida', 3),
  ('vegetales y ensaladas', 'Auyama', 26, 'auyama', 4),
  ('vegetales y ensaladas', 'Aguacate', 160, 'aguacate', 5),

  -- Frutas
  ('frutas tropicales', 'Mango', 60, 'mango', 1),
  ('frutas tropicales', 'Lechosa', 43, 'lechosa', 2),
  ('frutas tropicales', 'Chinola', 97, 'chinola', 3),
  ('frutas tropicales', 'Zapote', 124, 'zapote', 4),
  ('frutas tropicales', 'Guayaba', 68, 'guayaba', 5),

  -- Cereales/Harinas
  ('cereales y harinas', 'Pan de agua', 265, 'pan de agua', 1),
  ('cereales y harinas', 'Pan de sobao', 280, 'pan de sobao', 2),
  ('cereales y harinas', 'Avena con leche', 85, 'avena con leche', 3),
  ('cereales y harinas', 'Funche (Harina de maíz)', 110, 'funche', 4),
  ('cereales y harinas', 'Espaguetis a la dominicana', 158, 'espaguetis a la dominicana', 5),

  -- Lácteos
  ('lacteos y quesos', 'Queso de freír', 320, 'queso de freir', 1),
  ('lacteos y quesos', 'Queso de hoja', 280, 'queso de hoja', 2),
  ('lacteos y quesos', 'Leche entera', 61, 'leche entera', 3),

  -- Pescados
  ('pescados y mariscos', 'Bacalao guisado', 120, 'bacalao guisado', 1),
  ('pescados y mariscos', 'Arenque guisado', 180, 'arenque guisado', 2),
  ('pescados y mariscos', 'Pescado frito', 230, 'pescado frito', 3),

  -- Bebidas
  ('bebidas y jugos', 'Morir soñando', 95, 'morir sonando', 1),
  ('bebidas y jugos', 'Malta con leche condensada', 120, 'malta con leche condensada', 2),
  ('bebidas y jugos', 'Jugo de naranja natural', 45, 'jugo de naranja natural', 3)
) AS v(cat_nn, name, kcal, nn, ord)
JOIN public.food_categories c ON c.name_normalized = v.cat_nn;
