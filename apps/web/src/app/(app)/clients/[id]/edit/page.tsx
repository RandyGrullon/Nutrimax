import { notFound } from 'next/navigation';
import { ClientWizard, mapClientRowToForm } from '@/components/ClientWizard';
import { apiServerJson } from '@/lib/api-server';
import { Button } from '@/components/ui/Button';

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let row: Record<string, unknown>;
  try {
    row = await apiServerJson<Record<string, unknown>>(`/clients/${id}`);
  } catch {
    notFound();
  }
  const initial = mapClientRowToForm(row);

  return (
    <div>
      <div className="border-b border-border px-4 py-3">
        <Button href={`/clients/${id}`} variant="ghost" className="px-0 text-sm text-brand-700 dark:text-brand-400">
          ← Ficha
        </Button>
      </div>
      <ClientWizard key={id} mode="edit" clientId={id} initialValues={initial} />
    </div>
  );
}
