/**
 * Fórmulas clínicas de referencia (v1 NutriMax).
 * IMC: peso_kg / estatura_m² (OMS).
 * TMB: Mifflin–St Jeor (1990).
 */

export type MetricsSex = 'female' | 'male' | 'other' | 'unknown';

export type PatientGoal = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health' | 'other';

export interface MetricsInput {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  sex?: MetricsSex;
  bodyFatPct?: number;
  /** Objetivo normalizado desde step2.goal (texto libre mapeado en UI/API) */
  goal?: PatientGoal;
  workType?: 'sedentary' | 'active';
  stressLevel?: 'low' | 'medium' | 'high';
  exercises?: 'yes' | 'no';
  frequencyPerWeek?: number;
  durationMinutes?: number;
  /** Litros declarados en hábitos (parsing opcional desde texto) */
  waterDeclaredLiters?: number;
}

export type BmiCategory = 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad' | 'obesidad_grave';

export type BodyFatCategory = 'bajo' | 'saludable' | 'elevado' | 'muy_elevado' | 'insuficientes_datos';

export interface DerivedMetricsResult {
  insufficientData: boolean;
  messages: string[];
  bmi?: number;
  bmiCategory?: BmiCategory;
  bodyFatCategory?: BodyFatCategory;
  idealWeightMinKg?: number;
  idealWeightMaxKg?: number;
  idealWeightSuggestedKg?: number;
  bmrKcal?: number;
  tdeeKcal?: number;
  targetKcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  proteinPct?: number;
  carbsPct?: number;
  fatPct?: number;
  waterRecommendedLiters?: number;
  calorieFloorWarning?: boolean;
}

function heightMeters(heightCm: number): number {
  return heightCm / 100;
}

export function computeBmi(weightKg: number, heightCm: number): number {
  const h = heightMeters(heightCm);
  if (h <= 0) return 0;
  return weightKg / (h * h);
}

export function bmiWhoCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'bajo_peso';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'sobrepeso';
  if (bmi < 40) return 'obesidad';
  return 'obesidad_grave';
}

/** Rango de peso para IMC 18.5–24.9 kg/m² a la estatura dada */
export function idealWeightRangeFromHeight(heightCm: number): { minKg: number; maxKg: number } {
  const h = heightMeters(heightCm);
  const minKg = 18.5 * h * h;
  const maxKg = 24.9 * h * h;
  return { minKg, maxKg };
}

/** Mifflin–St Jeor kcal/día */
export function computeBmrMifflinStJeor(weightKg: number, heightCm: number, age: number, sex: MetricsSex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'female') return base - 161;
  if (sex === 'male') return base + 5;
  return base - 78;
}

function activityFactor(input: MetricsInput): number {
  const work = input.workType === 'active' ? 1.2 : 0;
  const ex = input.exercises === 'yes';
  const freq = input.frequencyPerWeek ?? 0;
  let exerciseBonus = 0;
  if (ex) {
    if (freq >= 5) exerciseBonus = 0.35;
    else if (freq >= 3) exerciseBonus = 0.25;
    else if (freq >= 1) exerciseBonus = 0.15;
    else exerciseBonus = 0.1;
  }
  let pal = 1.2 + work * 0.15 + exerciseBonus;
  if (input.stressLevel === 'high') pal += 0.03;
  if (input.stressLevel === 'low') pal -= 0.02;
  return Math.min(Math.max(pal, 1.2), 1.9);
}

function mapGoalFromText(goalText?: string): PatientGoal {
  if (!goalText) return 'maintenance';
  const g = goalText.toLowerCase();
  if (g.includes('pérdida') || g.includes('perdida') || g.includes('bajar') || g.includes('adelgaz')) return 'weight_loss';
  if (g.includes('masa') || g.includes('músculo') || g.includes('musculo') || g.includes('ganar')) return 'muscle_gain';
  if (g.includes('manten')) return 'maintenance';
  if (g.includes('salud') || g.includes('hormon')) return 'health';
  return 'other';
}

/** Clasificación simplificada % grasa por sexo (adultos, referencia orientativa) */
export function classifyBodyFatPct(pct: number, sex: MetricsSex): BodyFatCategory {
  if (sex === 'female') {
    if (pct < 16) return 'bajo';
    if (pct <= 24) return 'saludable';
    if (pct <= 31) return 'elevado';
    return 'muy_elevado';
  }
  if (sex === 'male') {
    if (pct < 8) return 'bajo';
    if (pct <= 19) return 'saludable';
    if (pct <= 25) return 'elevado';
    return 'muy_elevado';
  }
  if (pct < 14) return 'bajo';
  if (pct <= 22) return 'saludable';
  if (pct <= 28) return 'elevado';
  return 'muy_elevado';
}

