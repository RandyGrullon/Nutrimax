'use client';

import {
  deriveAllMetrics,
  metricsInputFromClinicalAndAnthro,
  type CreateClientBody,
} from '@nutrimax/shared';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { MetricInfoButton } from '@/components/MetricInfoButton';

export function MetricsPanel({ control }: { control: Control<CreateClientBody> }) {
  const reduceMotion = useReducedMotion();
  const values = useWatch({ control }) as CreateClientBody | undefined;

  const metrics = useMemo(() => {
    const snap = values ?? ({} as CreateClientBody);
    const input = metricsInputFromClinicalAndAnthro({
      age: snap.age,
      sex: snap.sex,
      weightKg: snap.weight_kg,
      heightCm: snap.height_cm,
      bodyFatPct: snap.body_fat_pct,
      clinical_profile: snap.clinical_profile,
    });
    return deriveAllMetrics(input, snap.clinical_profile?.step2?.goal);
  }, [values]);

  const item = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm shadow-inner">
      <h3 className="mb-3 font-semibold text-emerald-900">Resumen calculado</h3>
      <motion.ul className="flex flex-col gap-3" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
        <motion.li variants={item} className="rounded-lg bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-800">IMC</span>
            <MetricInfoButton label="IMC" title="Índice de masa corporal">
              <p>
                El IMC relaciona peso y talla. Fórmula: peso (kg) ÷ estatura (m)². Es una referencia de
                población; si ya conoces tu IMC por otra báscula o informe, compáralo: pequeñas diferencias
                son habituales.
              </p>
              <p className="mt-2 font-medium">Rangos OMS (adultos)</p>
              <ul className="list-disc pl-4">
                <li>Bajo peso: &lt; 18,5</li>
                <li>Normal: 18,5 – 24,9</li>
                <li>Sobrepeso: 25 – 29,9</li>
                <li>Obesidad: ≥ 30</li>
              </ul>
            </MetricInfoButton>
          </div>
          <p className="mt-1 text-slate-700">
            {metrics.bmi != null ? (
              <>
                {metrics.bmi.toFixed(1)} — {metrics.bmiCategory?.replace(/_/g, ' ')}
              </>
            ) : (
              <span className="text-slate-500">Ingresa peso y estatura</span>
            )}
          </p>
        </motion.li>

        <motion.li variants={item} className="rounded-lg bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-800">% grasa (interpretación)</span>
            <MetricInfoButton label="grasa corporal" title="Porcentaje de grasa corporal">
              <p>
                Clasificación orientativa según sexo. No sustituye evaluación clínica ni el juicio del
                profesional.
              </p>
            </MetricInfoButton>
          </div>
          <p className="mt-1 text-slate-700">
            {metrics.bodyFatCategory && metrics.bodyFatCategory !== 'insuficientes_datos'
              ? metrics.bodyFatCategory.replace(/_/g, ' ')
              : 'Indica % grasa o informe de bioimpedancia'}
          </p>
        </motion.li>

        <motion.li variants={item} className="rounded-lg bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-800">Peso ideal sugerido</span>
            <MetricInfoButton label="peso ideal" title="Rango de peso sugerido">
              <p>
                Rango derivado de IMC 18,5–24,9 para tu estatura. La meta del paciente puede diferir; el
                criterio clínico prevalece.
              </p>
            </MetricInfoButton>
          </div>
          <p className="mt-1 text-slate-700">
            {metrics.idealWeightMinKg != null && metrics.idealWeightMaxKg != null ? (
              <>
                {metrics.idealWeightMinKg.toFixed(1)} – {metrics.idealWeightMaxKg.toFixed(1)} kg (punto medio{' '}
                {metrics.idealWeightSuggestedKg?.toFixed(1)} kg)
              </>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </p>
        </motion.li>

        <motion.li variants={item} className="rounded-lg bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-800">Energía (TMB / GET / objetivo)</span>
            <MetricInfoButton label="calorías" title="Tasa metabólica y calorías">
              <p>
                TMB: Mifflin–St Jeor. GET aproximada = TMB × factor de actividad (trabajo, ejercicio,
                estrés). Objetivo ajustado según meta (déficit/superávit). Valores orientativos.
              </p>
            </MetricInfoButton>
          </div>
          <p className="mt-1 text-slate-700">
            {metrics.bmrKcal != null ? (
              <>
                TMB {metrics.bmrKcal} kcal · GET ~{metrics.tdeeKcal} kcal · Objetivo ~{metrics.targetKcal}{' '}
                kcal
                {metrics.calorieFloorWarning ? ' (mínimo de seguridad aplicado)' : ''}
              </>
            ) : (
              <span className="text-slate-500">Completa edad y sexo para TMB/GET</span>
            )}
          </p>
        </motion.li>

        <motion.li variants={item} className="rounded-lg bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-800">Macronutrientes</span>
            <MetricInfoButton label="macros" title="Proteínas, carbohidratos y grasas">
              <p>Distribución porcentual sobre calorías objetivo; gramos calculados (4 kcal/g P/C, 9 kcal/g G).</p>
            </MetricInfoButton>
          </div>
          <p className="mt-1 text-slate-700">
            {metrics.proteinG != null ? (
              <>
                P {metrics.proteinG} g · CH {metrics.carbsG} g · G {metrics.fatG} g
              </>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </p>
        </motion.li>

        <motion.li variants={item} className="rounded-lg bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-800">Agua recomendada</span>
            <MetricInfoButton label="agua" title="Hidratación orientativa">
              <p>Regla práctica ~35 ml/kg, con límites mín/máx. Compara con lo declarado en hábitos.</p>
            </MetricInfoButton>
          </div>
          <p className="mt-1 text-slate-700">
            {metrics.waterRecommendedLiters != null ? <>~{metrics.waterRecommendedLiters} L/día</> : '—'}
          </p>
        </motion.li>
      </motion.ul>
      {metrics.messages?.length ? (
        <p className="mt-3 text-xs text-amber-800">{metrics.messages.join(' ')}</p>
      ) : null}
    </aside>
  );
}
