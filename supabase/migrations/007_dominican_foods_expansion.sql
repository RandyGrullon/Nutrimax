-- Expansión del catálogo con alimentos típicos de República Dominicana
-- Este script añade alimentos comunes en la dieta dominicana a las categorías existentes.

-- 1. Añadir categorías adicionales si son necesarias (ej. Embutidos dominicanos)
-- Por ahora usaremos las existentes para mantener la simplicidad.

-- 2. Insertar alimentos dominicanos
INSERT INTO public.foods (category_id, name, kcal_per_100g, name_normalized, sort_order)
SELECT c.id, v.name, v.kcal, v.nn, v.ord
FROM (VALUES
  -- Frutas
  ('frutas', 'Mango', 60::numeric, 'mango', 10),
  ('frutas', 'Lechosa (Papaya)', 43, 'lechosa (papaya)', 11),
  ('frutas', 'Chinola (Parchita)', 97, 'chinola (parchita)', 12),
  ('frutas', 'Guayaba', 68, 'guayaba', 13),
  ('frutas', 'Zapote', 124, 'zapote', 14),
  ('frutas', 'Guanábana', 66, 'guanabana', 15),
  ('frutas', 'Limón', 29, 'limon', 16),
  
  -- Tubérculos (Víveres)
  ('tuberculos', 'Yautía blanca cocida', 95, 'yautia blanca cocida', 20),
  ('tuberculos', 'Yautía amarilla cocida', 100, 'yautia amarilla cocida', 21),
  ('tuberculos', 'Mapuey cocido', 110, 'mapuey cocido', 22),
  ('tuberculos', 'Mangú de plátano verde (sin grasa)', 132, 'mangu de platano verde (sin grasa)', 23),
  ('tuberculos', 'Mangú de plátano maduro', 155, 'mangu de platano maduro', 24),
  
  -- Legumbres
  ('legumbres', 'Habichuelas rojas cocidas', 127, 'habichuelas rojas cocidas', 10),
  ('legumbres', 'Habichuelas negras cocidas', 132, 'habichuelas negras cocidas', 11),
  ('legumbres', 'Habichuelas blancas cocidas', 139, 'habichuelas blancas cocidas', 12),
  ('legumbres', 'Guandules verdes cocidos', 118, 'guandules verdes cocidos', 13),
  
  -- Proteínas
  ('proteinas animales', 'Salami dominicano (frito/guisado)', 300, 'salami dominicano', 10),
  ('proteinas animales', 'Longaniza dominicana', 320, 'longaniza dominicana', 11),
  ('proteinas animales', 'Carne de chivo guisada', 143, 'carne de chivo guisada', 12),
  ('proteinas animales', 'Carne de cerdo (masa)', 242, 'carne de cerdo (masa)', 13),
  ('pescados y mariscos', 'Bacalao noruego (desalado)', 82, 'bacalao noruego', 10),
  ('pescados y mariscos', 'Arenque (desalado)', 158, 'arenque', 11),
  
  -- Grasas
  ('grasas y aceites', 'Aguacate', 160, 'aguacate', 10),
  
  -- Lácteos / Quesos
  ('lacteos', 'Queso de freír dominicano', 320, 'queso de freir dominicano', 10),
  ('lacteos', 'Queso de hoja', 280, 'queso de hoja', 11),
  
  -- Bebidas / Otros
  ('bebidas', 'Jugo de avena con leche', 85, 'jugo de avena con leche', 10),
  ('bebidas', 'Morir soñando (Naranja + Leche + Azúcar)', 95, 'morir sonando', 11),
  ('cereales', 'Locrio de pollo', 180, 'locrio de pollo', 20),
  ('cereales', 'Locrio de arenque/bacalao', 175, 'locrio de arenque/bacalao', 21)
) AS v(cat_nn, name, kcal, nn, ord)
JOIN public.food_categories c ON c.name_normalized = v.cat_nn
WHERE NOT EXISTS (
  SELECT 1 FROM public.foods f
  WHERE f.category_id = c.id AND f.name_normalized = v.nn
);
