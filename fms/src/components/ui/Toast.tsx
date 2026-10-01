import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui/IconButton';

/**
 * Toast notifications — FR9 delivery-lifecycle events and mutation feedback.
 * style.md §7.2: slide-in from bottom-right, auto-dismiss ~4s.
 *
 * Animated with CSS (see index.css) rather than an animation library so the toast
 * layer — which sits at the app root — does not pull framer-motion into the initial
 * bundle (NFR7). The 200ms exit animation is driven by a `leaving` flag.
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** ms before auto-dismiss; 0 keeps it until dismissed. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastInput, 'description'>> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const EXIT_MS = 200;

const VARIANT_STYLE: Record<ToastVariant, { icon: typeof Info; accent: string }> = {
  success: { icon: CheckCircle2, accent: 'text-brand-600' },
  error: { icon: AlertCircle, accent: 'text-state-error' },
  warning: { icon: AlertTriangle, accent: 'text-amber-500' },
  info: { icon: Info, accent: 'text-state-info' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [leaving, setLeaving] = useState<string[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    // Play the exit animation, then remove from the list.
    setLeaving((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      setLeaving((prev) => prev.filter((existing) => existing !== id));
    }, EXIT_MS);
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `toast-${++counter.current}`;
      const item: ToastItem = {
        id,
        title: input.title,
        variant: input.variant ?? 'info',
        duration: input.duration ?? 4000,
        ...(input.description !== undefined ? { description: input.description } : {}),
      };
      setItems((prev) => [...prev.slice(-3), item]);
      if (item.duration > 0) {
        setTimeout(() => dismiss(id), item.duration);
      }
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => {
          const { icon: Icon, accent } = VARIANT_STYLE[item.variant];
          const isLeaving = leaving.includes(item.id);
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-card border border-hairline/90 bg-white/95 p-3.5 shadow-pop backdrop-blur-md',
                isLeaving ? 'animate-toast-out' : 'animate-toast-in',
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-50 ring-1 ring-hairline-strong">
                <Icon className={cn('size-4', accent)} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[13px] font-semibold tracking-tight text-ink-primary">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">{item.description}</p>
                )}
              </div>
              <IconButton label="Dismiss notification" size="sm" onClick={() => dismiss(item.id)}>
                <X className="size-3.5" />
              </IconButton>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}


export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>.');
  return ctx;
}
