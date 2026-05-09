import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border bg-card/90 px-3 py-2.5 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-white/[0.08] dark:bg-card',
        error ? 'border-destructive' : 'border-border/80',
        className,
      )}
      aria-invalid={error || undefined}
      {...rest}
    >
      {children}
    </select>
  );
});
