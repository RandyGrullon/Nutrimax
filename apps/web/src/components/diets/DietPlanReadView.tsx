import type { ReactNode } from 'react';
import type { DietPlan, MealPlanReadModel } from '@nutrimax/shared';
import { dietPlanActivityLabels, dietPlanGoalLabels } from '@nutrimax/shared';

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-muted/10 p-4 dark:border-white/[0.07]">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">{title}</h3>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-x-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap leading-relaxed text-foreground">{value}</div>
    </div>
  );
}

export function DietPlanReadView({
  name,
  description,
  plan,
  updatedAtLabel,
  mealPlan,
}: {
  name: string;
  description: string | null;
  plan: DietPlan;
  updatedAtLabel?: string | null;
  mealPlan?: MealPlanReadModel | null;
}) {
  const macroKcal = Math.round(plan.proteinG * 4 + plan.carbsG * 4 + plan.fatG * 9);

  return (
    <div className="flex flex-col gap-5">
      <header className="rounded-xl border border-border/70 bg-card p-4 shadow-sm dark:border-white/[0.07]">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{name}</h1>
        {updatedAtLabel ? (
          <p className="mt-1 text-xs text-muted-foreground">Actualizado: {updatedAtLabel}</p>
        ) : null}
        {description ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <Section title="Objetivo">
        <Row label="Principal" value={dietPlanGoalLabels[plan.goal]} />
        <Row label="Aclaración" value={plan.goalNotes || null} />
      </Section>

      {mealPlan ? (
        <Section title="Distribución de alimentos">
          <Row label="Energía estimada (porciones)" value={`~${mealPlan.estimated_kcal} kcal/día`} />
          {mealPlan.description ? (
            <Row label="Descripción" value={mealPlan.description} />
          ) : null}
          {mealPlan.items.length > 0 ? (
            <div className="mt-2 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 dark:border-white/[0.06]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Distribución por tomas
              </p>
              <ul className="space-y-2 text-sm">
                {mealPlan.items.map((it, idx) => (
                  <li key={`${it.order}-${idx}`} className="leading-relaxed text-foreground">
                    <span className="font-medium">{it.meal}</span>
                    {' · '}
                    {it.food ? (
                      <>
                        {it.food.name} ({it.portion_grams} g) · ~
                        {Math.round((it.food.kcal_per_100g * it.portion_grams) / 100)} kcal
                      </>
                    ) : (
                      <>Alimento no disponible ({it.portion_grams} g)</>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Este plan no tiene ítems por tomas registrados todavía.</p>
          )}
        </Section>
      ) : null}

      <Section title="Energía y macronutrientes">
        <Row label="Kcal / día" value={plan.targetKcal} />
        <Row label="Proteínas (g)" value={plan.proteinG} />
        <Row label="Carbohidratos (g)" value={plan.carbsG} />
        <Row label="Grasas (g)" value={plan.fatG} />
        <Row label="Suma desde macros" value={`~${macroKcal} kcal (4·P + 4·CH + 9·G)`} />
      </Section>

      <Section title="Estructura e hidratación">
        <Row label="Tomas / día" value={plan.mealsPerDay} />
        <Row label="Duración (semanas)" value={plan.durationWeeks ?? null} />
        <Row label="Agua (L/día)" value={plan.waterLitersPerDay ?? null} />
        <Row
          label="Actividad esperada"
          value={plan.expectedActivity ? dietPlanActivityLabels[plan.expectedActivity] : null}
        />
        <Row label="Distribución / horarios" value={plan.mealStructureNotes || null} />
      </Section>

      <Section title="Orientación alimentaria">
        <Row label="Priorizar" value={plan.foodsToEmphasize || null} />
        <Row label="Limitar" value={plan.foodsToLimit || null} />
        <Row label="Restricciones / alergias" value={plan.restrictionsAllergies || null} />
      </Section>

      <Section title="Instrucciones al paciente">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{plan.patientInstructions}</p>
      </Section>

      {plan.professionalNotes ? (
        <Section title="Notas profesionales">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{plan.professionalNotes}</p>
        </Section>
      ) : null}
    </div>
  );
}
