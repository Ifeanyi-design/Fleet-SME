import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

/** Confirmation dialog for destructive / irreversible actions (style.md §6.1). */

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: AlertDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5">
        {variant === 'destructive' && (
          <span
            className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-700')}
            aria-hidden
          >
            <AlertTriangle className="size-5" />
          </span>
        )}
        <p className="text-sm text-ink-body">
          {description ?? 'This action cannot be undone.'}
        </p>
      </div>
    </Dialog>
  );
}
