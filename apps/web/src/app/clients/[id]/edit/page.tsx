import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClientWizard, mapClientRowToForm } from '@/components/ClientWizard';
import { apiServerJson } from '@/lib/api-server';

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
      <div className="px-4 pt-4">
        <Link href={`/clients/${id}`} className="text-sm text-brand-700 underline">
          ← Ficha
        </Link>
      </div>
      <ClientWizard key={id} mode="edit" clientId={id} initialValues={initial} />
    </div>
  );
}
