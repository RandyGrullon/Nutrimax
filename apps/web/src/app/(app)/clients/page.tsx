import type { Metadata } from 'next';
import { ClientsAdmin } from '@/components/clients/ClientsAdmin';
import { CmsListPageHero } from '@/components/cms/CmsListPageHero';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';

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
        info={
          <HelpInfoButton title="Qué puedes hacer aquí" label="pacientes">
            <p>
              Este listado es la agenda de personas que atiendes. Usa la lupa para encontrar a alguien por nombre o
              correo.
            </p>
            <p>
              Pulsa el <strong className="text-foreground">nombre</strong> para abrir la ficha con datos clínicos,
              historial y dietas asignadas.
            </p>
            <p>
              <strong className="text-foreground">Nuevo paciente</strong> abre un asistente paso a paso (9 pantallas)
              para registrar todo sin olvidar campos.
            </p>
            <p className="text-xs">Eliminar un paciente pide confirmación; solo hazlo si ya no necesitas ese registro.</p>
          </HelpInfoButton>
        }
      />
      <ClientsAdmin embedded />
    </div>
  );
}
