import type { ReactNode } from 'react';
import { CmsBreadcrumb, type Crumb } from '@/components/cms/CmsBreadcrumb';

type CmsListPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  crumbs: Crumb[];
  /** Botón de ayuda (cliente) junto al título. */
  info?: ReactNode;
};

export function CmsListPageHero({ eyebrow, title, description, crumbs, info }: CmsListPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60 dark:border-white/[0.06]">
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-600/[0.12] via-violet-600/[0.06] to-transparent dark:from-brand-500/[0.14] dark:via-violet-600/[0.08]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <CmsBreadcrumb items={crumbs} className="mb-5" />
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400">
          {eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-normal tracking-tight text-foreground sm:text-[2rem] sm:leading-tight">
            {title}
          </h1>
          {info ? <span className="inline-flex items-center">{info}</span> : null}
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {description}
        </p>
      </div>
    </section>
  );
}
