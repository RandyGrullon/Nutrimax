import type { Metadata } from 'next';
import { CmsListPageHero } from '@/components/cms/CmsListPageHero';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import { NutritionHubClient } from '@/app/(app)/nutrition/NutritionHubClient';

export const metadata: Metadata = {
  title: 'Nutrición',
  description:
    'Categorías de alimentos, alimentos con kcal referenciales y planes alimenticios enlazables a dietas NutriMax.',
};

export default function NutritionPage() {
  return (
    <div className="min-h-0">
      <CmsListPageHero
        eyebrow="Catálogo clínico"
        title="Nutrición"
        description="Administra categorías, alimentos y planes alimenticios por tomas. Los planes se validan contra las kcal objetivo de cada dieta al enlazarlos en la biblioteca."
        crumbs={[{ label: 'Inicio', href: '/' }, { label: 'Nutrición' }]}
        info={
          <HelpInfoButton title="Nutrición" label="nutrición">
            <p>
              Usa <strong className="text-foreground">Categorías</strong> para ordenar el catálogo,{' '}
              <strong className="text-foreground">Alimentos</strong> para registrar kcal por 100 g y{' '}
              <strong className="text-foreground">Planes</strong> para armar menús por porciones con un rango energético.
            </p>
            <p className="text-xs">
              Desde <strong className="text-foreground">Dietas</strong> podrás enlazar un plan si encaja con las kcal del
              plan nutricional y las porciones no superan el objetivo (revisa el mensaje al guardar).
            </p>
          </HelpInfoButton>
        }
      />
      <NutritionHubClient />
    </div>
  );
}
