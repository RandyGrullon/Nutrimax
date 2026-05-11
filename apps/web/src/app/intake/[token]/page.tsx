import { getIntakeTokenByValue } from '@/lib/server/client-intake-server';
import { getClientById } from '@/lib/server/clients-server';
import { listFoodCategories } from '@/lib/server/food-categories-server';
import { listFoodsWithCategories } from '@/lib/server/foods-server';
import { IntakeFormClient } from './IntakeFormClient';

export const runtime = 'nodejs';

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token: tokenValue } = await params;

  try {
    const tokenRow = await getIntakeTokenByValue(tokenValue);
    const client = await getClientById(tokenRow.client_id);
    const categories = await listFoodCategories();
    const foods = await listFoodsWithCategories();

    return (
      <main className="min-h-screen bg-background">
        <IntakeFormClient 
          token={tokenValue} 
          clientName={client.full_name} 
          categories={categories}
          foods={foods}
        />
      </main>
    );
  } catch (e: unknown) {
    const err = e as { message?: string };
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl border border-border shadow-xl text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Enlace no disponible</h1>
          <p className="text-muted-foreground mb-6">
            {err.message || 'Este enlace no es válido, ha caducado o ya ha sido utilizado.'}
          </p>
          <p className="text-sm text-muted-foreground italic">
            Por favor, solicita un nuevo enlace a tu nutricionista si necesitas completar el formulario.
          </p>
        </div>
      </main>
    );
  }
}
