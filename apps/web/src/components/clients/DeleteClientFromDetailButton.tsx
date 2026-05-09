'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/cms/ConfirmDialog';
import { apiFetch } from '@/lib/api';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';

export function DeleteClientFromDetailButton({
  clientId,
  fullName,
}: {
  clientId: string;
  fullName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onConfirm() {
    setLoading(true);
    try {
      const res = await apiFetch(`/clients/${clientId}`, { method: 'DELETE' });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Paciente eliminado.');
      setOpen(false);
      router.push('/clients');
      router.refresh();
    } catch {
      showErrorToast('No pudimos eliminar el paciente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        className="gap-2"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        Eliminar paciente
      </Button>
      <ConfirmDialog
        open={open}
        title="Eliminar paciente"
        description={`Se eliminará «${fullName}» y todo su historial, revisiones y asignaciones asociadas. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={loading}
        onCancel={() => !loading && setOpen(false)}
        onConfirm={onConfirm}
      />
    </>
  );
}