export function deriveAllMetrics(input: MetricsInput, goalText?: string): DerivedMetricsResult {
  const messages: string[] = [];
  const goal = input.goal ?? mapGoalFromText(goalText);

  if (input.weightKg == null || input.heightCm == null) {
    return {
      insufficientData: true,
      messages: ['Ingresa peso y estatura para calcular IMC y peso ideal sugerido.'],
    };
  }

  const bmi = computeBmi(input.weightKg, input.heightCm);
  const bmiCategory = bmiWhoCategory(bmi);
  const { minKg, maxKg } = idealWeightRangeFromHeight(input.heightCm);
  const idealSuggested = (minKg + maxKg) / 2;

  let bodyFatCategory: BodyFatCategory | undefined;
  if (input.bodyFatPct != null && input.sex) {
    bodyFatCategory = classifyBodyFatPct(input.bodyFatPct, input.sex);
  } else if (input.bodyFatPct != null) {
    bodyFatCategory = classifyBodyFatPct(input.bodyFatPct, 'other');
  } else {
    bodyFatCategory = 'insuficientes_datos';
  }

  if (input.age == null || !input.sex || input.sex === 'unknown') {
    messages.push('Para TMB/GET completos, indica edad y sexo biológico en el perfil.');
    return {
      insufficientData: false,
      messages,
      bmi,
      bmiCategory,
      bodyFatCategory,
      idealWeightMinKg: minKg,
      idealWeightMaxKg: maxKg,
      idealWeightSuggestedKg: idealSuggested,
    };
  }

  const bmr = computeBmrMifflinStJeor(input.weightKg, input.heightCm, input.age, input.sex);
  const pal = activityFactor(input);
  const tdee = bmr * pal;

  let target = tdee;
  if (goal === 'weight_loss') target = tdee - 400;
  if (goal === 'muscle_gain') target = tdee + 250;
  if (goal === 'maintenance' || goal === 'health' || goal === 'other') target = tdee;

  const minKcalFloor = input.sex === 'female' ? 1200 : 1500;
  let calorieFloorWarning = false;
  if (target < minKcalFloor) {
    calorieFloorWarning = true;
    target = minKcalFloor;
    messages.push('Calorías objetivo ajustadas a un mínimo de seguridad; revisar con criterio clínico.');
  }

  let pPct = 0.3;
  let cPct = 0.4;
  let fPct = 0.3;
  if (goal === 'weight_loss') {
    pPct = 0.35;
    cPct = 0.35;
    fPct = 0.3;
  } else if (goal === 'muscle_gain') {
    pPct = 0.35;
    cPct = 0.45;
    fPct = 0.2;
  }

  const proteinG = (target * pPct) / 4;
  const carbsG = (target * cPct) / 4;
  const fatG = (target * fPct) / 9;

  let waterL = (input.weightKg * 35) / 1000;
  if (input.exercises === 'yes') waterL += 0.25;
  waterL = Math.min(Math.max(waterL, 1.5), 4.5);

  return {
    insufficientData: false,
    messages,
    bmi,
    bmiCategory,
    bodyFatCategory,
    idealWeightMinKg: minKg,
    idealWeightMaxKg: maxKg,
    idealWeightSuggestedKg: idealSuggested,
    bmrKcal: Math.round(bmr),
    tdeeKcal: Math.round(tdee),
    targetKcal: Math.round(target),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
    proteinPct: Math.round(pPct * 100),
    carbsPct: Math.round(cPct * 100),
    fatPct: Math.round(fPct * 100),
    waterRecommendedLiters: Math.round(waterL * 10) / 10,
    calorieFloorWarning,
  };
}

export function metricsInputFromClinicalAndAnthro(params: {
  age?: number;
  sex?: MetricsSex;
  weightKg?: number;
  heightCm?: number;
  bodyFatPct?: number;
  clinical_profile?: {
    step2?: { goal?: string };
    step5?: { waterDaily?: string };
    step6?: {
      workType?: 'sedentary' | 'active';
      stressLevel?: 'low' | 'medium' | 'high';
    };
    step7?: {
      exercises?: 'yes' | 'no';
      frequencyPerWeek?: number;
      durationMinutes?: number;
    };
  };
}): MetricsInput {
  const waterText = params.clinical_profile?.step5?.waterDaily;
  let waterDeclared: number | undefined;
  if (waterText) {
    const m = waterText.match(/(\d+([.,]\d+)?)/);
    if (m) waterDeclared = parseFloat(m[1].replace(',', '.'));
  }
  return {
    weightKg: params.weightKg,
    heightCm: params.heightCm,
    age: params.age,
    sex: params.sex,
    bodyFatPct: params.bodyFatPct,
    goal: mapGoalFromText(params.clinical_profile?.step2?.goal),
    workType: params.clinical_profile?.step6?.workType,
    stressLevel: params.clinical_profile?.step6?.stressLevel,
    exercises: params.clinical_profile?.step7?.exercises,
    frequencyPerWeek: params.clinical_profile?.step7?.frequencyPerWeek,
    durationMinutes: params.clinical_profile?.step7?.durationMinutes,
    waterDeclaredLiters: waterDeclared,
  };
}
