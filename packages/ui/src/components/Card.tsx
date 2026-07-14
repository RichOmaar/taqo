import type { HTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Enable hover lift effect. */
  hoverable?: boolean;
}

/** Soft, rounded surface with an ambient shadow. */
export function Card({ hoverable = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface p-6 shadow-soft transition-all duration-300',
        hoverable && 'hover:-translate-y-1 hover:shadow-lg cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}
