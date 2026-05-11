'use client';

import { useState } from 'react';
import { Check, ChevronRight, Salad, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { showErrorToast, showSuccessToast } from '@/lib/errors';

interface Food {
  id: string;
  name: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface IntakeFormClientProps {
  token: string;
  clientName: string;
  categories: Category[];
  foods: Food[];
}

export function IntakeFormClient({ token, clientName, categories, foods }: IntakeFormClientProps) {
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'welcome' | 'form' | 'success'>('welcome');
  const [submitting, setSubmitting] = useState(false);

  const foodsByCategory = categories.map(cat => ({
    ...cat,
    foods: foods.filter(f => f.category_id === cat.id)
  })).filter(c => c.foods.length > 0);

  function toggleFood(id: string) {
    const next = new Set(selectedFoodIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFoodIds(next);
  }

  async function onSubmit() {
    if (selectedFoodIds.size === 0) {
      showErrorToast('Por favor, selecciona al menos algunos alimentos.');
      return;
    }

    setSubmitting(true);
    try {
      const preferences: Record<string, { id: string, name: string }[]> = {};
      
      foodsByCategory.forEach(cat => {
        const selectedInCat = cat.foods.filter(f => selectedFoodIds.has(f.id));
        if (selectedInCat.length > 0) {
          preferences[cat.name] = selectedInCat.map(f => ({ id: f.id, name: f.name }));
        }
      });

      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, preferences }),
      });

      if (!res.ok) throw new Error('Error al enviar');
      
      setStep('success');
      showSuccessToast('Formulario enviado con éxito.');
    } catch {
      showErrorToast('Hubo un error al enviar tus preferencias. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center mb-6">
          <Salad className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">¡Hola, {clientName}!</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Para que tu plan de nutrición sea lo más efectivo y agradable posible, necesitamos conocer tus preferencias alimentarias.
          En el siguiente paso, selecciona los alimentos que sueles consumir o que te gustaría incluir en tu dieta.
        </p>
        <Button className="h-14 px-8 text-lg gap-2 rounded-2xl" onClick={() => setStep('form')}>
          Empezar cuestionario
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">¡Muchas gracias!</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Tus preferencias han sido enviadas correctamente a tu nutricionista. 
          Pronto recibirás noticias sobre tu plan personalizado.
        </p>
        <p className="text-sm text-muted-foreground italic">Ya puedes cerrar esta ventana.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12 border-b border-border pb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-5 h-5 text-brand-600" />
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-600">Preferencias Alimentarias</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Selecciona lo que sueles comer</h2>
        <p className="text-muted-foreground mt-2">Marca todos los alimentos que forman parte de tu rutina o te gustan.</p>
      </header>

      <div className="space-y-12 pb-32">
        {foodsByCategory.map((category) => (
          <section key={category.id} className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 border-l-4 border-brand-500 pl-3">
              {category.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.foods.map((food) => {
                const isSelected = selectedFoodIds.has(food.id);
                return (
                  <button
                    key={food.id}
                    onClick={() => toggleFood(food.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 group",
                      isSelected 
                        ? "bg-brand-500/10 border-brand-500 shadow-sm" 
                        : "bg-card border-border hover:border-brand-500/50 hover:bg-brand-500/[0.02]"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      isSelected ? "text-brand-700" : "text-foreground"
                    )}>
                      {food.name}
                    </span>
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-brand-500 border-brand-500" 
                        : "border-border group-hover:border-brand-500/50"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {selectedFoodIds.size} {selectedFoodIds.size === 1 ? 'alimento seleccionado' : 'alimentos seleccionados'}
            </p>
            <p className="text-xs text-muted-foreground">Tu nutricionista usará esto para tu plan.</p>
          </div>
          <Button 
            className="w-full sm:w-auto h-12 px-10 rounded-xl gap-2" 
            loading={submitting}
            onClick={() => void onSubmit()}
          >
            Enviar mis preferencias
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
