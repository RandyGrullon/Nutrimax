import { ClientWizard } from '@/components/ClientWizard';
import { Button } from '@/components/ui/Button';

export default function NewClientPage() {
  return (
    <div>
      <div className="border-b border-border px-4 py-3">
        <Button href="/clients" variant="ghost" className="px-0 text-sm text-brand-700 dark:text-brand-400">
          ← Pacientes
        </Button>
      </div>
      <ClientWizard mode="create" />
    </div>
  );
}
