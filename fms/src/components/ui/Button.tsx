import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/** style.md §6.1 — canonical button implementations. */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

/* ── Button variants ───────────────────────────────────────────────────────────
   Upgraded with intentional visual depth:
   - primary: subtle gradient + crisp shadow with -translate-y-0.5 on hover (inspired by Quick Courier/NexaFleet)
   - secondary: clean 1px border with subtle shadow and crisp hover
   - destructive: punchy crimson accent without looking aggressive
   - ghost: subtle hover highlight for utility icons/actions
*/
const VARIANT: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-xs',
    'hover:from-brand-600 hover:to-brand-700 hover:shadow-md hover:-translate-y-0.5',
    'active:translate-y-0 active:scale-[0.98] active:shadow-xs',
  ),
  secondary: cn(
    'border border-hairline-strong bg-white text-ink-primary shadow-xs',
    'hover:bg-surface-hover hover:border-hairline-hover hover:text-ink-primary hover:shadow-sm hover:-translate-y-0.5',
    'active:translate-y-0 active:scale-[0.98]',
  ),
  ghost: cn(
    'text-ink-secondary',
    'hover:bg-surface-hover hover:text-ink-primary active:scale-[0.98]',
  ),
  destructive: cn(
    'bg-gradient-to-b from-red-500 to-state-error text-white shadow-xs',
    'hover:from-red-600 hover:to-red-700 hover:shadow-md hover:-translate-y-0.5',
    'active:translate-y-0 active:scale-[0.98]',
  ),
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 font-medium rounded-[10px]',
  md: 'h-9 px-4 text-sm gap-2 font-medium rounded-control',
  lg: 'h-10 px-5 text-[15px] gap-2.5 font-medium rounded-control',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap tracking-tight',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
