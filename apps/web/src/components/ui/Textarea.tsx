import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl border bg-card/90 px-3 py-2.5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-white/[0.08] dark:bg-card',
        error ? 'border-destructive' : 'border-border/80',
        className,
      )}
      aria-invalid={error || undefined}
      {...rest}
    />
  );
});
