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
import { FormProvider, useForm, type Path } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { MetricsPanel } from '@/components/MetricsPanel';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';

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

const STEP_FIELDS: Record<number, Path<CreateClientBody>[]> = {
  1: [
    'full_name',
    'email',
    'phone',
    'age',
    'sex',
    'weight_kg',
    'height_cm',
    'body_fat_pct',
    'waist_cm',
    'goal_weight_kg',
    'bioimpedance_report',
  ],
  2: [
    'clinical_profile.step2.goal',
    'clinical_profile.step2.timeframe',
    'clinical_profile.step2.pastDiets',
  ],
  3: [
    'clinical_profile.step3.conditions',
    'clinical_profile.step3.digestive',
    'clinical_profile.step3.allergies',
    'clinical_profile.step3.pregnancyLactation',
    'clinical_profile.step3.medications',
  ],
  4: [
    'clinical_profile.step4.emotionalEating',
    'clinical_profile.step4.bingeEpisodes',
    'clinical_profile.step4.foodRelationship',
    'clinical_profile.step4.guiltOrRestriction',
  ],
  5: [
    'clinical_profile.step5.mealsPerDay',
    'clinical_profile.step5.usualMealTimes',
    'clinical_profile.step5.breakfast',
    'clinical_profile.step5.snacks',
    'clinical_profile.step5.eatingOutFrequency',
    'clinical_profile.step5.sugar',
    'clinical_profile.step5.alcohol',
    'clinical_profile.step5.sodasJuices',
    'clinical_profile.step5.waterDaily',
  ],
  6: [
    'clinical_profile.step6.wakeSleep',
    'clinical_profile.step6.workType',
    'clinical_profile.step6.stressLevel',
    'clinical_profile.step6.sleepQuality',
  ],
  7: [
    'clinical_profile.step7.exercises',
    'clinical_profile.step7.exerciseType',
    'clinical_profile.step7.frequencyPerWeek',
    'clinical_profile.step7.durationMinutes',
  ],
  8: [
    'clinical_profile.step8.likes',
    'clinical_profile.step8.dislikes',
    'clinical_profile.step8.budget',
    'clinical_profile.step8.kitchenAccess',
    'clinical_profile.step8.foodCulture',
  ],
  9: [
    'clinical_profile.step9.bowelFrequency',
    'clinical_profile.step9.bloating',
    'clinical_profile.step9.reflux',
    'clinical_profile.step9.perceivedIntolerances',
  ],
};

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
  const [saving, setSaving] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const form = useForm<CreateClientBody>({
    resolver: zodResolver(createClientBodySchema),
    defaultValues: initialValues ?? defaultValues,
    mode: 'onBlur',
  });

  const { register, handleSubmit, control, trigger } = form;

  async function onValid(data: CreateClientBody) {
    setSaving(true);
    try {
      const path = mode === 'create' ? '/clients' : `/clients/${clientId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await apiFetch(path, { method, body: JSON.stringify(data) });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      const json = (await res.json()) as { id: string };
      showSuccessToast(mode === 'create' ? 'Paciente creado correctamente.' : 'Cambios guardados.');
      router.push(`/clients/${json.id}`);
      router.refresh();
    } catch {
      showErrorToast('No pudimos guardar el paciente.');
    } finally {
      setSaving(false);
    }
  }

  async function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 9) {
      const fields = STEP_FIELDS[step];
      const ok = await trigger(fields, { shouldFocus: true });
      if (!ok) {
        showErrorToast('Revisa los datos de este paso antes de continuar.');
        return;
      }
      next();
      return;
    }
    void handleSubmit(onValid)(e);
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
      <form onSubmit={onFormSubmit} className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-800 dark:text-brand-300">
            Paso {step} de 9 · {Math.round((step / 9) * 100)}%
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StepIcon className="h-6 w-6 text-brand-700" aria-hidden />
            <h1 className="text-xl font-semibold text-foreground">{STEPS[step - 1].title}</h1>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-brand-600 transition-all duration-300 dark:bg-brand-500"
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
                className="rounded-2xl border border-border bg-card p-4 shadow-card dark:shadow-card-dark"
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

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={step === 1}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm disabled:opacity-40"
              >
                Atrás
              </button>
              {step < 9 ? (
                <button
                  type="submit"
                  className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800 disabled:opacity-60 dark:bg-brand-600 dark:hover:bg-brand-500"
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
        <Input {...register('full_name')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Email</span>
        <Input type="email" {...register('email')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Teléfono</span>
        <Input {...register('phone')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Edad</span>
        <Input type="number" {...register('age')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Sexo</span>
        <Select {...register('sex')}>
          <option value="">—</option>
          <option value="female">Femenino</option>
          <option value="male">Masculino</option>
          <option value="other">Otro</option>
          <option value="unknown">Prefiero no indicar</option>
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Peso actual (kg)</span>
        <Input type="number" step="0.1" {...register('weight_kg')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Estatura (cm)</span>
        <Input type="number" step="0.1" {...register('height_cm')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>% grasa (opcional)</span>
        <Input type="number" step="0.1" {...register('body_fat_pct')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Cintura/abdomen (cm)</span>
        <Input type="number" step="0.1" {...register('waist_cm')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Peso meta (kg)</span>
        <Input type="number" step="0.1" {...register('goal_weight_kg')} />
      </label>

      <div className="sm:col-span-2">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-left text-sm font-medium text-foreground"
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
              <Input type="date" className="py-1 text-xs" {...register('bioimpedance_report.measured_at')} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Peso informe
              <Input type="number" step="0.1" className="py-1 text-xs" {...register('bioimpedance_report.weight')} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              % grasa informe
              <Input type="number" step="0.1" className="py-1 text-xs" {...register('bioimpedance_report.body_fat_pct')} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              TMB informe
              <Input type="number" className="py-1 text-xs" {...register('bioimpedance_report.basal_metabolic_rate')} />
            </label>
            <label className="sm:col-span-2 flex flex-col gap-1 text-xs">
              Notas / texto libre del informe
              <Textarea className="py-1 text-xs" rows={2} {...register('bioimpedance_report.obesity_assessment')} />
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
        <Textarea rows={3} {...register('clinical_profile.step2.goal')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        ¿En cuánto tiempo?
        <Input {...register('clinical_profile.step2.timeframe')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Dietas previas
        <Textarea rows={3} {...register('clinical_profile.step2.pastDiets')} />
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
        <Select {...register('clinical_profile.step6.workType')}>
          <option value="">—</option>
          <option value="sedentary">Sedentario</option>
          <option value="active">Activo</option>
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Estrés
        <Select {...register('clinical_profile.step6.stressLevel')}>
          <option value="">—</option>
          <option value="low">Bajo</option>
          <option value="medium">Medio</option>
          <option value="high">Alto</option>
        </Select>
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
        <Select {...register('clinical_profile.step7.exercises')}>
          <option value="">—</option>
          <option value="yes">Sí</option>
          <option value="no">No</option>
        </Select>
      </label>
      <Field label="Tipo" className="sm:col-span-2" {...register('clinical_profile.step7.exerciseType')} />
      <label className="flex flex-col gap-1 text-sm">
        Días/semana
        <Input type="number" {...register('clinical_profile.step7.frequencyPerWeek')} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Duración (min)
        <Input type="number" {...register('clinical_profile.step7.durationMinutes')} />
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
      <Textarea rows={2} {...textareaProps} />
    </label>
  );
}
