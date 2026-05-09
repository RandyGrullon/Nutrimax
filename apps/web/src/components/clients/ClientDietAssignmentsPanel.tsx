'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  ClipboardPlus,
  Eye,
  LibraryBig,
  Pencil,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/cms/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/cn';

export type DietOption = { id: string; name: string };

export type ClientAssignmentRow = {
  id: string;
  diet_id: string;
  diet_name: string;
  status: string;
  notes?: string | null;
  starts_on?: string | null;
  created_at?: string | null;
};

function toDateInputValue(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  if (s.length >= 10) return s.slice(0, 10);
  return '';
}

export function ClientDietAssignmentsPanel({
  clientId,
  diets,
  assignments: initialAssignments,
}: {
  clientId: string;
  diets: DietOption[];
  assignments: ClientAssignmentRow[];
}) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignQuery, setAssignQuery] = useState('');
  const [dietId, setDietId] = useState('');
  const [notes, setNotes] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const [editTarget, setEditTarget] = useState<ClientAssignmentRow | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStartsOn, setEditStartsOn] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState<ClientAssignmentRow | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  /** Dietas con asignación activa en este paciente (no se pueden volver a asignar hasta archivar). */
  const activeDietIds = useMemo(() => {
    const s = new Set<string>();
    for (const a of initialAssignments) {
      if (String(a.status).toLowerCase() === 'active') s.add(a.diet_id);
    }
    return s;
  }, [initialAssignments]);

  const filteredDiets = useMemo(() => {
    const q = assignQuery.trim().toLowerCase();
    if (!q) return diets;
    return diets.filter((d) => d.name.toLowerCase().includes(q));
  }, [diets, assignQuery]);

  const selectableInFilter = useMemo(
    () => filteredDiets.filter((d) => !activeDietIds.has(d.id)),
    [filteredDiets, activeDietIds],
  );

  useEffect(() => {
    if (dietId && activeDietIds.has(dietId)) setDietId('');
  }, [dietId, activeDietIds]);

  function openEditAssignment(a: ClientAssignmentRow) {
    setEditNotes(a.notes ? String(a.notes) : '');
    setEditStartsOn(toDateInputValue(a.starts_on));
    setEditTarget(a);
  }

  async function onAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!dietId) {
      showErrorToast('Selecciona una dieta de la lista.');
      return;
    }
    if (activeDietIds.has(dietId)) {
      showErrorToast('Esta dieta ya está activa para este paciente. Archiva la asignación o elige otra.');
      return;
    }
    setAssignLoading(true);
    try {
      const res = await apiFetch('/assignments', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          diet_id: dietId,
          notes: notes.trim() || undefined,
          starts_on: startsOn.trim() || undefined,
        }),
      });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Dieta asignada correctamente.');
      setNotes('');
      setStartsOn('');
      setDietId('');
      setAssignQuery('');
      setAssignOpen(false);
      router.refresh();
    } catch {
      showErrorToast('No pudimos asignar la dieta.');
    } finally {
      setAssignLoading(false);
    }
  }

  async function onSaveEdit() {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const res = await apiFetch(`/assignments/${editTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          notes: editNotes.trim() || null,
          starts_on: editStartsOn.trim() || null,
        }),
      });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Asignación actualizada.');
      setEditTarget(null);
      router.refresh();
    } catch {
      showErrorToast('No pudimos guardar los cambios.');
    } finally {
      setEditLoading(false);
    }
  }

  async function onConfirmArchive() {
    if (!archiveTarget) return;
    setArchiveLoading(true);
    try {
      const res = await apiFetch(`/assignments/${archiveTarget.id}/archive`, { method: 'POST' });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Asignación archivada.');
      setArchiveTarget(null);
      router.refresh();
    } catch {
      showErrorToast('No pudimos archivar la asignación.');
    } finally {
      setArchiveLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAssignOpen((v) => !v)}
          className={cn(
            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-foreground shadow-sm transition',
            assignOpen
              ? 'border-brand-600 bg-brand-600/15 text-brand-800 dark:border-brand-400 dark:bg-brand-500/20 dark:text-brand-200'
              : 'border-border/80 bg-card hover:bg-muted/80 dark:border-white/[0.08]',
          )}
          aria-expanded={assignOpen}
          aria-label={assignOpen ? 'Cerrar formulario de asignación' : 'Asignar dieta'}
          title={assignOpen ? 'Cerrar asignación' : 'Asignar dieta desde la biblioteca'}
        >
          <ClipboardPlus className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {assignOpen ? (
        <form
          onSubmit={onAssign}
          className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/15 p-4 dark:border-white/[0.08]"
        >
          {diets.length === 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>No hay dietas en la biblioteca.</span>
              <Button href="/diets" variant="ghost" className="h-auto px-2 py-1 text-sm font-medium">
                Ir a Dietas
              </Button>
            </div>
          ) : (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                <span className="inline-flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
                  Buscar en la biblioteca
                </span>
                <Input
                  value={assignQuery}
                  onChange={(e) => setAssignQuery(e.target.value)}
                  placeholder="Nombre del plan…"
                  aria-label="Filtrar dietas por nombre"
                />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Elegir plan *</span>
                <p className="text-xs text-muted-foreground">
                  Busca y pulsa una fila. Las marcadas como «ya activa» no se pueden asignar de nuevo hasta archivar la
                  asignación.
                </p>
                <div
                  className="max-h-52 overflow-y-auto rounded-xl border border-border/80 bg-card/50 dark:border-white/[0.08]"
                  role="listbox"
                  aria-label="Planes de la biblioteca"
                >
                  {filteredDiets.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                      Ninguna dieta coincide con la búsqueda.
                    </p>
                  ) : (
                    filteredDiets.map((d) => {
                      const blocked = activeDietIds.has(d.id);
                      const selected = dietId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          disabled={blocked}
                          onClick={() => {
                            if (!blocked) setDietId(d.id);
                          }}
                          className={cn(
                            'flex w-full flex-col items-start gap-0.5 border-b border-border/60 px-3 py-2.5 text-left text-sm last:border-0',
                            blocked
                              ? 'cursor-not-allowed bg-muted/20 opacity-70'
                              : 'hover:bg-muted/40',
                            selected && !blocked ? 'bg-brand-600/10 dark:bg-brand-500/15' : '',
                          )}
                        >
                          <span className="font-medium text-foreground">{d.name}</span>
                          {blocked ? (
                            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                              Ya asignada activa · archiva antes de volver a elegirla
                            </span>
                          ) : selected ? (
                            <span className="text-[11px] font-medium text-brand-700 dark:text-brand-300">
                              Seleccionada para asignar
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Pulsa para seleccionar</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
                {filteredDiets.length > 0 && selectableInFilter.length === 0 ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Todas las dietas que coinciden con «{assignQuery.trim()}» ya están activas. Archiva una o amplía la
                    búsqueda.
                  </p>
                ) : null}
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Inicio (opcional)
                <Input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Notas (opcional)
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones para esta persona…" />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)} disabled={assignLoading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={assignLoading || !dietId || activeDietIds.has(dietId)}
                  loading={assignLoading}
                >
                  Asignar
                </Button>
              </div>
            </>
          )}
        </form>
      ) : null}

      <ul className="flex flex-col gap-2 border-t border-border pt-4">
        {initialAssignments.map((a) => {
          const active = String(a.status).toLowerCase() === 'active';
          return (
            <li
              key={String(a.id)}
              className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/15 px-3 py-3 text-sm dark:border-white/[0.08]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{String(a.diet_name)}</span>
                  <span className="ml-2 inline-block rounded-md bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {String(a.status)}
                  </span>
                  {a.starts_on ? (
                    <p className="mt-1 text-xs text-muted-foreground">Inicio: {toDateInputValue(a.starts_on)}</p>
                  ) : null}
                  {a.notes ? (
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{String(a.notes)}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {active ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 gap-1 px-2 text-xs"
                        onClick={() => openEditAssignment(a)}
                        title="Editar asignación"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Asignación
                      </Button>
                      <Button
                        href={`/diets/${encodeURIComponent(String(a.diet_id))}`}
                        variant="secondary"
                        className="h-8 gap-1 px-2 text-xs"
                        title="Ver el plan (solo lectura)"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        Ver
                      </Button>
                      <Button
                        href={`/diets?edit=${encodeURIComponent(String(a.diet_id))}`}
                        variant="secondary"
                        className="h-8 gap-1 px-2 text-xs"
                        title="Editar el plan en la biblioteca"
                      >
                        <LibraryBig className="h-3.5 w-3.5" aria-hidden />
                        Editar plan
                      </Button>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-transparent px-2 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                        onClick={() => setArchiveTarget(a)}
                        title="Archivar asignación"
                      >
                        <Archive className="h-3.5 w-3.5" aria-hidden />
                        Quitar
                      </button>
                    </>
                  ) : (
                    <Button
                      href={`/diets/${encodeURIComponent(String(a.diet_id))}`}
                      variant="ghost"
                      className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      Ver plan
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {initialAssignments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin asignaciones todavía. Pulsa el icono de asignar para añadir una.</p>
      ) : null}

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Archivar asignación"
        description={
          archiveTarget
            ? `La asignación de «${archiveTarget.diet_name}» pasará a archivada. El plan seguirá en la biblioteca; solo deja de estar activo para este paciente.`
            : ''
        }
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={archiveLoading}
        onCancel={() => !archiveLoading && setArchiveTarget(null)}
        onConfirm={onConfirmArchive}
      />

      {editTarget ? (
        <div
          className="fixed inset-0 z-[60] flex max-h-dvh w-full items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => {
            if (!editLoading) setEditTarget(null);
          }}
        >
          <div
            className="max-h-[min(90dvh,32rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-assign-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-assign-title" className="text-lg font-semibold text-foreground">
              Editar asignación
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{editTarget.diet_name}</p>
            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Fecha de inicio
                <Input type="date" value={editStartsOn} onChange={(e) => setEditStartsOn(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Notas
                <Textarea rows={4} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => !editLoading && setEditTarget(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" loading={editLoading} onClick={() => void onSaveEdit()}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
