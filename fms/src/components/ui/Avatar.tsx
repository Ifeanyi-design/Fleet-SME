import { cn } from '@/lib/cn';
import { initials } from '@/lib/formatters';

/** style.md §6.4 — avatars are always rounded-full. */

export type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE: Record<AvatarSize, string> = {
  sm: 'size-8 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
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
        'inline-grid shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700',
        SIZE[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
