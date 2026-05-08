import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Crumb = { label: string; href?: string };

export function CmsBreadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Migas de pan" className={cn('flex flex-wrap items-center gap-1 text-sm', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> : null}
            {last ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : item.href ? (
              <Link href={item.href} className="text-muted-foreground transition hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="text-muted-foreground">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
