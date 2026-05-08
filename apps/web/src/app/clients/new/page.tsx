import Link from 'next/link';
import { ClientWizard } from '@/components/ClientWizard';

export default function NewClientPage() {
  return (
    <div>
      <div className="px-4 pt-4">
        <Link href="/clients" className="text-sm text-brand-700 underline">
          ← Pacientes
        </Link>
      </div>
      <ClientWizard mode="create" />
    </div>
  );
}
