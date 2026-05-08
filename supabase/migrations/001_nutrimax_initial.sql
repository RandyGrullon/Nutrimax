-- NutriMax initial schema for Supabase Postgres
-- Run in Supabase SQL Editor after creating the project.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text,
  phone text,
  age integer,
  sex text CHECK (sex IS NULL OR sex IN ('female', 'male', 'other', 'unknown')),
  weight_kg numeric(6, 2),
  height_cm numeric(6, 2),
  body_fat_pct numeric(5, 2),
  waist_cm numeric(6, 2),
  goal_weight_kg numeric(6, 2),
  bioimpedance_report jsonb,
  derived_metrics jsonb,
  clinical_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  clinical_profile_version integer NOT NULL DEFAULT 1
);

CREATE TRIGGER clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE public.clinical_profile_revisions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_revisions_client_created ON public.clinical_profile_revisions(client_id, created_at DESC);

CREATE TABLE public.diets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  description text,
  plan jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TRIGGER diets_updated_at
BEFORE UPDATE ON public.diets
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE public.client_diet_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  diet_id uuid NOT NULL REFERENCES public.diets(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('active', 'archived')),
  starts_on date,
  ends_on date,
  notes text,
  customization jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_client_status ON public.client_diet_assignments(client_id, status);

CREATE TABLE public.client_timeline_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_client_created ON public.client_timeline_events(client_id, created_at DESC);
