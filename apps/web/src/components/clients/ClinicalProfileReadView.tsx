import type { ClinicalProfile } from '@nutrimax/shared';
import { clinicalProfileSchema } from '@nutrimax/shared';
import {
  Activity,
  Apple,
  Brain,
  HeartPulse,
  Moon,
  Stethoscope,
  Target,
  Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function normalizeClinicalProfile(raw: unknown): ClinicalProfile {
  const r = asRecord(raw) ?? {};
  const parsed = clinicalProfileSchema.safeParse(r);
  return (parsed.success ? parsed.data : {}) as ClinicalProfile;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

function workTypeLabel(v: string | undefined): string | null {
  if (v === 'sedentary') return 'Principalmente sedentario';
  if (v === 'active') return 'Trabajo activo / de pie';
  return null;
}

function stressLabel(v: string | undefined): string | null {
  if (v === 'low') return 'Bajo';
  if (v === 'medium') return 'Medio';
  if (v === 'high') return 'Alto';
  return null;
}

function yesNo(v: string | undefined): string | null {
  if (v === 'yes') return 'Sí';
  if (v === 'no') return 'No';
  return null;
}

function ProfileSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-muted/15 p-4 shadow-sm dark:border-white/[0.07] dark:bg-muted/10">
      <header className="mb-4 flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/[0.12] text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
          aria-hidden
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-x-5 sm:gap-y-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{value}</div>
    </div>
  );
}

