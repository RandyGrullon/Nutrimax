'use client';

import Link from 'next/link';
import { Users, UserPlus, Salad, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

function QuickLink({ href, icon: Icon, title, description }: { href: string; icon: any; title: string; description: string }) {
  return (
    <Link href={href} className="group block rounded-2xl transition hover:opacity-[0.98]">
      <Card className="h-full border-border/70 p-0 transition group-hover:border-brand-500/40 group-hover:shadow-md dark:border-white/[0.06] dark:group-hover:border-brand-400/35">
        <CardHeader className="p-5 pb-2">
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted/80 text-brand-600 ring-1 ring-border/60 transition group-hover:scale-[1.03] group-hover:bg-brand-600/10 group-hover:text-brand-700 dark:bg-white/[0.06] dark:text-brand-400 dark:ring-white/[0.08] dark:group-hover:bg-brand-500/15">
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between px-5 pb-5 pt-0">
          <span className="text-sm font-medium text-brand-600 dark:text-brand-400">Abrir</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
        </CardContent>
      </Card>
    </Link>
  );
}

export function HomeQuickLinks() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <QuickLink href="/clients" icon={Users} title="Pacientes" description="Listado, fichas detalladas y estadísticas." />
      <QuickLink href="/clients/new" icon={UserPlus} title="Nuevo paciente" description="Asistente guiado en 9 pasos." />
      <QuickLink href="/nutrition" icon={Salad} title="Nutrición" description="Categorías, alimentos y planes base." />
      <QuickLink href="/diets" icon={UtensilsCrossed} title="Dietas" description="Biblioteca de planes y macros." />
    </div>
  );
}
