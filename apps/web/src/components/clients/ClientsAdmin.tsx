'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Pencil, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/cms/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/cn';

export type ClientAdminRow = {
  id: string;
  full_name: string;
  email: string | null;
  updated_at: string;
};

function formatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type ClientsAdminProps = {
  /** Oculta el bloque de título duplicado cuando la página ya muestra `CmsListPageHero`. */
  embedded?: boolean;
};

export function ClientsAdmin({ embedded = false }: ClientsAdminProps) {
  const [rows, setRows] = useState<ClientAdminRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ClientAdminRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/clients');
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        setRows([]);
        return;
      }
      const data = (await res.json()) as ClientAdminRow[];
      setRows(data);
    } catch {
      showErrorToast('No pudimos cargar la lista de pacientes.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        (r.email?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, query]);

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/clients/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Paciente eliminado.');
      setDeleteTarget(null);
      await load();
    } catch {
      showErrorToast('No pudimos eliminar el paciente.');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={cn('mx-auto max-w-6xl px-4', embedded ? 'pb-10 pt-6' : 'py-8')}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {!embedded ? (
            <div>
              <Skeleton className="mb-2 h-4 w-48" />
              <Skeleton className="h-9 w-64" />
            </div>
          ) : (
            <Skeleton className="h-10 max-w-xs flex-1" />
          )}
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  const list = rows ?? [];

  return (
    <div className={cn('mx-auto max-w-6xl px-4', embedded ? 'pb-10 pt-6' : 'py-8')}>
      <header
        className={cn(
          'mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between',
          embedded && 'lg:gap-6',
        )}
      >
        {!embedded ? (
          <div className="lg:max-w-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400">
              Contenido
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Pacientes</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vista tipo CMS: busca, abre la ficha, edita con el asistente o elimina registros que ya no necesites.
            </p>
          </div>
        ) : null}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto lg:w-auto lg:flex-1 lg:justify-end">
          <div className="relative min-w-[200px] flex-1 lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar pacientes"
            />
          </div>
          <Button href="/clients/new" variant="primary" className="shrink-0 gap-2">
            <UserPlus className="h-4 w-4" aria-hidden />
            Nuevo paciente
          </Button>
        </div>
      </header>

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin pacientes"
          description="Crea el primer registro con el asistente guiado. Los datos quedan en tu base Postgres."
          action={
            <Button href="/clients/new" variant="primary" className="gap-2">
              <UserPlus className="h-4 w-4" aria-hidden />
              Nuevo paciente
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card dark:shadow-card-dark">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">
              {filtered.length} de {list.length} registros
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
              Acciones por fila
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Actualizado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/80 transition last:border-0 hover:bg-muted/15"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/clients/${row.id}`}
                        className="font-medium text-foreground underline-offset-2 hover:text-brand-700 hover:underline dark:hover:text-brand-400"
                      >
                        {row.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email ?? '—'}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell tabular-nums">
                      {formatUpdated(row.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button href={`/clients/${row.id}`} variant="ghost" className="h-8 px-2 text-xs">
                          Ver
                        </Button>
                        <Button href={`/clients/${row.id}/edit`} variant="secondary" className="h-8 gap-1 px-2 text-xs">
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Editar
                        </Button>
                        <button
                          type="button"
                          className={cn(
                            'inline-flex h-8 items-center gap-1 rounded-lg border border-transparent px-2 text-xs font-medium text-destructive transition hover:bg-destructive/10',
                          )}
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && query.trim() ? (
            <p className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No hay resultados para «{query.trim()}».
            </p>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar paciente"
        description={
          deleteTarget
            ? `Se eliminará «${deleteTarget.full_name}» y todo su historial, revisiones y asignaciones asociadas. Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
