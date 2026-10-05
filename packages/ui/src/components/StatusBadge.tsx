import type { WaitlistStatus } from '@nexa/types';

import { cn } from '../utils/cn';

const config: Record<WaitlistStatus, { label: string; className: string }> = {
  waiting: { label: 'Esperando', className: 'bg-secondary/15 text-secondary-dark' },
  notified: { label: 'Avisado', className: 'bg-primary/15 text-primary-dark' },
  seated: { label: 'Sentado', className: 'bg-secondary/25 text-secondary-dark' },
  no_show: { label: 'No-show', className: 'bg-error/10 text-error' },
  cancelled: { label: 'Cancelado', className: 'bg-black/5 text-muted' },
};

export interface StatusBadgeProps {
  status: WaitlistStatus;
  className?: string;
}

/** Pill badge for a waitlist entry status, with es-MX labels. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: statusClass } = config[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 font-body text-xs font-semibold',
        statusClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
