'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import type { MealPlanReadModel } from '@nutrimax/shared';
import { normalizeDietPlan } from '@nutrimax/shared';
import { ClientDietReportDocument } from '@/components/clients/pdf/ClientDietReportDocument';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { apiJson } from '@/lib/api';
import type { ClientDietPdfContext } from '@/lib/pdf/client-diet-report-model';
import { showErrorToast, showSuccessToast } from '@/lib/errors';

type DietApiDetail = {
  id: string;
  name: string;
  description: string | null;
  plan: unknown;
  resolved_items: unknown[];
  estimated_kcal: number;
};

function slugFilePart(s: string): string {
  const t = s
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 48);
  return t.length > 0 ? t : 'paciente';
}

export function ClientDietPdfExportPanel({ pdfContext }: { pdfContext: ClientDietPdfContext }) {
  const assignments = pdfContext.assignments;
  const defaultAssignmentId = useMemo(() => {
    const active = assignments.find((a) => a.status.toLowerCase() === 'active');
    return active?.id ?? assignments[0]?.id ?? '';
  }, [assignments]);

  const [assignmentId, setAssignmentId] = useState(defaultAssignmentId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAssignmentId((prev) => {
      if (prev && assignments.some((a) => a.id === prev)) return prev;
      return defaultAssignmentId;
    });
  }, [assignments, defaultAssignmentId]);

  async function onExport() {
    const sel = assignments.find((a) => a.id === assignmentId);
    if (!sel) {
      showErrorToast('Selecciona una asignación.');
      return;
    }
    setLoading(true);
    try {
      const diet = await apiJson<DietApiDetail>(`/diets/${sel.diet_id}`);
      const plan = normalizeDietPlan(diet.plan);
      const generatedAtLabel = new Intl.DateTimeFormat('es', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date());

      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(
        <ClientDietReportDocument
          {...pdfContext}
          generatedAtLabel={generatedAtLabel}
          selectedAssignment={sel}
          dietDescription={diet.description}
          plan={plan}
          mealPlan={{
            id: diet.id,
            name: diet.name,
            description: diet.description,
            kcal_range_min: plan.targetKcal,
            kcal_range_max: plan.targetKcal,
            items: diet.resolved_items,
            estimated_kcal: diet.estimated_kcal,
          } as MealPlanReadModel}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_${slugFilePart(pdfContext.client.fullName)}_${slugFilePart(diet.name)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccessToast('Informe PDF descargado.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos generar el PDF.';
      showErrorToast(msg);
    } finally {
      setLoading(false);
    }
  }

  if (assignments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Asigna una dieta desde la biblioteca para generar un informe en PDF con el plan y el seguimiento del paciente.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        Asignación para el informe
        <Select
          value={assignmentId}
          onChange={(e) => setAssignmentId(e.target.value)}
          aria-label="Elegir asignación para exportar PDF"
        >
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.diet_name} · {a.status}
            </option>
          ))}
        </Select>
      </label>
      <p className="text-xs leading-relaxed text-muted-foreground">
        El PDF incluye datos de la ficha, objetivos, punto de partida, gráficos de seguimiento y el plan dietético con tomas
        y alimentos vinculados.
      </p>
      <Button type="button" variant="primary" className="w-full gap-2" loading={loading} onClick={() => void onExport()}>
        <FileDown className="h-4 w-4 shrink-0" aria-hidden />
        Descargar informe PDF
      </Button>
    </div>
  );
}
