-- Unificación de Dietas y Planes Alimenticios + Formularios de Pacientes

-- 1. Añadir columna items a diets para unificar
ALTER TABLE diets ADD COLUMN items JSONB DEFAULT '[]'::jsonb;

-- 2. Eliminar meal_plan_id de asignaciones (ya no habrá entidad intermedia)
ALTER TABLE client_diet_assignments DROP COLUMN IF EXISTS meal_plan_id;

-- 3. Eliminar tabla meal_plans (traslado de lógica a diets)
-- NOTA: En un entorno real migraríamos los items de meal_plans a las diets que los referenciaban, 
-- pero para esta refactorización asumimos un borrón y cuenta nueva o gestión manual de la transición.
DROP TABLE IF EXISTS meal_plans CASCADE;

-- 4. Crear tabla para los links de onboarding/intake de pacientes
CREATE TABLE client_intake_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    completed_at TIMESTAMP WITH TIME ZONE,
    preferences_data JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT unique_active_token_per_client UNIQUE (client_id, status) WHERE (status = 'pending')
);

-- Index para búsquedas rápidas por token
CREATE INDEX idx_client_intake_tokens_token ON client_intake_tokens(token);
