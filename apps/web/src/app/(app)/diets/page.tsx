import type { Metadata } from 'next';
import { CmsListPageHero } from '@/components/cms/CmsListPageHero';
import { DietLibraryLoader } from './DietLibraryLoader';

export const metadata: Metadata = {
  title: 'Dietas',
  description:
    'Biblioteca de dietas NutriMax: crea planes reutilizables, edítalos en panel lateral, búscalos y elimínalos con validación de asignaciones.',
  openGraph: {
    title: 'Dietas | NutriMax',
    description: 'CMS de biblioteca nutricional y planes asignables a pacientes.',
  },
};

export default function DietsPage() {
  return (
    <div className="min-h-0">
      <CmsListPageHero
        eyebrow="Biblioteca nutricional"
        title="Dietas"
        description="Administra la biblioteca de planes: alta y edición en panel lateral, tabla con búsqueda y bajas seguras cuando no haya dependencias con pacientes."
        crumbs={[{ label: 'Inicio', href: '/' }, { label: 'Dietas' }]}
      />
      <DietLibraryLoader />
    </div>
  );
}
