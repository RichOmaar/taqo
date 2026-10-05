import type { WaitlistStatus } from '@nexa/types';
import type { ReactNode } from 'react';

import { cn } from '../utils/cn';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

export interface WaitCardProps {
  name: string;
  partySize: number;
  status: WaitlistStatus;
  /** e.g. "12 min esperando". */
  waitingLabel?: string;
  /** e.g. "~15 min". */
  etaLabel?: string;
  /** Action buttons slot. */
  children?: ReactNode;
  className?: string;
}

/** A waiting party card used on the reception board and client screens. */
export function WaitCard({
  name,
  partySize,
  status,
  waitingLabel,
  etaLabel,
  children,
  className,
}: WaitCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3 p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-foreground">{name}</p>
          <p className="font-body text-sm text-muted">
            {partySize} {partySize === 1 ? 'persona' : 'personas'}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {(waitingLabel ?? etaLabel) && (
        <div className="flex items-center gap-4 font-body text-sm text-muted">
          {waitingLabel && <span>{waitingLabel}</span>}
          {etaLabel && <span className="font-semibold text-primary-dark">ETA {etaLabel}</span>}
        </div>
      )}

      {children && <div className="flex flex-wrap gap-2 pt-1">{children}</div>}
    </Card>
  );
}
