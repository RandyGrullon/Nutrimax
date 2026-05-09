import type { Metadata } from 'next';
import { CmsListPageHero } from '@/components/cms/CmsListPageHero';
import { DietLibraryClient, type DietAdminRow } from '@/app/(app)/diets/DietLibraryClient';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import { listDiets } from '@/lib/server/diets-server';

export const metadata: Metadata = {
  title: 'Dietas',
  description:
    'Biblioteca de dietas NutriMax: crea planes reutilizables, edítalos en panel lateral, búscalos y elimínalos con validación de asignaciones.',
  openGraph: {
    title: 'Dietas | NutriMax',
    description: 'CMS de biblioteca nutricional y planes asignables a pacientes.',
  },
};

function toDietAdminRow(row: Awaited<ReturnType<typeof listDiets>>[number]): DietAdminRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export default async function DietsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const openEditDietId = edit?.trim() ? edit.trim() : null;
  const initialDiets = (await listDiets()).map(toDietAdminRow);

  return (
    <div className="min-h-0">
      <CmsListPageHero
        eyebrow="Biblioteca nutricional"
        title="Dietas"
        description="Administra la biblioteca de planes: alta y edición en panel lateral, tabla con búsqueda y bajas seguras cuando no haya dependencias con pacientes."
        crumbs={[{ label: 'Inicio', href: '/' }, { label: 'Dietas' }]}
        info={
          <HelpInfoButton title="Biblioteca de dietas" label="dietas">
            <p>
              Aquí defines <strong className="text-foreground">planes reutilizables</strong> (nombre y descripción).
              Luego, desde la ficha de cada paciente, puedes <strong className="text-foreground">asignar</strong> uno de
              estos planes.
            </p>
            <p>
              <strong className="text-foreground">Nueva dieta</strong> abre un panel a la derecha para crearla.{' '}
              <strong className="text-foreground">Editar</strong> cambia los datos; <strong className="text-foreground">Eliminar</strong>{' '}
              solo funciona si ese plan no está ligado a pacientes.
            </p>
            <p className="text-xs">La búsqueda filtra por nombre o texto en la descripción.</p>
          </HelpInfoButton>
        }
      />
      
      <DietLibraryClient openEditDietId={openEditDietId} initialDiets={initialDiets} />
    </div>
  );
}
