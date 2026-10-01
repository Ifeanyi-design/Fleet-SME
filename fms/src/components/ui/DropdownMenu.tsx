import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Lightweight dropdown menu (trigger + items) with click-outside and Escape. */

export interface DropdownMenuItem {
  label: string;
  onSelect: () => void;
  selected?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  /** Accessible name for the trigger button. */
  label: string;
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  label,
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-full transition-opacity hover:opacity-85"
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute z-40 mt-2 min-w-[11rem] overflow-hidden rounded-panel border border-hairline bg-surface py-1 shadow-pop',
              align === 'right' ? 'right-0' : 'left-0',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-[13px] transition-colors',
                  item.disabled
                    ? 'cursor-not-allowed text-ink-disabled'
                    : item.danger
                      ? 'text-state-error hover:bg-red-50'
                      : 'text-ink-body hover:bg-surface-hover',
                )}
              >
                {item.label}
                {item.selected && <Check className="size-3.5 text-brand-600" aria-hidden />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
