import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';

/** Filter chip — active state is a solid dark pill (style.md §7.2). */
export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="group">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150',
              active
                ? 'bg-ink-primary text-white'
                : 'border border-hairline-strong bg-white text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] tabular-nums',
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-ink-muted',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Chips or other controls rendered on the right. */
  children?: ReactNode;
  className?: string;
}

/** Search + filter controls that sit above a DataTable. */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  children,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="w-full lg:max-w-xs">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          leftIcon={<Search className="size-4" />}
          rightSlot={
            search ? (
              <IconButton label="Clear search" onClick={() => onSearchChange('')}>
                <X className="size-4" />
              </IconButton>
            ) : undefined
          }
          aria-label={searchPlaceholder}
        />
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
