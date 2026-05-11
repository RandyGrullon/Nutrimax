'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Apple,
  Layers,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/cms/ConfirmDialog';
import { DataTablePagination } from '@/components/cms/DataTablePagination';
import { DataTableToolbar } from '@/components/cms/DataTableToolbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch, apiJsonArray } from '@/lib/api';
import { clampPage, totalPagesFor } from '@/lib/paginate';
import { cn } from '@/lib/cn';

type TabId = 'categories' | 'foods';

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type FoodRow = {
  id: string;
  category_id: string;
  name: string;
  kcal_per_100g: number | string;
  category_name: string | null;
};

function tabsMeta(id: TabId): { label: string; icon: typeof Apple } {
  switch (id) {
    case 'categories':
      return { label: 'Categorías', icon: Layers };
    default:
      return { label: 'Alimentos', icon: Apple };
  }
}

export function NutritionHubClient({ initialTab = 'categories' }: { initialTab?: TabId } = {}) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [foods, setFoods] = useState<FoodRow[]>([]);

  const [catName, setCatName] = useState('');
  const [deleteCat, setDeleteCat] = useState<CategoryRow | null>(null);
  const [deleteCatLoading, setDeleteCatLoading] = useState(false);

  const [foodCategoryId, setFoodCategoryId] = useState('');
  const [foodName, setFoodName] = useState('');
  const [foodKcal, setFoodKcal] = useState('250');
  const [deleteFood, setDeleteFood] = useState<FoodRow | null>(null);
  const [deleteFoodLoading, setDeleteFoodLoading] = useState(false);

  const [catQuery, setCatQuery] = useState('');
  const [catSort, setCatSort] = useState<'sort_order' | 'name'>('sort_order');
  const [catPage, setCatPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(10);

  const [foodQuery, setFoodQuery] = useState('');
  const [foodCatFilter, setFoodCatFilter] = useState('');
  const [foodKcalBand, setFoodKcalBand] = useState<'all' | 'zero' | 'low' | 'mid' | 'high'>('all');
  const [foodSort, setFoodSort] = useState<'name' | 'kcal' | 'category'>('name');
  const [foodPage, setFoodPage] = useState(1);
  const [foodPageSize, setFoodPageSize] = useState(10);

  const refreshCategories = useCallback(async () => {
    const data = await apiJsonArray<CategoryRow>('/food-categories');
    setCategories(data);
  }, []);

  const refreshFoods = useCallback(async () => {
    const data = await apiJsonArray<FoodRow>('/foods');
    setFoods(data);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshCategories(), refreshFoods()]);
    } finally {
      setLoading(false);
    }
  }, [refreshCategories, refreshFoods]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const filteredCategories = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    let list = categories;
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
    const arr = [...list];
    if (catSort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    else arr.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'es'));
    return arr;
  }, [categories, catQuery, catSort]);

  useEffect(() => setCatPage(1), [catQuery, catSort, catPageSize]);
  const catSafePage = clampPage(catPage, totalPagesFor(filteredCategories.length, catPageSize));
  useEffect(() => {
    if (catPage !== catSafePage) setCatPage(catSafePage);
  }, [catPage, catSafePage]);
  const catSlice = useMemo(() => {
    const start = (catSafePage - 1) * catPageSize;
    return filteredCategories.slice(start, start + catPageSize);
  }, [filteredCategories, catSafePage, catPageSize]);

  const filteredFoods = useMemo(() => {
    let list = foods;
    const q = foodQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => {
        const n = f.name.toLowerCase();
        const c = (f.category_name ?? '').toLowerCase();
        return n.includes(q) || c.includes(q);
      });
    }
    if (foodCatFilter) list = list.filter((f) => f.category_id === foodCatFilter);
    list = list.filter((f) => {
      const k = Number(f.kcal_per_100g);
      switch (foodKcalBand) {
        case 'zero':
          return k === 0;
        case 'low':
          return k > 0 && k < 150;
        case 'mid':
          return k >= 150 && k <= 350;
        case 'high':
          return k > 350;
        default:
          return true;
      }
    });
    const arr = [...list];
    switch (foodSort) {
      case 'kcal':
        return arr.sort((a, b) => Number(a.kcal_per_100g) - Number(b.kcal_per_100g));
      case 'category':
        return arr.sort(
          (a, b) =>
            (a.category_name ?? '').localeCompare(b.category_name ?? '', 'es') ||
            a.name.localeCompare(b.name, 'es'),
        );
      default:
        return arr.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
  }, [foods, foodQuery, foodCatFilter, foodKcalBand, foodSort]);

  useEffect(() => setFoodPage(1), [foodQuery, foodCatFilter, foodKcalBand, foodSort, foodPageSize]);
  const foodSafePage = clampPage(foodPage, totalPagesFor(filteredFoods.length, foodPageSize));
  useEffect(() => {
    if (foodPage !== foodSafePage) setFoodPage(foodSafePage);
  }, [foodPage, foodSafePage]);
  const foodSlice = useMemo(() => {
    const start = (foodSafePage - 1) * foodPageSize;
    return filteredFoods.slice(start, start + foodPageSize);
  }, [filteredFoods, foodSafePage, foodPageSize]);

  async function onAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const n = catName.trim();
    if (!n) return;
    try {
      const res = await apiFetch('/food-categories', {
        method: 'POST',
        body: JSON.stringify({ name: n }),
      });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Categoría creada.');
      setCatName('');
      await refreshCategories();
    } catch {
      showErrorToast('No pudimos crear la categoría.');
    }
  }

  async function onConfirmDeleteCategory() {
    if (!deleteCat) return;
    setDeleteCatLoading(true);
    try {
      const res = await apiFetch(`/food-categories/${deleteCat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Categoría eliminada.');
      setDeleteCat(null);
      await refreshCategories();
      await refreshFoods();
    } catch {
      showErrorToast('No pudimos eliminar.');
    } finally {
      setDeleteCatLoading(false);
    }
  }

  async function onAddFood(e: React.FormEvent) {
    e.preventDefault();
    const n = foodName.trim();
    if (!foodCategoryId || !n) {
      showErrorToast('Elige categoría y nombre del alimento.');
      return;
    }
    const k = Number(foodKcal);
    if (!Number.isFinite(k) || k <= 0) {
      showErrorToast('Las kcal por 100 g deben ser un número válido.');
      return;
    }
    try {
      const res = await apiFetch('/foods', {
        method: 'POST',
        body: JSON.stringify({
          category_id: foodCategoryId,
          name: n,
          kcal_per_100g: k,
        }),
      });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Alimento creado.');
      setFoodName('');
      await refreshFoods();
    } catch {
      showErrorToast('No pudimos crear el alimento.');
    }
  }

  async function onConfirmDeleteFood() {
    if (!deleteFood) return;
    setDeleteFoodLoading(true);
    try {
      const res = await apiFetch(`/foods/${deleteFood.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Alimento eliminado.');
      setDeleteFood(null);
      await refreshFoods();
    } catch {
      showErrorToast('No pudimos eliminar.');
    } finally {
      setDeleteFoodLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-14 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-6">
      <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/80 p-1.5 shadow-sm dark:border-white/[0.07]">
        {(['categories', 'foods'] as const).map((id) => {
          const { label, icon: Icon } = tabsMeta(id);
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition sm:flex-none sm:justify-start',
                active
                  ? 'bg-brand-600 text-white shadow-md dark:bg-brand-500'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'categories' ? (
        <section className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/20 p-5 shadow-card dark:border-white/[0.06] dark:shadow-card-dark">
            <h2 className="text-lg font-semibold text-foreground">Organiza el catálogo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Las categorías agrupan alimentos en la biblioteca y en los planes por tomas.
            </p>
            <form onSubmit={onAddCategory} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-foreground">
                Nueva categoría
                <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ej. Verduras, Proteínas…" />
              </label>
              <Button type="submit" variant="primary" className="gap-2 sm:shrink-0">
                <Plus className="h-4 w-4" aria-hidden />
                Añadir
              </Button>
            </form>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Sin categorías"
              description="Crea la primera categoría para empezar a cargar alimentos."
            />
          ) : (
            <div className="space-y-3">
              <DataTableToolbar
                searchPlaceholder="Buscar categoría por nombre…"
                searchValue={catQuery}
                onSearchChange={setCatQuery}
                searchAriaLabel="Buscar categorías"
                pageSize={catPageSize}
                onPageSizeChange={(n) => {
                  setCatPageSize(n);
                  setCatPage(1);
                }}
                filters={
                  <Select
                    className="min-w-[11rem]"
                    value={catSort}
                    onChange={(e) => setCatSort(e.target.value as typeof catSort)}
                    aria-label="Ordenar categorías"
                  >
                    <option value="sort_order">Orden guardado</option>
                    <option value="name">Nombre A → Z</option>
                  </Select>
                }
              />
              {filteredCategories.length === 0 ? (
                <p className="rounded-xl border border-border/70 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
                  Ninguna categoría coincide con la búsqueda.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card dark:border-white/[0.06] dark:shadow-card-dark">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/20 px-4 py-3 dark:border-white/[0.06]">
                    <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <UtensilsCrossed className="h-4 w-4" aria-hidden />
                      {filteredCategories.length === categories.length
                        ? `${categories.length} categorías`
                        : `${filteredCategories.length} coincidencias · ${categories.length} totales`}
                    </span>
                  </div>
                  <ul className="divide-y divide-border/70">
                    {catSlice.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <span className="font-medium text-foreground">{c.name}</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteCat(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                  <DataTablePagination
                    page={catSafePage}
                    pageSize={catPageSize}
                    totalFiltered={filteredCategories.length}
                    datasetTotal={categories.length}
                    onPageChange={setCatPage}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'foods' ? (
        <section className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/20 p-5 shadow-card dark:border-white/[0.06] dark:shadow-card-dark">
            <h2 className="text-lg font-semibold text-foreground">Alimentos con energía referencial</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Las kcal por 100 g sirven para estimar la energía del plan por porciones.
            </p>
            <form onSubmit={onAddFood} className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-2">
                Categoría *
                <Select value={foodCategoryId} onChange={(e) => setFoodCategoryId(e.target.value)} required>
                  <option value="">Seleccionar…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-2">
                Nombre *
                <Input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="Ej. Pechuga de pollo" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                kcal / 100 g *
                <Input inputMode="decimal" value={foodKcal} onChange={(e) => setFoodKcal(e.target.value)} />
              </label>
              <div className="flex items-end">
                <Button type="submit" variant="primary" className="w-full gap-2 md:w-auto">
                  <Plus className="h-4 w-4" aria-hidden />
                  Añadir alimento
                </Button>
              </div>
            </form>
          </div>

          {foods.length === 0 ? (
            <EmptyState
              icon={Apple}
              title="Sin alimentos"
              description="Necesitas al menos una categoría y luego puedes cargar alimentos aquí."
            />
          ) : (
            <div className="space-y-3">
              <DataTableToolbar
                searchPlaceholder="Buscar por nombre o categoría…"
                searchValue={foodQuery}
                onSearchChange={setFoodQuery}
                searchAriaLabel="Buscar alimentos"
                pageSize={foodPageSize}
                onPageSizeChange={(n) => {
                  setFoodPageSize(n);
                  setFoodPage(1);
                }}
                filters={
                  <>
                    <Select
                      className="min-w-[10rem]"
                      value={foodCatFilter}
                      onChange={(e) => setFoodCatFilter(e.target.value)}
                      aria-label="Filtrar por categoría"
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <Select
                      className="min-w-[11rem]"
                      value={foodKcalBand}
                      onChange={(e) => setFoodKcalBand(e.target.value as typeof foodKcalBand)}
                      aria-label="Rango de kcal por 100 g"
                    >
                      <option value="all">Kcal: todas</option>
                      <option value="zero">0 kcal (ej. agua)</option>
                      <option value="low">Bajas (&lt;150)</option>
                      <option value="mid">Medias (150–350)</option>
                      <option value="high">Altas (&gt;350)</option>
                    </Select>
                    <Select
                      className="min-w-[10rem]"
                      value={foodSort}
                      onChange={(e) => setFoodSort(e.target.value as typeof foodSort)}
                      aria-label="Ordenar alimentos"
                    >
                      <option value="name">Nombre A → Z</option>
                      <option value="kcal">Kcal ascendente</option>
                      <option value="category">Categoría</option>
                    </Select>
                  </>
                }
              />
              {filteredFoods.length === 0 ? (
                <p className="rounded-xl border border-border/70 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
                  Ningún alimento coincide con filtros o búsqueda.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card dark:border-white/[0.06] dark:shadow-card-dark">
                  <div className="border-b border-border/70 bg-muted/20 px-4 py-2 text-xs text-muted-foreground dark:border-white/[0.06]">
                    {filteredFoods.length === foods.length
                      ? `${foods.length} alimentos`
                      : `${filteredFoods.length} coincidencias · ${foods.length} en catálogo`}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-3 font-medium">Nombre</th>
                          <th className="px-4 py-3 font-medium">Categoría</th>
                          <th className="px-4 py-3 font-medium tabular-nums">kcal/100g</th>
                          <th className="px-4 py-3 text-right font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {foodSlice.map((f) => (
                          <tr key={f.id} className="border-b border-border/70 last:border-0 hover:bg-muted/15">
                            <td className="px-4 py-3 font-medium text-foreground">{f.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{f.category_name ?? '—'}</td>
                            <td className="px-4 py-3 tabular-nums text-muted-foreground">
                              {Number(f.kcal_per_100g)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteFood(f)}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <DataTablePagination
                    page={foodSafePage}
                    pageSize={foodPageSize}
                    totalFiltered={filteredFoods.length}
                    datasetTotal={foods.length}
                    onPageChange={setFoodPage}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      <ConfirmDialog
        open={deleteCat !== null}
        title="Eliminar categoría"
        description={
          deleteCat
            ? `Se eliminará «${deleteCat.name}». Solo es posible si no tiene alimentos asociados.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteCatLoading}
        onCancel={() => !deleteCatLoading && setDeleteCat(null)}
        onConfirm={onConfirmDeleteCategory}
      />

      <ConfirmDialog
        open={deleteFood !== null}
        title="Eliminar alimento"
        description={
          deleteFood
            ? `Se eliminará «${deleteFood.name}».`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteFoodLoading}
        onCancel={() => !deleteFoodLoading && setDeleteFood(null)}
        onConfirm={onConfirmDeleteFood}
      />
    </div>
  );
}
