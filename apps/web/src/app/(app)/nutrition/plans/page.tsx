import type { Metadata } from 'next';
import { NutritionHubClient } from '@/app/(app)/nutrition/NutritionHubClient';
import { CmsListPageHero } from '@/components/cms/CmsListPageHero';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';

export const metadata: Metadata = {
  title: 'Planes alimenticios',
  description:
    'Menús por tomas con rango energético; enlazables desde la biblioteca de dietas cuando son coherentes con las kcal objetivo.',
};

export default function NutritionMealPlansPage() {
  return (
    <div className="min-h-0">
      <CmsListPageHero
        eyebrow="Catálogo clínico"
        title="Planes alimenticios"
        description="Arma tomas con porciones de tu catálogo y un rango de kcal/día. Desde Dietas podrás vincular un plan cuando encaje con el plan nutricional."
        crumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Nutrición', href: '/nutrition' },
          { label: 'Plan alimenticio' },
        ]}
        info={
          <HelpInfoButton title="Planes alimenticios" label="planes alimenticios">
            <p>
              Los planes usan las <strong className="text-foreground">kcal por 100 g</strong> de cada alimento para estimar
              la energía del menú. Al guardar una dieta con plan vinculado, la app valida coherencia con el objetivo
              calórico.
            </p>
            <p className="text-xs">
              Las <strong className="text-foreground">categorías</strong> y <strong className="text-foreground">alimentos</strong>{' '}
              se gestionan en la vista general de <strong className="text-foreground">Nutrición</strong>.
            </p>
          </HelpInfoButton>
        }
      />
      <NutritionHubClient initialTab="plans" />
    </div>
  );
}
