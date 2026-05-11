'use client';

import { useCallback, useState, useEffect } from 'react';
import { Link, ClipboardCopy, Loader2, CheckCircle2, AlertCircle, ExternalLink, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiFetch, apiJson } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/lib/errors';
import { cn } from '@/lib/cn';

interface IntakeToken {
  token: string;
  status: 'pending' | 'completed' | 'expired';
  expires_at: string;
  completed_at: string | null;
  preferences_data: unknown;
}

export function ClientIntakeManager({ clientId }: { clientId: string }) {
  const [token, setToken] = useState<IntakeToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<IntakeToken | null>(`/clients/${clientId}/intake`);
      setToken(data);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate() {
    setCreating(true);
    try {
      const res = await apiFetch(`/clients/${clientId}/intake`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al crear el link');
      const data = await res.json();
      setToken(data);
      showSuccessToast('Link generado correctamente.');
    } catch {
      showErrorToast('No se pudo generar el link.');
    } finally {
      setCreating(false);
    }
  }

  function copyLink() {
    if (!token) return;
    const url = `${window.location.origin}/intake/${token.token}`;
    void navigator.clipboard.writeText(url);
    showSuccessToast('Enlace copiado al portapapeles.');
  }

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const isPending = token?.status === 'pending';
  const isCompleted = token?.status === 'completed';
  const isExpired = token?.status === 'expired';

  return (
    <div className="space-y-4">
      {!token || isExpired ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            {isExpired ? 'El enlace anterior ha caducado.' : 'No hay ningún formulario de preferencias activo para este paciente.'}
          </p>
          <Button type="button" variant="secondary" className="gap-2" loading={creating} onClick={() => void onCreate()}>
            <Link className="h-3.5 w-3.5" />
            Generar nuevo link de onboarding
          </Button>
        </div>
      ) : (
        <div className={cn(
          "rounded-xl border p-4 space-y-3",
          isPending ? "bg-brand-500/[0.03] border-brand-500/20" : "bg-emerald-500/[0.03] border-emerald-500/20"
        )}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isPending ? <AlertCircle className="h-4 w-4 text-brand-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {isPending ? 'Pendiente de envío' : 'Completado'}
              </span>
            </div>
            {isPending && (
              <span className="text-[10px] text-muted-foreground">
                Expira: {new Date(token.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {isPending ? (
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1 gap-2 text-[11px]" onClick={copyLink}>
                <ClipboardCopy className="h-3.5 w-3.5" />
                Copiar link
              </Button>
              <Button 
                href={`/intake/${token.token}`} 
                variant="secondary" 
                className="flex-1 gap-2 text-[11px]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Previsualizar
              </Button>
            </div>
          ) : (
             <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground italic">
                  Enviado el {new Date(token.completed_at!).toLocaleString()}
                </p>
                <Button type="button" variant="secondary" className="w-full gap-2 text-[11px]" onClick={() => void onCreate()}>
                  Generar nuevo link (resetear)
                </Button>
             </div>
          )}
        </div>
      )}

      {isCompleted && !!token.preferences_data && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Alimentos preferidos
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(token.preferences_data as Record<string, { id: string; name: string }[]>).map(
              ([catName, foods]) => (
                <div key={catName} className="w-full">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{catName}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {foods.map((f) => (
                      <span
                        key={f.id}
                        className="rounded-md bg-background border border-border px-2 py-0.5 text-[11px] text-foreground"
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
