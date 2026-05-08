import { CmsBreadcrumb, type Crumb } from '@/components/cms/CmsBreadcrumb';

type CmsListPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  crumbs: Crumb[];
};

export function CmsListPageHero({ eyebrow, title, description, crumbs }: CmsListPageHeroProps) {
  return (
    <section className="border-b border-border bg-gradient-to-br from-brand-500/[0.07] via-muted/25 to-background dark:from-brand-500/10 dark:via-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <CmsBreadcrumb items={crumbs} className="mb-5" />
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-800 dark:text-brand-300">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
      </div>
    </section>
  );
}
