import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DietPlanReadView } from '@/components/diets/DietPlanReadView';
import { CmsBreadcrumb } from '@/components/cms/CmsBreadcrumb';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/server/auth';
import { getDietById } from '@/lib/server/diets-server';
import { normalizeDietPlan } from '@nutrimax/shared';

function formatUpdated(iso: string | Date | undefined): string | null {
  if (!iso) return null;
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const diet = await getDietById(id);
    return { title: `${diet.name} | NutriMax` };
  } catch {
    return { title: 'Dieta | NutriMax' };
  }
}

export default async function DietDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let diet: Awaited<ReturnType<typeof getDietById>>;
  try {
    diet = await getDietById(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const plan = normalizeDietPlan(diet.plan);
  const updatedLabel = formatUpdated(diet.updated_at);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <CmsBreadcrumb
        className="mb-6"
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Dietas', href: '/diets' },
          { label: diet.name },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button href="/diets" variant="secondary">
          Volver a la biblioteca
        </Button>
        <Button href={`/diets?edit=${encodeURIComponent(id)}`} variant="primary">
          Editar plan
        </Button>
      </div>

      <DietPlanReadView
        name={diet.name}
        description={diet.description}
        plan={plan}
        updatedAtLabel={updatedLabel}
        mealPlan={{
          id: diet.id,
          name: diet.name,
          description: diet.description,
          kcal_range_min: plan.targetKcal,
          kcal_range_max: plan.targetKcal,
          items: diet.resolved_items,
          estimated_kcal: diet.estimated_kcal,
        }}
      />
    </div>
  );
}
