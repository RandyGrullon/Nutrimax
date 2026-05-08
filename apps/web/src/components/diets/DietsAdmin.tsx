'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  PanelRightClose,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/cms/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch, apiJson } from '@/lib/api';
import { cn } from '@/lib/cn';

type DietAdminRow = {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
};

function formatUpdated(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return '—';
  }
}

type PanelMode = 'closed' | 'create' | 'edit';

type DietsAdminProps = {
  embedded?: boolean;
};

export function DietsAdmin({ embedded = false }: DietsAdminProps) {
  const [rows, setRows] = useState<DietAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<PanelMode>('closed');
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DietAdminRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<DietAdminRow[]>('/diets');
      setRows(data);
    } catch {
      showErrorToast('No pudimos cargar las dietas.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, query]);

  function openCreate() {
    setEditId(null);
    setName('');
    setDescription('');
    setPanel('create');
  }

  async function openEdit(row: DietAdminRow) {
    setEditId(row.id);
    setName(row.name);
    setDescription(row.description ?? '');
    setPanel('edit');
    try {
      const res = await apiFetch(`/diets/${row.id}`);
      if (!res.ok) return;
      const full = (await res.json()) as { name: string; description: string | null };
      setName(full.name);
      setDescription(full.description ?? '');
    } catch {
      /* keep row snapshot */
    }
  }

  /** Cierra el panel ignorando `saving` (p. ej. tras guardar correctamente). */
  function resetPanel() {
    setPanel('closed');
    setEditId(null);
  }

  function closePanel() {
    if (saving) return;
    resetPanel();
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      showErrorToast('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      if (panel === 'create') {
        const res = await apiFetch('/diets', {
          method: 'POST',
          body: JSON.stringify({
            name: n,
            description: description.trim() || null,
            plan: {},
          }),
        });
        if (!res.ok) {
          showErrorToast(await parseApiError(res));
          return;
        }
        showSuccessToast('Dieta creada.');
      } else if (panel === 'edit' && editId) {
        const res = await apiFetch(`/diets/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: n,
            description: description.trim() || null,
          }),
        });
        if (!res.ok) {
          showErrorToast(await parseApiError(res));
          return;
        }
        showSuccessToast('Dieta actualizada.');
      }
      resetPanel();
      await load();
    } catch {
      showErrorToast('No pudimos guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/diets/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Dieta eliminada.');
      setDeleteTarget(null);
      if (editId === deleteTarget.id) resetPanel();
      await load();
    } catch {
      showErrorToast('No pudimos eliminar la dieta.');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={cn('relative mx-auto max-w-6xl px-4', embedded ? 'pb-10 pt-6' : 'py-8')}>
        <div className="mb-6 h-20 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className={cn('relative mx-auto max-w-6xl px-4', embedded ? 'pb-10 pt-6' : 'py-8')}>
      <header
        className={cn(
          'mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between',
          embedded && 'lg:gap-6',
        )}
      >
        {!embedded ? (
          <div className="lg:max-w-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400">
              Biblioteca
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dietas</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              CRUD estilo CMS: tabla con búsqueda, panel lateral para crear o editar, y eliminación con confirmación.
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
              placeholder="Buscar por nombre o descripción…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar dietas"
            />
          </div>
          <Button type="button" variant="primary" className="shrink-0 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva dieta
          </Button>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Biblioteca vacía"
          description="Crea planes reutilizables y asígnalos desde la ficha del paciente."
          action={
            <Button type="button" variant="primary" className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Nueva dieta
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card dark:shadow-card-dark">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">
              {filtered.length} de {rows.length} ítems
            </span>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Descripción</th>
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
                      <span className="font-medium text-foreground">{row.name}</span>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground lg:hidden">
                        {row.description ?? '—'}
                      </p>
                    </td>
                    <td className="hidden max-w-md px-4 py-3 text-muted-foreground lg:table-cell">
                      <span className="line-clamp-2">{row.description ?? '—'}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell tabular-nums">
                      {formatUpdated(row.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button type="button" variant="secondary" className="h-8 gap-1 px-2 text-xs" onClick={() => void openEdit(row)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Editar
                        </Button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-destructive transition hover:bg-destructive/10"
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

      {panel !== 'closed' ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[2px]"
            aria-label="Cerrar panel"
            onClick={closePanel}
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {panel === 'create' ? 'Nueva dieta' : 'Editar dieta'}
              </h2>
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={closePanel}
                disabled={saving}
                aria-label="Cerrar panel"
              >
                <PanelRightClose className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSave} className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="flex flex-1 flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Nombre
                  <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Descripción
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
                </label>
              </div>
              <div className="mt-8 flex gap-2 border-t border-border pt-5">
                <Button type="button" variant="secondary" className="flex-1" onClick={closePanel} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1" loading={saving}>
                  Guardar
                </Button>
              </div>
            </form>
          </aside>
        </>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar dieta"
        description={
          deleteTarget
            ? `Se eliminará «${deleteTarget.name}». Si está asignada a pacientes, la operación no se permitirá hasta liberar esas asignaciones.`
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
