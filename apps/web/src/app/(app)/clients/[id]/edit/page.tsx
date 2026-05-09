import { notFound } from 'next/navigation';
import { ClientWizard } from '@/components/ClientWizard';
import { mapClientRowToForm } from '@/lib/map-client-row-to-form';
import { ApiError } from '@/lib/server/auth';
import { getClientById } from '@/lib/server/clients-server';
import { Button } from '@/components/ui/Button';

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let row: Awaited<ReturnType<typeof getClientById>>;
  try {
    row = await getClientById(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const initial = mapClientRowToForm(row as unknown as Record<string, unknown>);

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
