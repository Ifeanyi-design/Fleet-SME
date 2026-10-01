import { cn } from '@/lib/cn';
import { initials } from '@/lib/formatters';

/** style.md §6.4 — avatars are always rounded-full. */

export type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE: Record<AvatarSize, string> = {
  sm: 'size-7 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-11 text-sm',
};

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-bold tracking-tight',
        'bg-gradient-to-br from-brand-100 to-brand-200/80 text-brand-800 ring-1 ring-inset ring-brand-700/10 shadow-xs',
        SIZE[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

