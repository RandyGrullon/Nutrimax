import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-white shadow-sm hover:bg-brand-800 focus-visible:ring-brand-600 disabled:opacity-60 dark:bg-brand-600 dark:hover:bg-brand-500',
  secondary:
    'border border-border bg-card text-foreground shadow-card hover:bg-muted dark:shadow-card-dark',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger:
    'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90 disabled:opacity-60',
};

const baseClass =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  href?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', loading, disabled, children, type = 'button', href, ...rest },
  ref,
) {
  const cls = cn(baseClass, variantClass[variant], className);
  const content =
    loading ? (
      <span className="inline-flex items-center gap-2" aria-busy>
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
        {children}
      </span>
    ) : (
      children
    );

  if (href) {
    return (
      <Link href={href} className={cls} aria-disabled={disabled || loading}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cls}
      disabled={disabled || loading}
      {...rest}
    >
      {content}
    </button>
  );
});
