import type { HTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export type BadgeVariant = 'default' | 'primary' | 'success';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border border-primary text-primary bg-transparent',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-secondary text-secondary-foreground',
};

/** Small label badge for tags and status indicators. */
export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-display',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
