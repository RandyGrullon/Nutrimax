'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Apple,
  Layers,
  PanelRightClose,
  Plus,
  Salad,
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
import { Textarea } from '@/components/ui/Textarea';
import type { MealPlanItem } from '@nutrimax/shared';
import { estimateMealPlanKcalFromItems } from '@nutrimax/shared';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch, apiJsonArray } from '@/lib/api';
import { clampPage, totalPagesFor } from '@/lib/paginate';
import { cn } from '@/lib/cn';

type TabId = 'categories' | 'foods' | 'plans';

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

type MealPlanRow = {
  id: string;
  name: string;
  description: string | null;
  kcal_range_min: number;
  kcal_range_max: number;
  items: unknown;
  updated_at?: string;
};

function tabsMeta(id: TabId): { label: string; icon: typeof Apple } {
  switch (id) {
    case 'categories':
      return { label: 'Categorías', icon: Layers };
    case 'foods':
      return { label: 'Alimentos', icon: Apple };
    default:
      return { label: 'Planes alimenticios', icon: Salad };
  }
}

export function NutritionHubClient() {
  const [tab, setTab] = useState<TabId>('categories');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanRow[]>([]);

  const [catName, setCatName] = useState('');
  const [deleteCat, setDeleteCat] = useState<CategoryRow | null>(null);
  const [deleteCatLoading, setDeleteCatLoading] = useState(false);

  const [foodCategoryId, setFoodCategoryId] = useState('');
  const [foodName, setFoodName] = useState('');
  const [foodKcal, setFoodKcal] = useState('250');
  const [deleteFood, setDeleteFood] = useState<FoodRow | null>(null);
  const [deleteFoodLoading, setDeleteFoodLoading] = useState(false);

  const [planPanel, setPlanPanel] = useState<'closed' | 'create' | 'edit'>('closed');
  const [planEditId, setPlanEditId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planMin, setPlanMin] = useState('1800');
  const [planMax, setPlanMax] = useState('2200');
  const [planItems, setPlanItems] = useState<MealPlanItem[]>([]);
  const [planSaving, setPlanSaving] = useState(false);
  const [deletePlan, setDeletePlan] = useState<MealPlanRow | null>(null);
  const [deletePlanLoading, setDeletePlanLoading] = useState(false);

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

  const [planQuery, setPlanQuery] = useState('');
  const [planItemsFilter, setPlanItemsFilter] = useState<'all' | 'empty' | 'has'>('all');
  const [planPage, setPlanPage] = useState(1);
  const [planPageSize, setPlanPageSize] = useState(10);

  const refreshCategories = useCallback(async () => {
    const data = await apiJsonArray<CategoryRow>('/food-categories');
    setCategories(data);
  }, []);

  const refreshFoods = useCallback(async () => {
    const data = await apiJsonArray<FoodRow>('/foods');
    setFoods(data);
  }, []);

  const refreshMealPlans = useCallback(async () => {
    const data = await apiJsonArray<MealPlanRow>('/meal-plans');
    setMealPlans(data);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshCategories(), refreshFoods(), refreshMealPlans()]);
    } finally {
      setLoading(false);
    }
  }, [refreshCategories, refreshFoods, refreshMealPlans]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const foodsKcalMap = useMemo(() => {
    const m = new Map<string, { kcal_per_100g: number }>();
    for (const f of foods) {
      m.set(f.id, { kcal_per_100g: Number(f.kcal_per_100g) });
    }
    return m;
  }, [foods]);

  const planPreviewKcal = useMemo(
    () => estimateMealPlanKcalFromItems(planItems, foodsKcalMap),
    [planItems, foodsKcalMap],
  );

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

  const filteredPlans = useMemo(() => {
    let list = mealPlans;
    const q = planQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const n = p.name.toLowerCase();
        const d = (p.description ?? '').toLowerCase();
        const band = `${p.kcal_range_min}-${p.kcal_range_max}`;
        return n.includes(q) || d.includes(q) || band.includes(q);
      });
    }
    if (planItemsFilter !== 'all') {
      list = list.filter((p) => {
        const n = Array.isArray(p.items) ? p.items.length : 0;
        return planItemsFilter === 'empty' ? n === 0 : n > 0;
      });
    }
    return [...list].sort((a, b) => b.kcal_range_min - a.kcal_range_min);
  }, [mealPlans, planQuery, planItemsFilter]);

  useEffect(() => setPlanPage(1), [planQuery, planItemsFilter, planPageSize]);
  const planSafePage = clampPage(planPage, totalPagesFor(filteredPlans.length, planPageSize));
  useEffect(() => {
    if (planPage !== planSafePage) setPlanPage(planSafePage);
  }, [planPage, planSafePage]);
  const planSlice = useMemo(() => {
    const start = (planSafePage - 1) * planPageSize;
    return filteredPlans.slice(start, start + planPageSize);
  }, [filteredPlans, planSafePage, planPageSize]);

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
      await refreshMealPlans();
    } catch {
      showErrorToast('No pudimos eliminar.');
    } finally {
      setDeleteFoodLoading(false);
    }
  }

  function openPlanCreate() {
    setPlanEditId(null);
    setPlanName('');
    setPlanDesc('');
    setPlanMin('1800');
    setPlanMax('2200');
    setPlanItems([]);
    setPlanPanel('create');
  }

  async function openPlanEdit(row: MealPlanRow) {
    setPlanEditId(row.id);
    setPlanName(row.name);
    setPlanDesc(row.description ?? '');
    setPlanMin(String(row.kcal_range_min));
    setPlanMax(String(row.kcal_range_max));
    setPlanPanel('edit');
    try {
      const res = await apiFetch(`/meal-plans/${row.id}`);
      if (!res.ok) return;
      const full = (await res.json()) as { items?: unknown };
      const raw = Array.isArray(full.items) ? full.items : [];
      const items: MealPlanItem[] = raw
        .map((it: unknown) => {
          if (!it || typeof it !== 'object') return null;
          const o = it as Record<string, unknown>;
          const meal = typeof o.meal === 'string' ? o.meal : '';
          const food_id = typeof o.food_id === 'string' ? o.food_id : '';
          const portion = Number(o.portion_grams);
          const order = Number(o.order);
          if (!meal || !food_id || !Number.isFinite(portion) || !Number.isFinite(order)) return null;
          return { meal, food_id, portion_grams: portion, order };
        })
        .filter((x): x is MealPlanItem => x !== null);
      setPlanItems(items);
    } catch {
      setPlanItems([]);
    }
  }

  function closePlanPanel() {
    if (planSaving) return;
    setPlanPanel('closed');
    setPlanEditId(null);
    setPlanItems([]);
  }

  function patchItem(index: number, patch: Partial<MealPlanItem>) {
    setPlanItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addPlanItem() {
    setPlanItems((prev) => [
      ...prev,
      {
        meal: 'Desayuno',
        food_id: foods[0]?.id ?? '',
        portion_grams: 100,
        order: prev.length,
      },
    ]);
  }

  function removePlanItem(index: number) {
    setPlanItems((prev) => prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, order: i })));
  }

  async function onSavePlan(e: React.FormEvent) {
    e.preventDefault();
    const n = planName.trim();
    const desc = planDesc.trim();
    const min = Number(planMin);
    const max = Number(planMax);
    if (!n || !Number.isFinite(min) || !Number.isFinite(max)) {
      showErrorToast('Revisa nombre y rango de kcal.');
      return;
    }
    const cleaned = planItems
      .filter((it) => it.meal.trim() && it.food_id)
      .map((it, i) => ({ ...it, meal: it.meal.trim(), order: i }));
    setPlanSaving(true);
    try {
      const body = JSON.stringify({
        name: n,
        description: desc || null,
        kcal_range_min: Math.round(min),
        kcal_range_max: Math.round(max),
        items: cleaned,
      });
      const res =
        planPanel === 'create'
          ? await apiFetch('/meal-plans', { method: 'POST', body })
          : planEditId
            ? await apiFetch(`/meal-plans/${planEditId}`, { method: 'PATCH', body })
            : null;
      if (!res || !res.ok) {
        showErrorToast(res ? await parseApiError(res) : 'No pudimos guardar.');
        return;
      }
      showSuccessToast(planPanel === 'create' ? 'Plan alimenticio creado.' : 'Plan actualizado.');
      closePlanPanel();
      await refreshMealPlans();
    } catch {
      showErrorToast('No pudimos guardar el plan.');
    } finally {
      setPlanSaving(false);
    }
  }

  async function onConfirmDeletePlan() {
    if (!deletePlan) return;
    setDeletePlanLoading(true);
    try {
      const res = await apiFetch(`/meal-plans/${deletePlan.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Plan eliminado.');
      setDeletePlan(null);
      if (planEditId === deletePlan.id) closePlanPanel();
      await refreshMealPlans();
    } catch {
      showErrorToast('No pudimos eliminar.');
    } finally {
      setDeletePlanLoading(false);
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
        {(['categories', 'foods', 'plans'] as const).map((id) => {
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
              Las kcal por 100 g sirven para estimar la energía del plan por porciones. Los planes validan coherencia con
              la dieta al guardar.
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

      {tab === 'plans' ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Planes por tomas</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Define un rango de kcal/día para el que sirve el plan y reparte alimentos por comida. En la biblioteca de
                dietas podrás enlazar este plan si encaja con las kcal objetivo y las porciones no sobrepasan el objetivo.
              </p>
            </div>
            <Button type="button" variant="primary" className="gap-2" onClick={openPlanCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo plan
            </Button>
          </div>

          {mealPlans.length === 0 ? (
            <EmptyState
              icon={Salad}
              title="Sin planes alimenticios"
              description="Crea plantillas de menú con porciones y rangos de energía para asociarlas a dietas."
              action={
                <Button type="button" variant="primary" className="gap-2" onClick={openPlanCreate}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Crear plan
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              <DataTableToolbar
                searchPlaceholder="Buscar plan por nombre, descripción o rango kcal…"
                searchValue={planQuery}
                onSearchChange={setPlanQuery}
                searchAriaLabel="Buscar planes alimenticios"
                pageSize={planPageSize}
                onPageSizeChange={(n) => {
                  setPlanPageSize(n);
                  setPlanPage(1);
                }}
                filters={
                  <Select
                    className="min-w-[11rem]"
                    value={planItemsFilter}
                    onChange={(e) => setPlanItemsFilter(e.target.value as typeof planItemsFilter)}
                    aria-label="Filtrar por ítems del plan"
                  >
                    <option value="all">Ítems: todos</option>
                    <option value="has">Con tomas definidas</option>
                    <option value="empty">Sin ítems (solo rango)</option>
                  </Select>
                }
              />
              {filteredPlans.length === 0 ? (
                <p className="rounded-xl border border-border/70 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
                  Ningún plan coincide con filtros o búsqueda.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card dark:border-white/[0.06] dark:shadow-card-dark">
                  <div className="border-b border-border/70 bg-muted/20 px-4 py-2 text-xs text-muted-foreground dark:border-white/[0.06]">
                    {filteredPlans.length === mealPlans.length
                      ? `${mealPlans.length} planes`
                      : `${filteredPlans.length} coincidencias · ${mealPlans.length} totales`}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-3 font-medium">Nombre</th>
                          <th className="px-4 py-3 font-medium tabular-nums">Rango kcal/día</th>
                          <th className="hidden px-4 py-3 font-medium md:table-cell">Ítems</th>
                          <th className="px-4 py-3 text-right font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planSlice.map((p) => {
                          const arr = Array.isArray(p.items) ? p.items : [];
                          return (
                            <tr key={p.id} className="border-b border-border/70 last:border-0 hover:bg-muted/15">
                              <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                {p.kcal_range_min}–{p.kcal_range_max}
                              </td>
                              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{arr.length}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    className="h-8 px-2 text-xs"
                                    onClick={() => void openPlanEdit(p)}
                                  >
                                    Editar
                                  </Button>
                                  <button
                                    type="button"
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeletePlan(p)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <DataTablePagination
                    page={planSafePage}
                    pageSize={planPageSize}
                    totalFiltered={filteredPlans.length}
                    datasetTotal={mealPlans.length}
                    onPageChange={setPlanPage}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      {planPanel !== 'closed' ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[2px]"
            aria-label="Cerrar panel"
            onClick={closePlanPanel}
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {planPanel === 'create' ? 'Nuevo plan alimenticio' : 'Editar plan alimenticio'}
              </h2>
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={closePlanPanel}
                disabled={planSaving}
                aria-label="Cerrar panel"
              >
                <PanelRightClose className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSavePlan} className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="flex flex-1 flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Nombre *
                  <Input value={planName} onChange={(e) => setPlanName(e.target.value)} required />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Descripción
                  <Textarea value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} rows={3} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Kcal mín. del rango *
                    <Input inputMode="numeric" value={planMin} onChange={(e) => setPlanMin(e.target.value)} required />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Kcal máx. del rango *
                    <Input inputMode="numeric" value={planMax} onChange={(e) => setPlanMax(e.target.value)} required />
                  </label>
                </div>
                <p className="rounded-xl border border-brand-500/25 bg-brand-600/[0.06] px-3 py-2 text-xs leading-relaxed text-muted-foreground dark:border-brand-400/30 dark:bg-brand-500/[0.08]">
                  Vista previa energía por porciones (aprox.):{' '}
                  <strong className="text-foreground">{planPreviewKcal} kcal/día</strong>. Debe ser coherente con el rango
                  y, al enlazar en una dieta, no superar las kcal objetivo de esa dieta (validación automática).
                </p>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">Tomas y porciones</span>
                  <Button type="button" variant="secondary" className="h-8 gap-1 px-2 text-xs" onClick={addPlanItem}>
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Añadir fila
                  </Button>
                </div>
                {foods.length === 0 ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Primero crea alimentos en la pestaña «Alimentos» para poder armar porciones.
                  </p>
                ) : null}
                <div className="flex flex-col gap-3">
                  {planItems.map((it, index) => (
                    <div
                      key={`${it.food_id}-${index}`}
                      className="rounded-xl border border-border/70 bg-muted/10 p-3 dark:border-white/[0.08]"
                    >
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                          Toma
                          <Input value={it.meal} onChange={(e) => patchItem(index, { meal: e.target.value })} />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                          Porción (g)
                          <Input
                            inputMode="decimal"
                            value={String(it.portion_grams)}
                            onChange={(e) => patchItem(index, { portion_grams: Number(e.target.value) })}
                          />
                        </label>
                      </div>
                      <label className="mt-2 flex flex-col gap-1 text-xs font-medium text-foreground">
                        Alimento
                        <Select
                          value={it.food_id}
                          onChange={(e) => patchItem(index, { food_id: e.target.value })}
                        >
                          <option value="">Seleccionar…</option>
                          {foods.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({Number(f.kcal_per_100g)} kcal/100g)
                            </option>
                          ))}
                        </Select>
                      </label>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          className="text-xs font-medium text-destructive hover:underline"
                          onClick={() => removePlanItem(index)}
                        >
                          Quitar fila
                        </button>
                      </div>
                    </div>
                  ))}
                  {planItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Puedes guardar un plan solo con rango y sin ítems; suele ser más útil añadir por lo menos una toma.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-8 flex gap-2 border-t border-border pt-5">
                <Button type="button" variant="secondary" className="flex-1" onClick={closePlanPanel} disabled={planSaving}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1" loading={planSaving}>
                  Guardar plan
                </Button>
              </div>
            </form>
          </aside>
        </>
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
            ? `Se eliminará «${deleteFood.name}». No podrá estar referenciado en planes alimenticios.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteFoodLoading}
        onCancel={() => !deleteFoodLoading && setDeleteFood(null)}
        onConfirm={onConfirmDeleteFood}
      />

      <ConfirmDialog
        open={deletePlan !== null}
        title="Eliminar plan alimenticio"
        description={
          deletePlan
            ? `Se eliminará «${deletePlan.name}». Solo si ninguna dieta lo tiene enlazado.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deletePlanLoading}
        onCancel={() => !deletePlanLoading && setDeletePlan(null)}
        onConfirm={onConfirmDeletePlan}
      />
    </div>
  );
}
