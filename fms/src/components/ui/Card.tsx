import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * style.md §6.2 — card / surface.
 * `interactive` adds the hover lift (shadow-sm → shadow-md, 2px translate) used on
 * clickable cards; static panels keep a flat shadow.
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  /** Remove default padding (e.g. for table containers). */
  flush?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, flush = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-card border border-hairline bg-surface shadow-card',
        !flush && 'p-5',
        interactive &&
          'cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-hairline-hover hover:shadow-md',
        className,
      )}
      {...props}
    />
  );
});

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 pb-4', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold tracking-[-0.01em] text-ink-primary', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[13px] text-ink-secondary', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-3 border-t border-hairline pt-4', className)}
      {...props}
    />
  );
}
