import type { ReactNode } from 'react';

import { cn } from '../utils/cn';
import { Card } from './Card';

export type StatTrend = 'up' | 'down' | 'neutral';

export interface StatCardProps {
  label: string;
  /** Preformatted for display; this component does no number formatting. */
  value: ReactNode;
  icon?: ReactNode;
  /** Comparison against the previous period, e.g. "-2 min vs ayer". */
  delta?: string;
  /**
   * Direction of the delta. Note this is the direction of *change*, not whether
   * it is good news: falling wait times and falling covers share `down`, so
   * callers pass `tone` when the two differ.
   */
  trend?: StatTrend;
  /** Colour of the delta. Defaults to neutral rather than guessing. */
  tone?: 'positive' | 'negative' | 'neutral';
  /**
   * Shown instead of the value when there is too little data to be meaningful.
   * A lifetime average over three entries is worse than no number at all.
   */
  hint?: string;
  className?: string;
}

const arrows: Record<StatTrend, string> = { up: '↑', down: '↓', neutral: '→' };

const toneClasses = {
  positive: 'text-secondary-dark',
  negative: 'text-error',
  neutral: 'text-muted',
} as const;

/** Single KPI tile: label, value and an optional period-over-period delta. */
export function StatCard({
  label,
  value,
  icon,
  delta,
  trend = 'neutral',
  tone = 'neutral',
  hint,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-muted">{label}</span>
        {icon && (
          <span aria-hidden="true" className="text-muted">
            {icon}
          </span>
        )}
      </div>

      {hint ? (
        <span className="font-body text-sm text-muted">{hint}</span>
      ) : (
        <span className="font-display text-3xl font-bold text-primary-dark">{value}</span>
      )}

      {delta && !hint && (
        <span className={cn('font-body text-xs font-semibold', toneClasses[tone])}>
          <span aria-hidden="true">{arrows[trend]} </span>
          {delta}
        </span>
      )}
    </Card>
  );
}
