import type { RestaurantMetrics } from '@nexa/types';

import { formatPercent, formatRating, formatWaitMinutes } from './format';

/**
 * Below this many observations a figure is noise, so the panel says so instead
 * of printing it. Five is a judgement call, not a statistical threshold: enough
 * that a single outlier cannot define the number, low enough that a quiet
 * restaurant still sees its metrics within a day.
 */
export const MIN_SAMPLE = 5;

export interface MetricView {
  label: string;
  value: string;
  /** Set when the sample is too small to report; replaces the value. */
  hint?: string;
}

function sampleHint(count: number): string | undefined {
  if (count === 0) return 'Sin datos aún';
  if (count < MIN_SAMPLE) return `Pocos datos (${count})`;
  return undefined;
}

/**
 * Turns raw metrics into what the dashboard renders.
 *
 * Kept out of the component so the thin-data rules are testable on their own —
 * they are the part most likely to be wrong.
 */
export function toMetricViews(metrics: RestaurantMetrics): MetricView[] {
  return [
    {
      label: 'Espera promedio',
      value: formatWaitMinutes(metrics.averageWaitMinutes),
      hint: sampleHint(metrics.seatedCount),
    },
    {
      // A count, not a ratio: zero today is a fact, not missing data.
      label: 'Personas hoy',
      value: String(metrics.peopleJoined),
    },
    {
      label: 'Tasa de no-show',
      value: formatPercent(metrics.noShowRate),
      hint: sampleHint(metrics.resolvedCount),
    },
    {
      label: 'Conversión anotado → sentado',
      value: formatPercent(metrics.seatedConversion),
      hint: sampleHint(metrics.resolvedCount),
    },
    {
      label: 'Rating promedio',
      value: formatRating(metrics.averageRating),
      hint: sampleHint(metrics.reviewCount),
    },
  ];
}

/** True when nothing has happened yet, so the panel can explain itself. */
export function hasNoActivity(metrics: RestaurantMetrics): boolean {
  return metrics.resolvedCount === 0 && metrics.peopleJoined === 0;
}
