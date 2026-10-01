import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * style.md §6.2 — card / surface.
 * Visual upgrade: stronger border token, layered shadow, and a more pronounced interactive
 * hover lift with a subtle brand ring — inspired by Cureer / NexaFleet card treatment.
 * `interactive` adds the hover lift; static panels keep a flat shadow.
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
        /* ── Base surface ─────────────────────────────────────────────────────
           border-hairline/strong gives a crisper edge vs the default subtle line;
           shadow-md replaces shadow-card so panels already feel elevated at rest. */
        'rounded-card border border-hairline/80 bg-surface shadow-md',
        !flush && 'p-5',
        /* ── Interactive lift ─────────────────────────────────────────────────
           -translate-y-1 (4 px) is more perceptible than the old 0.5 (2 px);
           ring-1 ring-brand-500/10 adds a whisper-thin brand halo on hover. */
        interactive &&
          'cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1 hover:border-hairline-hover hover:shadow-lg hover:ring-1 hover:ring-brand-500/10',
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
    /* tracking-[-0.02em] tightens the letter-spacing for a more modern
       display headline feel (matches NexaFleet / Cureer card headers). */
    <h3
      className={cn('text-base font-semibold tracking-[-0.02em] text-ink-primary', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  /* text-ink-secondary (not ink-body) creates clearer label-vs-body hierarchy */
  return <p className={cn('mt-0.5 text-[13px] text-ink-secondary', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    /* border-hairline/strong (vs default) gives the footer a more defined separator */
    <div
      className={cn('flex items-center gap-3 border-t border-hairline pt-4', className)}
      {...props}
    />
  );
}
