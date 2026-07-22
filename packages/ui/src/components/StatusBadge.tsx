import type { WaitlistStatus } from '@nexa/types';

import { cn } from '../utils/cn';

/**
 * Single source of the es-MX status wording.
 *
 * Exported because the labels are needed outside a badge too — filter menus,
 * table cells, CSV exports — and a second copy would drift.
 */
export const WAITLIST_STATUS_LABELS: Record<WaitlistStatus, string> = {
  waiting: 'Esperando',
  notified: 'Avisado',
  seated: 'Sentado',
  no_show: 'No-show',
  cancelled: 'Cancelado',
};

const config: Record<WaitlistStatus, { className: string }> = {
  waiting: { className: 'bg-secondary/15 text-secondary-dark' },
  notified: { className: 'bg-primary/15 text-primary-dark' },
  seated: { className: 'bg-secondary/25 text-secondary-dark' },
  no_show: { className: 'bg-error/10 text-error' },
  cancelled: { className: 'bg-black/5 text-muted' },
};

export interface StatusBadgeProps {
  status: WaitlistStatus;
  className?: string;
}

/** Pill badge for a waitlist entry status, with es-MX labels. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = WAITLIST_STATUS_LABELS[status];
  const { className: statusClass } = config[status];
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