export function ClinicalProfileReadView({ clinicalProfile }: { clinicalProfile: unknown }) {
  const p = normalizeClinicalProfile(clinicalProfile);

  const s2 = p.step2;
  const s3 = p.step3;
  const s4 = p.step4;
  const s5 = p.step5;
  const s6 = p.step6;
  const s7 = p.step7;
  const s8 = p.step8;
  const s9 = p.step9;

  const block2 = (
    <>
      <Row label="Objetivo" value={str(s2?.goal)} />
      <Row label="Plazo o meta temporal" value={str(s2?.timeframe)} />
      <Row label="Dietas o intentos previos" value={str(s2?.pastDiets)} />
    </>
  );

  const block3 = (
    <>
      <Row label="Enfermedades diagnosticadas" value={str(s3?.conditions)} />
      <Row label="Problemas digestivos" value={str(s3?.digestive)} />
      <Row label="Alergias o intolerancias" value={str(s3?.allergies)} />
      <Row label="Embarazo o lactancia" value={str(s3?.pregnancyLactation)} />
      <Row label="Medicamentos o suplementos" value={str(s3?.medications)} />
    </>
  );

  const block4 = (
    <>
      <Row label="Comer por ansiedad, estrés o aburrimiento" value={str(s4?.emotionalEating)} />
      <Row label="Episodios de atracones" value={str(s4?.bingeEpisodes)} />
      <Row label="Relación con la comida" value={str(s4?.foodRelationship)} />
      <Row label="Culpa o restricción extrema" value={str(s4?.guiltOrRestriction)} />
    </>
  );

  const block5 = (
    <>
      <Row label="Comidas al día" value={str(s5?.mealsPerDay)} />
      <Row label="Horarios habituales" value={str(s5?.usualMealTimes)} />
      <Row label="Desayuno" value={str(s5?.breakfast)} />
      <Row label="Snacks" value={str(s5?.snacks)} />
      <Row label="Frecuencia de comer fuera" value={str(s5?.eatingOutFrequency)} />
      <Row label="Azúcar" value={str(s5?.sugar)} />
      <Row label="Alcohol" value={str(s5?.alcohol)} />
      <Row label="Refrescos o jugos" value={str(s5?.sodasJuices)} />
      <Row label="Agua diaria" value={str(s5?.waterDaily)} />
    </>
  );

  const block6 = (
    <>
      <Row label="Vigilia y sueño" value={str(s6?.wakeSleep)} />
      <Row label="Tipo de trabajo" value={workTypeLabel(s6?.workType)} />
      <Row label="Estrés habitual" value={stressLabel(s6?.stressLevel)} />
      <Row label="Calidad del sueño" value={str(s6?.sleepQuality)} />
    </>
  );

  const freq =
    s7?.frequencyPerWeek != null && Number.isFinite(s7.frequencyPerWeek)
      ? `${s7.frequencyPerWeek} días/semana`
      : null;
  const dur =
    s7?.durationMinutes != null && Number.isFinite(s7.durationMinutes) && s7.durationMinutes > 0
      ? `${s7.durationMinutes} min por sesión`
      : null;
  const exerciseBits = [str(s7?.exerciseType), freq, dur].filter(Boolean).join(' · ') || null;

  const block7 = (
    <>
      <Row label="Ejercicio habitual" value={yesNo(s7?.exercises)} />
      <Row label="Detalle" value={exerciseBits} />
    </>
  );

  const block8 = (
    <>
      <Row label="Alimentos que gustan" value={str(s8?.likes)} />
      <Row label="Alimentos que no gustan" value={str(s8?.dislikes)} />
      <Row label="Presupuesto aproximado" value={str(s8?.budget)} />
      <Row label="Acceso a cocina" value={str(s8?.kitchenAccess)} />
      <Row label="Cultura alimentaria" value={str(s8?.foodCulture)} />
    </>
  );

  const block9 = (
    <>
      <Row label="Frecuencia de evacuación" value={str(s9?.bowelFrequency)} />
      <Row label="Inflamación o hinchazón abdominal" value={str(s9?.bloating)} />
      <Row label="Reflujo o acidez" value={str(s9?.reflux)} />
      <Row label="Intolerancias percibidas" value={str(s9?.perceivedIntolerances)} />
    </>
  );

  const hasContent =
    Boolean(str(s2?.goal) || str(s2?.timeframe) || str(s2?.pastDiets)) ||
    Boolean(
      str(s3?.conditions) ||
        str(s3?.digestive) ||
        str(s3?.allergies) ||
        str(s3?.pregnancyLactation) ||
        str(s3?.medications),
    ) ||
    Boolean(
      str(s4?.emotionalEating) ||
        str(s4?.bingeEpisodes) ||
        str(s4?.foodRelationship) ||
        str(s4?.guiltOrRestriction),
    ) ||
    Boolean(
      str(s5?.mealsPerDay) ||
        str(s5?.usualMealTimes) ||
        str(s5?.breakfast) ||
        str(s5?.snacks) ||
        str(s5?.eatingOutFrequency) ||
        str(s5?.sugar) ||
        str(s5?.alcohol) ||
        str(s5?.sodasJuices) ||
        str(s5?.waterDaily),
    ) ||
    Boolean(
      str(s6?.wakeSleep) ||
        workTypeLabel(s6?.workType) ||
        stressLabel(s6?.stressLevel) ||
        str(s6?.sleepQuality),
    ) ||
    Boolean(yesNo(s7?.exercises) || exerciseBits) ||
    Boolean(
      str(s8?.likes) ||
        str(s8?.dislikes) ||
        str(s8?.budget) ||
        str(s8?.kitchenAccess) ||
        str(s8?.foodCulture),
    ) ||
    Boolean(str(s9?.bowelFrequency) || str(s9?.bloating) || str(s9?.reflux) || str(s9?.perceivedIntolerances));

  if (!hasContent) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 px-5 py-10 text-center dark:border-white/[0.08]">
        <p className="text-sm font-medium text-foreground">Perfil clínico sin datos</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Aún no hay respuestas del asistente. Usa <span className="font-medium text-foreground">Editar ficha completa</span>{' '}
          para registrar objetivo, hábitos y antecedentes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {str(s2?.goal) || str(s2?.timeframe) || str(s2?.pastDiets) ? (
        <ProfileSection
          icon={Target}
          title="Objetivo y contexto"
          description="Meta nutricional y plazo acordado con el paciente."
        >
          {block2}
        </ProfileSection>
      ) : null}

      {str(s3?.conditions) ||
      str(s3?.digestive) ||
      str(s3?.allergies) ||
      str(s3?.pregnancyLactation) ||
      str(s3?.medications) ? (
        <ProfileSection
          icon={Stethoscope}
          title="Historial clínico"
          description="Condiciones de salud y tratamientos relevantes."
        >
          {block3}
        </ProfileSection>
      ) : null}

      {str(s4?.emotionalEating) ||
      str(s4?.bingeEpisodes) ||
      str(s4?.foodRelationship) ||
      str(s4?.guiltOrRestriction) ? (
        <ProfileSection
          icon={Brain}
          title="Relación con la comida"
          description="Conducta alimentaria y aspectos emocionales."
        >
          {block4}
        </ProfileSection>
      ) : null}

      {str(s5?.mealsPerDay) ||
      str(s5?.usualMealTimes) ||
      str(s5?.breakfast) ||
      str(s5?.snacks) ||
      str(s5?.eatingOutFrequency) ||
      str(s5?.sugar) ||
      str(s5?.alcohol) ||
      str(s5?.sodasJuices) ||
      str(s5?.waterDaily) ? (
        <ProfileSection
          icon={Utensils}
          title="Hábitos alimenticios"
          description="Patrones de ingesta y líquidos habituales."
        >
          {block5}
        </ProfileSection>
      ) : null}

      {str(s6?.wakeSleep) || workTypeLabel(s6?.workType) || stressLabel(s6?.stressLevel) || str(s6?.sleepQuality) ? (
        <ProfileSection
          icon={Moon}
          title="Rutina diaria y descanso"
          description="Trabajo, sueño y nivel de estrés."
        >
          {block6}
        </ProfileSection>
      ) : null}

      {yesNo(s7?.exercises) || exerciseBits ? (
        <ProfileSection
          icon={Activity}
          title="Actividad física"
          description="Frecuencia y tipo de ejercicio declarado."
        >
          {block7}
        </ProfileSection>
      ) : null}

      {str(s8?.likes) || str(s8?.dislikes) || str(s8?.budget) || str(s8?.kitchenAccess) || str(s8?.foodCulture) ? (
        <ProfileSection
          icon={Apple}
          title="Preferencias y entorno"
          description="Gustos, presupuesto y contexto doméstico."
        >
          {block8}
        </ProfileSection>
      ) : null}

      {str(s9?.bowelFrequency) || str(s9?.bloating) || str(s9?.reflux) || str(s9?.perceivedIntolerances) ? (
        <ProfileSection
          icon={HeartPulse}
          title="Salud digestiva"
          description="Síntomas y evacuación."
        >
          {block9}
        </ProfileSection>
      ) : null}
    </div>
  );
}
