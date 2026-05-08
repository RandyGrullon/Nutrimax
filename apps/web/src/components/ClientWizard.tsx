'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createClientBodySchema, type CreateClientBody } from '@nutrimax/shared';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Apple,
  Brain,
  ClipboardList,
  Target,
  HeartPulse,
  Moon,
  Stethoscope,
  User,
  Utensils,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type TextareaHTMLAttributes } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { MetricsPanel } from '@/components/MetricsPanel';

const STEPS = [
  { id: 1, title: 'Datos y antropometría', icon: User },
  { id: 2, title: 'Objetivo', icon: Target },
  { id: 3, title: 'Historial clínico', icon: Stethoscope },
  { id: 4, title: 'Relación con la comida', icon: Brain },
  { id: 5, title: 'Hábitos alimenticios', icon: Utensils },
  { id: 6, title: 'Rutina diaria', icon: Moon },
  { id: 7, title: 'Actividad física', icon: Activity },
  { id: 8, title: 'Preferencias', icon: Apple },
  { id: 9, title: 'Salud digestiva', icon: HeartPulse },
] as const;

const defaultValues: CreateClientBody = {
  full_name: '',
  email: '',
  phone: '',
  clinical_profile: {
    step2: {},
    step3: {},
    step4: {},
    step5: {},
    step6: {},
    step7: {},
    step8: {},
    step9: {},
  },
};

function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function mapClientRowToForm(row: Record<string, unknown>): CreateClientBody {
  const clinical = (row.clinical_profile as CreateClientBody['clinical_profile']) ?? {};
  return {
    full_name: String(row.full_name ?? ''),
    email: row.email ? String(row.email) : '',
    phone: row.phone ? String(row.phone) : '',
    age: toNum(row.age),
    sex: (row.sex as CreateClientBody['sex']) ?? undefined,
    weight_kg: toNum(row.weight_kg),
    height_cm: toNum(row.height_cm),
    body_fat_pct: toNum(row.body_fat_pct),
    waist_cm: toNum(row.waist_cm),
    goal_weight_kg: toNum(row.goal_weight_kg),
    bioimpedance_report: (row.bioimpedance_report as CreateClientBody['bioimpedance_report']) ?? {},
    clinical_profile: {
      step2: clinical.step2 ?? {},
      step3: clinical.step3 ?? {},
      step4: clinical.step4 ?? {},
      step5: clinical.step5 ?? {},
      step6: clinical.step6 ?? {},
      step7: clinical.step7 ?? {},
      step8: clinical.step8 ?? {},
      step9: clinical.step9 ?? {},
    },
  };
}

