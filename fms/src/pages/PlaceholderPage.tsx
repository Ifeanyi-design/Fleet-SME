import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';
import { PageHeader, type Breadcrumb } from '@/components/layouts/PageHeader';
import { Card } from '@/components/ui/Card';

/**
 * Placeholder for a screen whose data sections are not built yet.
 * `phase` is explicit so the copy never goes stale as the roadmap moves on.
 */
export interface PlaceholderPageProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  icon?: LucideIcon;
  /** Roadmap phase this screen is scheduled for, e.g. "Phase 5". */
  phase?: string;
  /** Planned sections, listed so the screen communicates its intent. */
  planned?: string[];
}

export function PlaceholderPage({
  title,
  description,
  breadcrumbs,
  icon: Icon = Construction,
  phase,
  planned = [],
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-brand-100 text-brand-700">
          <Icon className="size-6" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-ink-primary">
          {phase ? `Scheduled for ${phase}` : 'Not built yet'}
        </p>
        <p className="mt-1 max-w-md text-sm text-ink-secondary">
          The layout shell, navigation, and design system are live. This screen&apos;s data
          sections are built later in the roadmap.
        </p>
        {planned.length > 0 && (
          <ul className="mt-5 w-full max-w-md space-y-2 text-left">
            {planned.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 rounded-chip bg-surface-sunken px-3 py-2 text-[13px] text-ink-body"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
