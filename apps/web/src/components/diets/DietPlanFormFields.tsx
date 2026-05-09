'use client';

import type { DietPlan, DietPlanActivity, DietPlanGoal } from '@nutrimax/shared';
import {
  dietPlanActivityLabels,
  dietPlanActivityValues,
  dietPlanGoalLabels,
  dietPlanGoalValues,
} from '@nutrimax/shared';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

type DietPlanFormFieldsProps = {
  plan: DietPlan;
  onPatch: (patch: Partial<DietPlan>) => void;
};

function macroKcalPreview(plan: DietPlan): number {
  return Math.round(plan.proteinG * 4 + plan.carbsG * 4 + plan.fatG * 9);
}

export function DietPlanFormFields({ plan, onPatch }: DietPlanFormFieldsProps) {
  const kcalFromMacros = macroKcalPreview(plan);
  const delta = Math.abs(kcalFromMacros - plan.targetKcal);
  const tol = Math.max(100, plan.targetKcal * 0.14);
  const macroOk = delta <= tol;

  return (
    <div className="flex flex-col gap-6 border-t border-border pt-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">
          Objetivo
        </h3>
        <div className="mt-3 grid gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Objetivo principal *
            <Select
              value={plan.goal}
              onChange={(e) => onPatch({ goal: e.target.value as DietPlanGoal })}
            >
              {dietPlanGoalValues.map((g) => (
                <option key={g} value={g}>
                  {dietPlanGoalLabels[g]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Aclaración del objetivo (opcional)
            <Textarea
              rows={2}
              value={plan.goalNotes}
              onChange={(e) => onPatch({ goalNotes: e.target.value })}
              placeholder="Ej. pérdida gradual, preparación para intervención, etc."
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">
          Energía y macronutrientes
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Las gramos de P, CH y G deben cuadrar aproximadamente con las kcal objetivo (4·P + 4·CH + 9·G, tolerancia ±14%).
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground sm:col-span-2">
            Kcal objetivo / día *
            <Input
              type="number"
              min={1000}
              max={5500}
              step={50}
              value={plan.targetKcal}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onPatch({ targetKcal: Math.round(n) });
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Proteínas (g/día) *
            <Input
              type="number"
              min={20}
              max={350}
              step={1}
              value={plan.proteinG}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onPatch({ proteinG: n });
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Carbohidratos (g/día) *
            <Input
              type="number"
              min={30}
              max={700}
              step={1}
              value={plan.carbsG}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onPatch({ carbsG: n });
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground sm:col-span-2">
            Grasas (g/día) *
            <Input
              type="number"
              min={15}
              max={250}
              step={1}
              value={plan.fatG}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onPatch({ fatG: n });
              }}
            />
          </label>
        </div>
        <p
          className={`mt-2 text-xs tabular-nums ${macroOk ? 'text-muted-foreground' : 'font-medium text-amber-700 dark:text-amber-400'}`}
        >
          Suma desde macros: ~{kcalFromMacros} kcal
          {!macroOk ? ` · revisa valores (objetivo ${plan.targetKcal} kcal)` : null}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">
          Estructura e hidratación
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Comidas o tomas al día *
            <Input
              type="number"
              min={1}
              max={8}
              value={plan.mealsPerDay}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onPatch({ mealsPerDay: Math.round(n) });
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Duración estimada (semanas, opcional)
            <Input
              type="number"
              min={1}
              max={104}
              value={plan.durationWeeks ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onPatch({ durationWeeks: v === '' ? undefined : Math.round(Number(v)) });
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Agua (L/día, opcional)
            <Input
              type="number"
              min={0.5}
              max={8}
              step={0.1}
              value={plan.waterLitersPerDay ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onPatch({ waterLitersPerDay: v === '' ? undefined : Number(v) });
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Actividad física esperada (opcional)
            <Select
              value={plan.expectedActivity ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onPatch({ expectedActivity: v === '' ? undefined : (v as DietPlanActivity) });
              }}
            >
              <option value="">— No indicada</option>
              {dietPlanActivityValues.map((a) => (
                <option key={a} value={a}>
                  {dietPlanActivityLabels[a]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground sm:col-span-2">
            Distribución de comidas / horarios (opcional)
            <Textarea
              rows={3}
              value={plan.mealStructureNotes}
              onChange={(e) => onPatch({ mealStructureNotes: e.target.value })}
              placeholder="Ej. desayuno 8h, comida 14h, cena 20h; meriendas entre horas…"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">
          Orientación alimentaria
        </h3>
        <div className="mt-3 grid gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Alimentos a priorizar (opcional)
            <Textarea
              rows={3}
              value={plan.foodsToEmphasize}
              onChange={(e) => onPatch({ foodsToEmphasize: e.target.value })}
              placeholder="Verduras, legumbres, proteína magra…"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Alimentos a limitar (opcional)
            <Textarea
              rows={3}
              value={plan.foodsToLimit}
              onChange={(e) => onPatch({ foodsToLimit: e.target.value })}
              placeholder="Ultraprocesados, azúcares añadidos…"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Restricciones y alergias (opcional)
            <Textarea
              rows={2}
              value={plan.restrictionsAllergies}
              onChange={(e) => onPatch({ restrictionsAllergies: e.target.value })}
              placeholder="Sin gluten, lactosa, vegano, etc."
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">
          Instrucciones al paciente *
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Texto que el paciente puede seguir en el día a día (mín. 25 caracteres).
        </p>
        <label className="mt-2 flex flex-col gap-1.5 text-sm font-medium text-foreground">
          <Textarea
            rows={5}
            value={plan.patientInstructions}
            onChange={(e) => onPatch({ patientInstructions: e.target.value })}
            placeholder="Pauta clara: qué comer, cómo repartir, qué vigilar…"
            required
          />
        </label>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">
          Notas solo profesional (opcional)
        </h3>
        <label className="mt-2 flex flex-col gap-1.5 text-sm font-medium text-foreground">
          <Textarea
            rows={3}
            value={plan.professionalNotes}
            onChange={(e) => onPatch({ professionalNotes: e.target.value })}
            placeholder="Observaciones internas que no necesita ver el paciente."
          />
        </label>
      </div>
    </div>
  );
}
