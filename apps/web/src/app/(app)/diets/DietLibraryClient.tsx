'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Eye, PanelRightClose, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/cms/ConfirmDialog';
import { DataTablePagination } from '@/components/cms/DataTablePagination';
import { DataTableToolbar } from '@/components/cms/DataTableToolbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createDietBodySchema, defaultDietPlan, normalizeDietPlan, type DietPlan } from '@nutrimax/shared';
import { DietPlanFormFields } from '@/components/diets/DietPlanFormFields';
import { Select } from '@/components/ui/Select';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch, apiJsonArray } from '@/lib/api';
import { clampPage, totalPagesFor } from '@/lib/paginate';
import { cn } from '@/lib/cn';

export type DietAdminRow = {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  meal_plan_name?: string | null;
};

type MealPlanListRow = {
  id: string;
  name: string;
  kcal_range_min: number;
  kcal_range_max: number;
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
  /** Desde otras pantallas: abrir edición de esta dieta al tener filas cargadas. */
  openEditDietId?: string | null;
  /** Datos del RSC para evitar el primer fetch a `/api/diets`. */
  initialRows?: DietAdminRow[];
};

function DietsAdmin({ embedded = false, openEditDietId = null, initialRows }: DietsAdminProps) {
  const [rows, setRows] = useState<DietAdminRow[]>(() => initialRows ?? []);
  const [loading, setLoading] = useState(initialRows === undefined);
  const [query, setQuery] = useState('');
  const [mealPlanFilter, setMealPlanFilter] = useState<'all' | 'with' | 'without'>('all');
  const [sortDiets, setSortDiets] = useState<'updated_desc' | 'name_asc'>('updated_desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [panel, setPanel] = useState<PanelMode>('closed');
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState<DietPlan>(() => defaultDietPlan());
  const [mealPlanId, setMealPlanId] = useState<string | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlanListRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DietAdminRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await apiJsonArray<DietAdminRow>('/diets');
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialRows !== undefined) return;
    void load();
  }, [initialRows, load]);

  useEffect(() => {
    if (panel === 'closed') return;
    void (async () => {
      const data = await apiJsonArray<MealPlanListRow>('/meal-plans');
      setMealPlans(data);
    })();
  }, [panel]);

  const openEdit = useCallback(async (row: DietAdminRow) => {
    setEditId(row.id);
    setName(row.name);
    setDescription(row.description ?? '');
    setPlan(defaultDietPlan());
    setMealPlanId(null);
    setPanel('edit');
    try {
      const res = await apiFetch(`/diets/${row.id}`);
      if (!res.ok) return;
      const full = (await res.json()) as {
        name?: string;
        description?: string | null;
        plan?: unknown;
        meal_plan_id?: string | null;
      };
      if (typeof full.name === 'string') setName(full.name);
      setDescription(full.description ?? '');
      setPlan(normalizeDietPlan(full.plan));
      setMealPlanId(full.meal_plan_id ?? null);
    } catch {
      /* keep row snapshot */
    }
  }, []);

  const suppressDeepLinkReopen = useRef(false);
  useEffect(() => {
    suppressDeepLinkReopen.current = false;
  }, [openEditDietId]);

  useEffect(() => {
    if (loading || !openEditDietId || rows.length === 0) return;
    if (suppressDeepLinkReopen.current) return;
    const row = rows.find((r) => r.id === openEditDietId);
    if (!row) return;
    suppressDeepLinkReopen.current = true;
    void openEdit(row);
  }, [loading, openEditDietId, rows, openEdit]);

  const filtered = useMemo(() => {
    let list = rows;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const rowName = (r.name ?? '').toLowerCase();
        const desc = (r.description ?? '').toLowerCase();
        const mp = (r.meal_plan_name ?? '').toLowerCase();
        return rowName.includes(q) || desc.includes(q) || mp.includes(q);
      });
    }
    if (mealPlanFilter === 'with') {
      list = list.filter((r) => Boolean(r.meal_plan_name?.trim()));
    }
    if (mealPlanFilter === 'without') {
      list = list.filter((r) => !r.meal_plan_name?.trim());
    }
    return list;
  }, [rows, query, mealPlanFilter]);

  const sortedRows = useMemo(() => {
    const arr = [...filtered];
    if (sortDiets === 'name_asc') {
      return arr.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    return arr.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [filtered, sortDiets]);

  useEffect(() => {
    setPage(1);
  }, [query, mealPlanFilter, sortDiets]);

  const totalPages = totalPagesFor(sortedRows.length, pageSize);
  const safePage = clampPage(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, safePage, pageSize]);

  const patchPlan = useCallback((patch: Partial<DietPlan>) => {
    setPlan((prev) => ({ ...prev, ...patch }));
  }, []);

  function openCreate() {
    setEditId(null);
    setName('');
    setDescription('');
    setPlan(defaultDietPlan());
    setMealPlanId(null);
    setPanel('create');
  }

  function resetPanel() {
    setPanel('closed');
    setEditId(null);
    setPlan(defaultDietPlan());
    setMealPlanId(null);
  }

  function closePanel() {
    if (saving) return;
    suppressDeepLinkReopen.current = true;
    resetPanel();
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const desc = description.trim();
    const parsed = createDietBodySchema.safeParse({
      name: n,
      description: desc,
      plan,
      meal_plan_id: mealPlanId,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Revisa los campos del plan.';
      showErrorToast(first);
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify(parsed.data);
      if (panel === 'create') {
        const res = await apiFetch('/diets', { method: 'POST', body });
        if (!res.ok) {
          showErrorToast(await parseApiError(res));
          return;
        }
        showSuccessToast('Dieta creada con plan completo.');
      } else if (panel === 'edit' && editId) {
        const res = await apiFetch(`/diets/${editId}`, { method: 'PUT', body });
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
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400">
              Biblioteca
            </p>
            <h1 className="mt-1 text-2xl font-normal tracking-tight text-foreground sm:text-[1.75rem]">Dietas</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cada plan incluye objetivo, energía, macronutrientes, estructura de comidas, orientación alimentaria e
              instrucciones al paciente. La biblioteca permite reutilizar y asignar desde la ficha del paciente.
            </p>
          </div>
        ) : null}
        <div className="flex w-full flex-col gap-3 lg:ml-auto lg:w-auto lg:flex-1 lg:justify-end">
          <DataTableToolbar
            searchPlaceholder="Buscar por nombre, descripción o plan alimenticio…"
            searchValue={query}
            onSearchChange={setQuery}
            searchAriaLabel="Buscar dietas"
            pageSize={pageSize}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            filters={
              <>
                <Select
                  className="min-w-[10rem]"
                  value={mealPlanFilter}
                  onChange={(e) => setMealPlanFilter(e.target.value as typeof mealPlanFilter)}
                  aria-label="Filtrar por plan alimenticio"
                >
                  <option value="all">Plan: todos</option>
                  <option value="with">Con plan alimenticio</option>
                  <option value="without">Sin plan alimenticio</option>
                </Select>
                <Select
                  className="min-w-[10rem]"
                  value={sortDiets}
                  onChange={(e) => setSortDiets(e.target.value as typeof sortDiets)}
                  aria-label="Ordenar dietas"
                >
                  <option value="updated_desc">Actualizado · reciente</option>
                  <option value="name_asc">Nombre A → Z</option>
                </Select>
              </>
            }
          />
          <div className="flex shrink-0 items-center justify-end gap-1">
            <HelpInfoButton title="Tabla de dietas" label="tabla dietas" triggerClassName="p-2">
              <p>
                Usa la lupa para filtrar. Los botones <strong className="text-foreground">Editar</strong> y{' '}
                <strong className="text-foreground">Eliminar</strong> están en cada fila.
              </p>
              <p className="text-xs">
                Los planes que ya están asignados a pacientes no se pueden borrar hasta quitar esas asignaciones.
              </p>
            </HelpInfoButton>
            <Button type="button" variant="primary" className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Nueva dieta
            </Button>
          </div>
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
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card dark:border-white/[0.06] dark:shadow-card-dark">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/25 px-4 py-3 dark:border-white/[0.06]">
            <span className="text-xs font-medium text-muted-foreground">
              {sortedRows.length === rows.length
                ? `${rows.length} ítems`
                : `${sortedRows.length} coincidencias · ${rows.length} en biblioteca`}
            </span>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">Plan alimenticio</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Descripción</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Actualizado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/80 transition last:border-0 hover:bg-muted/15"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{row.name}</span>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground lg:hidden">
                        {row.description ?? '—'}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground xl:hidden">
                        Plan: {row.meal_plan_name?.trim() ? row.meal_plan_name : '—'}
                      </p>
                    </td>
                    <td className="hidden max-w-[14rem] px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                      <span className="line-clamp-2">{row.meal_plan_name?.trim() ? row.meal_plan_name : '—'}</span>
                    </td>
                    <td className="hidden max-w-md px-4 py-3 text-muted-foreground lg:table-cell">
                      <span className="line-clamp-2">{row.description ?? '—'}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell tabular-nums">
                      {formatUpdated(row.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button href={`/diets/${row.id}`} variant="secondary" className="h-8 gap-1 px-2 text-xs">
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Ver
                        </Button>
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
          {sortedRows.length === 0 && (query.trim() || mealPlanFilter !== 'all') ? (
            <p className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No hay resultados con los filtros actuales.
            </p>
          ) : null}
          {sortedRows.length > 0 ? (
            <DataTablePagination
              page={safePage}
              pageSize={pageSize}
              totalFiltered={sortedRows.length}
              datasetTotal={rows.length}
              onPageChange={setPage}
            />
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
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
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
                  Nombre del plan *
                  <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Descripción resumida *
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                    placeholder="Mínimo 30 caracteres: objetivo del plan, perfil del paciente tipo, contexto clínico breve…"
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  El plan nutricional detallado va en los bloques siguientes (objetivo, kcal, macros, tomas, textos al
                  paciente).
                </p>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Plan alimenticio (opcional)
                  <Select
                    value={mealPlanId ?? ''}
                    onChange={(e) => setMealPlanId(e.target.value || null)}
                    aria-label="Plan alimenticio vinculado"
                  >
                    <option value="">Sin plan alimenticio</option>
                    {[...mealPlans]
                      .sort((a, b) => {
                        const ta = plan.targetKcal >= a.kcal_range_min && plan.targetKcal <= a.kcal_range_max ? 0 : 1;
                        const tb = plan.targetKcal >= b.kcal_range_min && plan.targetKcal <= b.kcal_range_max ? 0 : 1;
                        return ta - tb || a.name.localeCompare(b.name);
                      })
                      .map((mp) => {
                        const inRange =
                          plan.targetKcal >= mp.kcal_range_min && plan.targetKcal <= mp.kcal_range_max;
                        return (
                          <option key={mp.id} value={mp.id}>
                            {mp.name} ({mp.kcal_range_min}–{mp.kcal_range_max} kcal)
                            {inRange ? ' · encaja en rango' : ''}
                          </option>
                        );
                      })}
                  </Select>
                  <span className="text-xs font-normal text-muted-foreground">
                    Objetivo actual de la dieta: <strong className="text-foreground">{plan.targetKcal} kcal/día</strong>.
                    El plan debe incluir ese objetivo en su rango y las porciones no deben superarlo en exceso (validación
                    al guardar).
                  </span>
                </label>
                <DietPlanFormFields plan={plan} onPatch={patchPlan} />
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

type DietLibraryClientProps = {
  openEditDietId?: string | null;
  /** Si viene del RSC, primera pintura sin esperar a `/api/diets`. */
  initialDiets?: DietAdminRow[];
};

export function DietLibraryClient({ openEditDietId = null, initialDiets }: DietLibraryClientProps) {
  return <DietsAdmin embedded openEditDietId={openEditDietId} initialRows={initialDiets} />;
}
