import {
  Circle,
  Document,
  Line,
  Page,
  Polyline,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import type { DietPlan, MealPlanReadModel } from '@nutrimax/shared';
import { dietPlanActivityLabels, dietPlanGoalLabels } from '@nutrimax/shared';
import type { AssignmentOptionPdf, ClientDietPdfContext } from '@/lib/pdf/client-diet-report-model';
import {
  lineChartGeometry,
  progressBmiSeries,
  progressFatSeries,
  progressWaistSeries,
  progressWeightSeries,
  type SeriesPoint,
} from '@/lib/pdf/progress-series';

export type ClientDietReportPdfProps = ClientDietPdfContext & {
  generatedAtLabel: string;
  selectedAssignment: AssignmentOptionPdf;
  dietDescription: string | null;
  plan: DietPlan;
  mealPlan: MealPlanReadModel | null;
};

const palette = {
  primary: '#0f766e',
  primaryDark: '#115e59',
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  band: '#f0fdfa',
  chartAxis: '#cbd5e1',
  chartLine: '#0d9488',
  chartLine2: '#7c3aed',
  chartLine3: '#ea580c',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 42,
    paddingBottom: 48,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: palette.ink,
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 42,
    right: 42,
    fontSize: 7,
    color: palette.muted,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 6,
    textAlign: 'center',
  },
  hero: {
    backgroundColor: palette.primary,
    marginHorizontal: -42,
    marginTop: -36,
    paddingHorizontal: 42,
    paddingVertical: 22,
    marginBottom: 18,
  },
  heroKicker: {
    fontSize: 8,
    color: '#99f6e4',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 10,
    color: '#ccfbf1',
    maxWidth: 420,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 8,
    color: '#ecfeff',
  },
  card: {
    backgroundColor: palette.band,
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  cardDark: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: palette.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 8,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  rowLabel: {
    width: '30%',
    fontSize: 8,
    color: palette.muted,
    fontFamily: 'Helvetica-Bold',
  },
  rowValue: {
    width: '70%',
    fontSize: 9,
    color: palette.ink,
  },
  chartBox: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  chartTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: palette.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  chartCaption: {
    fontSize: 7,
    color: palette.muted,
    marginTop: 4,
  },
  mealItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  mealItemLast: {
    borderBottomWidth: 0,
  },
  mealName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: palette.ink,
  },
  mealDetail: {
    fontSize: 8,
    color: palette.muted,
    marginTop: 2,
  },
  blockText: {
    fontSize: 9,
    color: palette.ink,
    marginTop: 4,
  },
  chartCol: {
    width: '48%',
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

function assignmentStatusLabel(s: string): string {
  const x = s.toLowerCase();
  if (x === 'active') return 'Activa';
  if (x === 'archived') return 'Archivada';
  return s;
}

function PdfRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

function MiniLineChart({
  title,
  unit,
  points,
  stroke,
}: {
  title: string;
  unit: string;
  points: SeriesPoint[];
  stroke: string;
}) {
  const w = 240;
  const h = 100;
  const pad = 22;
  const geom = lineChartGeometry(points, w, h, pad);

  if (points.length === 0) {
    return (
      <View style={styles.chartBox}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={{ fontSize: 8, color: palette.muted }}>Sin datos para {title.toLowerCase()}.</Text>
      </View>
    );
  }

  if (points.length === 1) {
    return (
      <View style={styles.chartBox}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={{ fontSize: 9 }}>
          Un solo registro: {points[0].y.toFixed(1)} {unit}
        </Text>
        <Text style={styles.chartCaption}>Añade otro seguimiento para ver la tendencia.</Text>
      </View>
    );
  }

  if (!geom) return null;

  return (
    <View style={styles.chartBox}>
      <Text style={styles.chartTitle}>
        {title} ({unit})
      </Text>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Line
          x1={pad}
          y1={geom.baselineY}
          x2={w - pad}
          y2={geom.baselineY}
          stroke={palette.chartAxis}
          strokeWidth={1}
        />
        <Polyline points={geom.polylinePoints} stroke={stroke} strokeWidth={2} fill="none" />
        {geom.dots.map((d, i) => (
          <Circle key={`d-${i}`} cx={d.cx} cy={d.cy} r={3} fill={stroke} />
        ))}
      </Svg>
      <Text style={styles.chartCaption}>
        Eje: periodo de registro · {points[0]?.x} → {points[points.length - 1]?.x} · rango {geom.minV.toFixed(1)}–
        {geom.maxV.toFixed(1)} {unit}
      </Text>
    </View>
  );
}

export function ClientDietReportDocument(props: ClientDietReportPdfProps) {
  const {
    generatedAtLabel,
    client,
    clinicalGoal,
    baseline,
    heightCm,
    progressSnapshots,
    selectedAssignment,
    dietDescription,
    plan,
    mealPlan,
  } = props;

  const macroKcal = Math.round(plan.proteinG * 4 + plan.carbsG * 4 + plan.fatG * 9);
  const weightSeries = progressWeightSeries(progressSnapshots);
  const waistSeries = progressWaistSeries(progressSnapshots);
  const bmiSeries = progressBmiSeries(progressSnapshots, heightCm);
  const fatSeries = progressFatSeries(progressSnapshots);

  const weightSummary =
    weightSeries.length >= 2
      ? {
          first: weightSeries[0].y,
          last: weightSeries[weightSeries.length - 1].y,
          delta: weightSeries[weightSeries.length - 1].y - weightSeries[0].y,
        }
      : null;

  const dietName = selectedAssignment.diet_name;

  return (
    <Document title={`Informe — ${client.fullName} — ${dietName}`} author="NutriMax" language="es">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>Informe nutricional</Text>
          <Text style={styles.heroTitle}>{client.fullName}</Text>
          <Text style={styles.heroSub}>
            Plan asignado: {dietName}
            {selectedAssignment.meal_plan_name ? ` · ${selectedAssignment.meal_plan_name}` : ''}
          </Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Asignación: {assignmentStatusLabel(selectedAssignment.status)}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Generado: {generatedAtLabel}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Datos del paciente</Text>
        <View style={styles.cardDark}>
          <PdfRow label="Nombre" value={client.fullName} />
          <PdfRow label="Email" value={client.email} />
          <PdfRow label="Teléfono" value={client.phone} />
          <PdfRow label="Edad" value={client.age != null ? String(client.age) : null} />
          <PdfRow label="Sexo" value={client.sex} />
          <PdfRow
            label="Inicio asignación"
            value={selectedAssignment.starts_on ? selectedAssignment.starts_on.slice(0, 10) : null}
          />
          <PdfRow label="Notas de asignación" value={selectedAssignment.notes} />
        </View>

        <Text style={styles.sectionTitle}>Meta y motivación</Text>
        <View style={styles.card}>
          <PdfRow label="Objetivo (perfil)" value={clinicalGoal.objective} />
          <PdfRow label="Plazo / meta temporal" value={clinicalGoal.timeframe} />
          <PdfRow label="Objetivo del plan dietético" value={dietPlanGoalLabels[plan.goal]} />
          <PdfRow label="Aclaración objetivo" value={plan.goalNotes || null} />
          <PdfRow label="Peso meta (ficha)" value={baseline.goalWeightKg} />
          <PdfRow label="Kcal orientativas (derivadas)" value={baseline.targetKcal} />
        </View>

        <Text style={styles.sectionTitle}>Punto de partida (ficha actual)</Text>
        <View style={styles.cardDark}>
          <PdfRow label="Peso" value={baseline.weightKg ? `${baseline.weightKg} kg` : null} />
          <PdfRow label="Talla" value={baseline.heightCm ? `${baseline.heightCm} cm` : null} />
          <PdfRow label="Cintura" value={baseline.waistCm ? `${baseline.waistCm} cm` : null} />
          <PdfRow label="% grasa" value={baseline.bodyFatPct != null ? `${baseline.bodyFatPct} %` : null} />
          <PdfRow label="IMC (derivado)" value={baseline.bmi != null ? `${baseline.bmi} kg/m²` : null} />
        </View>

        {dietDescription ? (
          <>
            <Text style={styles.sectionTitle}>Descripción del plan</Text>
            <Text style={styles.blockText}>{dietDescription}</Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Evolución hasta la fecha</Text>
        {progressSnapshots.length === 0 ? (
          <Text style={{ fontSize: 9, color: palette.muted, marginBottom: 8 }}>
            Aún no hay registros de seguimiento. Los gráficos se completarán al registrar peso, cintura o % grasa desde
            Estadísticas.
          </Text>
        ) : (
          <>
            <PdfRow label="Registros de seguimiento" value={String(progressSnapshots.length)} />
            {weightSummary ? (
              <View style={[styles.card, { marginTop: 8 }]}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: palette.primaryDark, marginBottom: 4 }}>
                  Resumen peso
                </Text>
                <PdfRow label="Primer registro" value={`${weightSummary.first.toFixed(1)} kg`} />
                <PdfRow label="Último registro" value={`${weightSummary.last.toFixed(1)} kg`} />
                <PdfRow
                  label="Variación"
                  value={`${weightSummary.delta > 0 ? '+' : ''}${weightSummary.delta.toFixed(1)} kg`}
                />
              </View>
            ) : null}
            <View style={styles.chartRow}>
              <View style={styles.chartCol}>
                <MiniLineChart title="Peso" unit="kg" points={weightSeries} stroke={palette.chartLine} />
                <MiniLineChart title="Cintura" unit="cm" points={waistSeries} stroke={palette.chartLine2} />
              </View>
              <View style={styles.chartCol}>
                <MiniLineChart title="IMC estimado" unit="kg/m²" points={bmiSeries} stroke="#0e7490" />
                <MiniLineChart title="% grasa" unit="%" points={fatSeries} stroke={palette.chartLine3} />
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Energía y macronutrientes</Text>
        <View style={styles.cardDark}>
          <PdfRow label="Kcal / día" value={String(plan.targetKcal)} />
          <PdfRow label="Proteínas" value={`${plan.proteinG} g`} />
          <PdfRow label="Carbohidratos" value={`${plan.carbsG} g`} />
          <PdfRow label="Grasas" value={`${plan.fatG} g`} />
          <PdfRow label="Suma desde macros" value={`~${macroKcal} kcal`} />
        </View>

        <Text style={styles.sectionTitle}>Estructura e hidratación</Text>
        <View style={styles.card}>
          <PdfRow label="Tomas / día" value={String(plan.mealsPerDay)} />
          <PdfRow label="Duración (semanas)" value={plan.durationWeeks != null ? String(plan.durationWeeks) : null} />
          <PdfRow label="Agua (L/día)" value={plan.waterLitersPerDay != null ? String(plan.waterLitersPerDay) : null} />
          <PdfRow
            label="Actividad esperada"
            value={plan.expectedActivity ? dietPlanActivityLabels[plan.expectedActivity] : null}
          />
          <PdfRow label="Distribución / horarios" value={plan.mealStructureNotes || null} />
        </View>

        <Text style={styles.sectionTitle}>Orientación alimentaria</Text>
        <View style={styles.cardDark}>
          <PdfRow label="Priorizar" value={plan.foodsToEmphasize || null} />
          <PdfRow label="Limitar" value={plan.foodsToLimit || null} />
          <PdfRow label="Restricciones / alergias" value={plan.restrictionsAllergies || null} />
        </View>

        <Text style={styles.sectionTitle}>Instrucciones al paciente</Text>
        <View style={styles.card}>
          <Text style={styles.blockText}>{plan.patientInstructions}</Text>
        </View>

        {mealPlan ? (
          <>
            <Text style={styles.sectionTitle}>Plan alimenticio (tomas y alimentos)</Text>
            <View style={styles.cardDark}>
              <PdfRow label="Nombre" value={mealPlan.name} />
              <PdfRow label="Rango energía" value={`${mealPlan.kcal_range_min}–${mealPlan.kcal_range_max} kcal/día`} />
              <PdfRow label="Energía estimada" value={`~${mealPlan.estimated_kcal} kcal/día`} />
              {mealPlan.description ? <PdfRow label="Descripción" value={mealPlan.description} /> : null}
            </View>
            {mealPlan.items.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {mealPlan.items.map((it, idx) => {
                  const kcal =
                    it.food != null ? Math.round((it.food.kcal_per_100g * it.portion_grams) / 100) : null;
                  const foodLine =
                    it.food != null
                      ? `${it.food.name} · ${it.portion_grams} g${kcal != null ? ` · ~${kcal} kcal` : ''}`
                      : `Alimento no disponible · ${it.portion_grams} g`;
                  const isLast = idx === mealPlan.items.length - 1;
                  return (
                    <View key={`${it.order}-${idx}`} style={isLast ? [styles.mealItem, styles.mealItemLast] : styles.mealItem}>
                      <Text style={styles.mealName}>{it.meal}</Text>
                      <Text style={styles.mealDetail}>{foodLine}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ fontSize: 9, color: palette.muted }}>Este plan no tiene ítems por tomas registrados.</Text>
            )}
          </>
        ) : null}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `NutriMax · Documento confidencial · ${generatedAtLabel} · Página ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
