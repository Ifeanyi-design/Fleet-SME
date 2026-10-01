import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Failure state for a data region — style.md §6.7 empty-state geometry with a retry
 * affordance, so every screen has a recovery path instead of a blank panel.
 */

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. Check your connection and try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card flush className={cn('overflow-hidden', className)}>
      <div
        role="alert"
        className="flex flex-col items-center justify-center px-6 py-14 text-center"
      >
        <span
          className="mb-4 grid size-12 place-items-center rounded-full bg-red-100 text-red-700"
          aria-hidden
        >
          <AlertTriangle className="size-6" />
        </span>
        <p className="text-sm font-semibold text-ink-primary">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-secondary">{description}</p>
        {onRetry && (
          <Button
            variant="secondary"
            className="mt-5"
            leftIcon={<RotateCw className="size-4" />}
            onClick={onRetry}
          >
            Try again
          </Button>
        )}
      </div>
    </Card>
  );
}
