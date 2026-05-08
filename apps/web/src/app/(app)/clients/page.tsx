import type { Metadata } from 'next';
import { ClientsAdmin } from '@/components/clients/ClientsAdmin';
import { CmsListPageHero } from '@/components/cms/CmsListPageHero';

export const metadata: Metadata = {
  title: 'Pacientes',
  description:
    'Administración de pacientes NutriMax: listado con búsqueda, ficha clínica, asistente de registro en 9 pasos y bajas controladas.',
  openGraph: {
    title: 'Pacientes | NutriMax',
    description: 'Panel CMS para gestionar pacientes y acceder a fichas.',
  },
};

export default function ClientsPage() {
  return (
    <div className="min-h-0">
      <CmsListPageHero
        eyebrow="Gestión clínica"
        title="Pacientes"
        description="Controla el directorio de pacientes desde un listado tipo CMS: filtra por nombre o email, abre la ficha, edita con el asistente guiado o elimina registros con confirmación."
        crumbs={[{ label: 'Inicio', href: '/' }, { label: 'Pacientes' }]}
      />
      <ClientsAdmin embedded />
    </div>
  );
}
