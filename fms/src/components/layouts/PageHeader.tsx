import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface Breadcrumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  /** Primary/secondary action buttons, right-aligned on desktop. */
  actions?: ReactNode;
  className?: string;
}

/** Page header — one per view (style.md §3.2). */
export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center gap-1.5 text-xs text-ink-muted">
              {breadcrumbs.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
                  {crumb.to ? (
                    <Link to={crumb.to} className="transition-colors hover:text-ink-secondary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-ink-secondary">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
