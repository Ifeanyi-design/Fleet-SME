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
        'inline-flex items-center gap-1 rounded-control border border-hairline/80 bg-slate-100/70 p-1 backdrop-blur-xs',
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
              'whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[12px] font-semibold tracking-tight transition-all duration-150 ease-out',
              active
                ? 'bg-ink-primary text-white shadow-xs'
                : 'text-ink-secondary hover:bg-white/70 hover:text-ink-primary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