export function ClientWizard({
  mode,
  clientId,
  initialValues,
}: {
  mode: 'create' | 'edit';
  clientId?: string;
  initialValues?: CreateClientBody;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const form = useForm<CreateClientBody>({
    resolver: zodResolver(createClientBodySchema),
    defaultValues: initialValues ?? defaultValues,
    mode: 'onBlur',
  });

  const { register, handleSubmit, control, formState } = form;

  async function onValid(data: CreateClientBody) {
    setError(null);
    setSaving(true);
    try {
      const path = mode === 'create' ? '/clients' : `/clients/${clientId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await apiFetch(path, { method, body: JSON.stringify(data) });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      const json = (await res.json()) as { id: string };
      router.push(`/clients/${json.id}`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function next() {
    setStep((s) => Math.min(9, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }

  const StepIcon = STEPS[step - 1].icon;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 9) {
            next();
            return;
          }
          void handleSubmit(onValid)(e);
        }}
        className="mx-auto max-w-3xl px-4 py-6"
      >
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-800">
            Paso {step} de 9 · {Math.round((step / 9) * 100)}%
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StepIcon className="h-6 w-6 text-brand-700" aria-hidden />
            <h1 className="text-xl font-semibold text-slate-900">{STEPS[step - 1].title}</h1>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${(step / 9) * 100}%` }}
            />
          </div>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {step === 1 ? (
                  <Step1 register={register} bioOpen={bioOpen} setBioOpen={setBioOpen} />
                ) : null}
                {step === 2 ? <Step2 register={register} /> : null}
                {step === 3 ? <Step3 register={register} /> : null}
                {step === 4 ? <Step4 register={register} /> : null}
                {step === 5 ? <Step5 register={register} /> : null}
                {step === 6 ? <Step6 register={register} /> : null}
                {step === 7 ? <Step7 register={register} /> : null}
                {step === 8 ? <Step8 register={register} /> : null}
                {step === 9 ? <Step9 register={register} /> : null}
              </motion.div>
            </AnimatePresence>

            {formState.errors.full_name && step === 1 ? (
              <p className="mt-2 text-sm text-red-600">{formState.errors.full_name.message}</p>
            ) : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={step === 1}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
              >
                Atrás
              </button>
              {step < 9 ? (
                <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm text-white">
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? 'Guardando…' : 'Confirmar y guardar'}
                </button>
              )}
            </div>
          </div>
          <div className="w-full shrink-0 lg:w-80">
            <MetricsPanel control={control} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function Step1({
  register,
  bioOpen,
  setBioOpen,
}: {
  register: ReturnType<typeof useForm<CreateClientBody>>['register'];
  bioOpen: boolean;
  setBioOpen: (v: boolean) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
        <span>Nombre completo *</span>
        <input className="rounded-lg border border-slate-300 px-3 py-2" {...register('full_name')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Email</span>
        <input type="email" className="rounded-lg border border-slate-300 px-3 py-2" {...register('email')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Teléfono</span>
        <input className="rounded-lg border border-slate-300 px-3 py-2" {...register('phone')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Edad</span>
        <input type="number" className="rounded-lg border border-slate-300 px-3 py-2" {...register('age')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Sexo</span>
        <select className="rounded-lg border border-slate-300 px-3 py-2" {...register('sex')}>
          <option value="">—</option>
          <option value="female">Femenino</option>
          <option value="male">Masculino</option>
          <option value="other">Otro</option>
          <option value="unknown">Prefiero no indicar</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Peso actual (kg)</span>
        <input type="number" step="0.1" className="rounded-lg border border-slate-300 px-3 py-2" {...register('weight_kg')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Estatura (cm)</span>
        <input type="number" step="0.1" className="rounded-lg border border-slate-300 px-3 py-2" {...register('height_cm')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>% grasa (opcional)</span>
        <input type="number" step="0.1" className="rounded-lg border border-slate-300 px-3 py-2" {...register('body_fat_pct')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Cintura/abdomen (cm)</span>
        <input type="number" step="0.1" className="rounded-lg border border-slate-300 px-3 py-2" {...register('waist_cm')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Peso meta (kg)</span>
        <input type="number" step="0.1" className="rounded-lg border border-slate-300 px-3 py-2" {...register('goal_weight_kg')} />
      </label>

      <div className="sm:col-span-2">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium"
          onClick={() => setBioOpen(!bioOpen)}
          aria-expanded={bioOpen}
        >
          <span className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" aria-hidden />
            Informe de bioimpedancia (opcional)
          </span>
          <span>{bioOpen ? '−' : '+'}</span>
        </button>
        {bioOpen ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              Fecha medición
              <input type="date" className="rounded border border-slate-300 px-2 py-1" {...register('bioimpedance_report.measured_at')} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Peso informe
              <input type="number" step="0.1" className="rounded border border-slate-300 px-2 py-1" {...register('bioimpedance_report.weight')} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              % grasa informe
              <input type="number" step="0.1" className="rounded border border-slate-300 px-2 py-1" {...register('bioimpedance_report.body_fat_pct')} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              TMB informe
              <input type="number" className="rounded border border-slate-300 px-2 py-1" {...register('bioimpedance_report.basal_metabolic_rate')} />
            </label>
            <label className="sm:col-span-2 flex flex-col gap-1 text-xs">
              Notas / texto libre del informe
              <textarea className="rounded border border-slate-300 px-2 py-1" rows={2} {...register('bioimpedance_report.obesity_assessment')} />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Step2({ register }: { register: ReturnType<typeof useForm<CreateClientBody>>['register'] }) {
  return (
    <div className="grid gap-4">
      <label className="flex flex-col gap-1 text-sm">
        ¿Qué deseas lograr?
        <textarea className="rounded-lg border border-slate-300 px-3 py-2" rows={3} {...register('clinical_profile.step2.goal')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        ¿En cuánto tiempo?
        <input className="rounded-lg border border-slate-300 px-3 py-2" {...register('clinical_profile.step2.timeframe')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Dietas previas
        <textarea className="rounded-lg border border-slate-300 px-3 py-2" rows={3} {...register('clinical_profile.step2.pastDiets')} />
      </label>
    </div>
  );
}

function Step3({ register }: { register: ReturnType<typeof useForm<CreateClientBody>>['register'] }) {
  return (
    <div className="grid gap-4">
      <Field label="Enfermedades diagnosticadas" {...register('clinical_profile.step3.conditions')} />
      <Field label="Problemas digestivos" {...register('clinical_profile.step3.digestive')} />
      <Field label="Alergias o intolerancias" {...register('clinical_profile.step3.allergies')} />
      <Field label="Embarazo o lactancia" {...register('clinical_profile.step3.pregnancyLactation')} />
      <Field label="Medicamentos o suplementos" {...register('clinical_profile.step3.medications')} />
    </div>
  );
}

function Step4({ register }: { register: ReturnType<typeof useForm<CreateClientBody>>['register'] }) {
  return (
    <div className="grid gap-4">
      <Field label="¿Comes por ansiedad, estrés o aburrimiento?" {...register('clinical_profile.step4.emotionalEating')} />
      <Field label="Episodios de atracones" {...register('clinical_profile.step4.bingeEpisodes')} />
      <Field label="Relación con la comida" {...register('clinical_profile.step4.foodRelationship')} />
      <Field label="Culpa o restricción extrema" {...register('clinical_profile.step4.guiltOrRestriction')} />
    </div>
  );
}

function Step5({ register }: { register: ReturnType<typeof useForm<CreateClientBody>>['register'] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Comidas al día" {...register('clinical_profile.step5.mealsPerDay')} />
      <Field label="Horarios habituales" {...register('clinical_profile.step5.usualMealTimes')} />
      <Field label="Desayuno" className="sm:col-span-2" {...register('clinical_profile.step5.breakfast')} />
      <Field label="Snacks" className="sm:col-span-2" {...register('clinical_profile.step5.snacks')} />
      <Field label="Frecuencia comer fuera" {...register('clinical_profile.step5.eatingOutFrequency')} />
      <Field label="Azúcar" {...register('clinical_profile.step5.sugar')} />
      <Field label="Alcohol" {...register('clinical_profile.step5.alcohol')} />
      <Field label="Refrescos/jugos" {...register('clinical_profile.step5.sodasJuices')} />
      <Field label="Agua diaria" {...register('clinical_profile.step5.waterDaily')} />
    </div>
  );
}

function Step6({ register }: { register: ReturnType<typeof useForm<CreateClientBody>>['register'] }) {
  return (
    <div className="grid gap-4">
      <Field label="Hora despertar / dormir" {...register('clinical_profile.step6.wakeSleep')} />
      <label className="flex flex-col gap-1 text-sm">
        Trabajo
        <select className="rounded-lg border border-slate-300 px-3 py-2" {...register('clinical_profile.step6.workType')}>
          <option value="">—</option>
          <option value="sedentary">Sedentario</option>
          <option value="active">Activo</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Estrés
        <select className="rounded-lg border border-slate-300 px-3 py-2" {...register('clinical_profile.step6.stressLevel')}>
          <option value="">—</option>
          <option value="low">Bajo</option>
          <option value="medium">Medio</option>
          <option value="high">Alto</option>
        </select>
      </label>
      <Field label="Calidad del sueño" {...register('clinical_profile.step6.sleepQuality')} />
    </div>
  );
}

function Step7({ register }: { register: ReturnType<typeof useForm<CreateClientBody>>['register'] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        ¿Realizas ejercicio?
        <select className="rounded-lg border border-slate-300 px-3 py-2" {...register('clinical_profile.step7.exercises')}>
          <option value="">—</option>
          <option value="yes">Sí</option>
          <option value="no">No</option>
        </select>
      </label>
      <Field label="Tipo" className="sm:col-span-2" {...register('clinical_profile.step7.exerciseType')} />
      <label className="flex flex-col gap-1 text-sm">
        Días/semana
        <input type="number" className="rounded-lg border border-slate-300 px-3 py-2" {...register('clinical_profile.step7.frequencyPerWeek')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Duración (min)
        <input type="number" className="rounded-lg border border-slate-300 px-3 py-2" {...register('clinical_profile.step7.durationMinutes')} />
      </label>
    </div>
  );
}

function Step8({ register }: { register: ReturnType<typeof useForm<CreateClientBody>>['register'] }) {
  return (
    <div className="grid gap-4">
      <Field label="Alimentos que gustan" {...register('clinical_profile.step8.likes')} />
      <Field label="Alimentos que no gustan" {...register('clinical_profile.step8.dislikes')} />
      <Field label="Presupuesto aproximado" {...register('clinical_profile.step8.budget')} />
      <Field label="Acceso a cocina" {...register('clinical_profile.step8.kitchenAccess')} />
      <Field label="Cultura alimentaria" {...register('clinical_profile.step8.foodCulture')} />
    </div>
  );
}

function Step9({ register }: { register: ReturnType<typeof useForm<CreateClientBody>>['register'] }) {
  return (
    <div className="grid gap-4">
      <Field label="Frecuencia de evacuación" {...register('clinical_profile.step9.bowelFrequency')} />
      <Field label="Inflamación abdominal" {...register('clinical_profile.step9.bloating')} />
      <Field label="Reflujo o acidez" {...register('clinical_profile.step9.reflux')} />
      <Field label="Intolerancias percibidas" {...register('clinical_profile.step9.perceivedIntolerances')} />
    </div>
  );
}

function Field({
  label,
  className = '',
  ...textareaProps
}: {
  label: string;
  className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      {label}
      <textarea className="rounded-lg border border-slate-300 px-3 py-2" rows={2} {...textareaProps} />
    </label>
  );
}
