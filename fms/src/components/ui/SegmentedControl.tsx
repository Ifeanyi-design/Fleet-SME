import { cn } from '@/lib/cn';

/** Segmented control — active pill is solid dark (style.md §7.2). */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-control border border-hairline bg-surface-sunken p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'whitespace-nowrap rounded-chip px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 ease-out',
              active
                ? 'bg-ink-primary text-white'
                : 'text-ink-secondary hover:bg-white hover:text-ink-primary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
