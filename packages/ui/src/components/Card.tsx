import type { HTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export type CardProps = HTMLAttributes<HTMLDivElement>;

/** Soft, rounded surface with an ambient shadow. */
export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-xl bg-surface p-6 shadow-soft', className)} {...props} />;
}
