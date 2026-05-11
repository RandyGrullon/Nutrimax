'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Eye,
  PanelRightClose,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/cms/ConfirmDialog';
import { DataTablePagination } from '@/components/cms/DataTablePagination';
import { DataTableToolbar } from '@/components/cms/DataTableToolbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import {
  createDietBodySchema,
  defaultDietPlan,
  normalizeDietPlan,
  type DietPlan,
  type MealPlanItem,
  estimateMealPlanKcalFromItems,
} from '@nutrimax/shared';
import { DietPlanFormFields } from '@/components/diets/DietPlanFormFields';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch, apiJsonArray } from '@/lib/api';
import { clampPage, totalPagesFor } from '@/lib/paginate';
import { cn } from '@/lib/cn';

export type DietAdminRow = {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
};

type FoodRow = {
  id: string;
  name: string;
  kcal_per_100g: number | string;
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
  openEditDietId?: string | null;
  initialRows?: DietAdminRow[];
};

function DietsAdmin({ embedded = false, openEditDietId = null, initialRows }: DietsAdminProps) {
  const [rows, setRows] = useState<DietAdminRow[]>(() => initialRows ?? []);
  const [loading, setLoading] = useState(initialRows === undefined);
  const [query, setQuery] = useState('');
  const [sortDiets, setSortDiets] = useState<'updated_desc' | 'name_asc'>('updated_desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [panel, setPanel] = useState<PanelMode>('closed');
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState<DietPlan>(() => defaultDietPlan());
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DietAdminRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJsonArray<DietAdminRow>('/diets');
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFoods = useCallback(async () => {
    const data = await apiJsonArray<FoodRow>('/foods');
    setFoods(data);
  }, []);

  useEffect(() => {
    if (initialRows !== undefined) return;
    void load();
  }, [initialRows, load]);

  useEffect(() => {
    if (panel === 'closed') return;
    void loadFoods();
  }, [panel, loadFoods]);

  const openEdit = useCallback(async (row: DietAdminRow) => {
    setEditId(row.id);
    setName(row.name);
    setDescription(row.description ?? '');
    setPlan(defaultDietPlan());
    setPanel('edit');
    try {
      const res = await apiFetch(`/diets/${row.id}`);
      if (!res.ok) return;
      const full = (await res.json()) as {
        name?: string;
        description?: string | null;
        plan?: unknown;
      };
      if (typeof full.name === 'string') setName(full.name);
      setDescription(full.description ?? '');
      setPlan(normalizeDietPlan(full.plan));
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
        return rowName.includes(q) || desc.includes(q);
      });
    }
    return list;
  }, [rows, query]);

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
  }, [query, sortDiets]);

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

  const patchItem = useCallback((index: number, patch: Partial<MealPlanItem>) => {
    setPlan((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], ...patch } as MealPlanItem;
      return { ...prev, items: nextItems };
    });
  }, []);

  const updateMealNameForGroup = useCallback((indices: number[], newMeal: string) => {
    setPlan((prev) => {
      const nextItems = prev.items.map((it, i) =>
        indices.includes(i) ? ({ ...it, meal: newMeal } as MealPlanItem) : it,
      );
      return { ...prev, items: nextItems };
    });
  }, []);

  const addPlanItem = useCallback(() => {
    setPlan((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          meal: 'Nueva toma',
          food_id: foods[0]?.id ?? '',
          portion_grams: 100,
          order: prev.items.length,
        },
      ],
    }));
  }, [foods]);

  const addFoodToMeal = useCallback((mealName: string, atIndex: number) => {
    setPlan((prev) => {
      const nextItems = [...prev.items];
      nextItems.splice(atIndex + 1, 0, {
        meal: mealName,
        food_id: foods[0]?.id ?? '',
        portion_grams: 100,
        order: atIndex + 1,
      });
      const reordered = nextItems.map((it, i) => ({ ...it, order: i }));
      return { ...prev, items: reordered };
    });
  }, [foods]);

  const removePlanItem = useCallback((index: number) => {
    setPlan((prev) => {
      const filteredItems = prev.items
        .filter((_, i) => i !== index)
        .map((it, i) => ({ ...it, order: i }));
      return { ...prev, items: filteredItems };
    });
  }, []);

  const mealGroups = useMemo(() => {
    const groups: { meal: string; indices: number[]; items: MealPlanItem[] }[] = [];
    plan.items.forEach((it, idx) => {
      const last = groups[groups.length - 1];
      if (last && last.meal === it.meal) {
        last.indices.push(idx);
        last.items.push(it);
      } else {
        groups.push({ meal: it.meal, indices: [idx], items: [it] });
      }
    });
    return groups;
  }, [plan.items]);

  const foodsKcalMap = useMemo(() => {
    const m = new Map<string, { kcal_per_100g: number }>();
    for (const f of foods) {
      m.set(f.id, { kcal_per_100g: Number(f.kcal_per_100g) });
    }
    return m;
  }, [foods]);

  const planPreviewKcal = useMemo(
    () => estimateMealPlanKcalFromItems(plan.items, foodsKcalMap),
    [plan.items, foodsKcalMap],
  );

  function openCreate() {
    setEditId(null);
    setName('');
    setDescription('');
    setPlan(defaultDietPlan());
    setPanel('create');
  }

  function resetPanel() {
    setPanel('closed');
    setEditId(null);
    setPlan(defaultDietPlan());
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
              instrucciones al paciente. Todo unificado en una sola ficha de plan.
            </p>
          </div>
        ) : null}
        <div className="flex w-full flex-col gap-3 lg:ml-auto lg:w-auto lg:flex-1 lg:justify-end">
          <DataTableToolbar
            searchPlaceholder="Buscar por nombre o descripción…"
            searchValue={query}
            onSearchChange={setQuery}
            searchAriaLabel="Buscar dietas"
            pageSize={pageSize}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            filters={
              <Select
                className="min-w-[12rem]"
                value={sortDiets}
                onChange={(e) => setSortDiets(e.target.value as typeof sortDiets)}
                aria-label="Ordenar dietas"
              >
                <option value="updated_desc">Actualizado · reciente</option>
                <option value="name_asc">Nombre A → Z</option>
              </Select>
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
          {sortedRows.length === 0 && query.trim() ? (
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
                
                <DietPlanFormFields plan={plan} onPatch={patchPlan} />

                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-t border-border pt-6">
                    <div>
                      <span className="text-sm font-semibold text-foreground">Tomas y porciones</span>
                      <p className="text-[11px] text-muted-foreground">Distribuye alimentos por comida.</p>
                    </div>
                    <Button type="button" variant="secondary" className="h-8 gap-1 px-2 text-xs" onClick={addPlanItem}>
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      Nueva toma
                    </Button>
                  </div>

                  <p className="rounded-xl border border-brand-500/25 bg-brand-600/[0.06] px-3 py-2 text-xs leading-relaxed text-muted-foreground dark:border-brand-400/30 dark:bg-brand-500/[0.08]">
                    Energía total de las porciones: <strong className="text-foreground">{planPreviewKcal} kcal/día</strong>. 
                    Objetivo de la dieta: <strong className="text-foreground">{plan.targetKcal} kcal/día</strong>.
                  </p>

                  <div className="flex flex-col gap-4">
                    {mealGroups.map((group, gIdx) => (
                      <div
                        key={`g-${gIdx}`}
                        className="rounded-2xl border border-border/70 bg-muted/10 p-4 dark:border-white/[0.08]"
                      >
                        <div className="mb-4 flex items-end justify-between gap-3">
                          <label className="flex flex-1 flex-col gap-1.5 text-xs font-medium text-foreground">
                            Toma
                            <Input
                              value={group.meal}
                              onChange={(e) => updateMealNameForGroup(group.indices, e.target.value)}
                              placeholder="Ej. Desayuno, Almuerzo…"
                            />
                          </label>
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-9 w-9 shrink-0 rounded-xl p-0"
                            onClick={() => addFoodToMeal(group.meal, group.indices[group.indices.length - 1])}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {group.items.map((it, i) => {
                            const originalIdx = group.indices[i];
                            return (
                              <div
                                key={`${it.food_id}-${originalIdx}`}
                                className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/50 p-3 shadow-sm"
                              >
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <label className="flex flex-col gap-1.5 text-[11px] font-medium text-muted-foreground sm:col-span-2">
                                    Alimento
                                    <Select
                                      value={it.food_id}
                                      onChange={(e) => patchItem(originalIdx, { food_id: e.target.value })}
                                    >
                                      <option value="">Seleccionar…</option>
                                      {foods.map((f) => (
                                        <option key={f.id} value={f.id}>
                                          {f.name} ({Number(f.kcal_per_100g)} kcal/100g)
                                        </option>
                                      ))}
                                    </Select>
                                  </label>
                                  <label className="flex flex-col gap-1.5 text-[11px] font-medium text-muted-foreground">
                                    Porción (g)
                                    <Input
                                      inputMode="decimal"
                                      value={String(it.portion_grams)}
                                      onChange={(e) => patchItem(originalIdx, { portion_grams: Number(e.target.value) })}
                                    />
                                  </label>
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    className="text-[11px] font-medium text-destructive hover:underline"
                                    onClick={() => removePlanItem(originalIdx)}
                                  >
                                    Quitar alimento
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
  initialDiets?: DietAdminRow[];
};

export function DietLibraryClient({ openEditDietId = null, initialDiets }: DietLibraryClientProps) {
  return <DietsAdmin embedded openEditDietId={openEditDietId} initialRows={initialDiets} />;
}
