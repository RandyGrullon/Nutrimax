-- Seguimiento mensual / mejorías del paciente (gráficos + historial)

CREATE TABLE public.client_progress_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  period_month text,
  weight_kg numeric(6, 2),
  waist_cm numeric(6, 2),
  body_fat_pct numeric(5, 2),
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_progress_month_format CHECK (
    period_month IS NULL OR period_month ~ '^\d{4}-\d{2}$'
  )
);

CREATE INDEX idx_progress_client_recorded ON public.client_progress_snapshots (client_id, recorded_at ASC);
CREATE INDEX idx_progress_client_created ON public.client_progress_snapshots (client_id, created_at DESC);
