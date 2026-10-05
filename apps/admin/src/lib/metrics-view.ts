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
  /** Comparison against the previous window, e.g. "-2 min vs. periodo anterior". */
  delta?: string;
  /** Direction of change, for the arrow. */
  trend?: 'up' | 'down' | 'neutral';
  /** Whether that change is good news, which depends on the metric. */
  tone?: 'positive' | 'negative' | 'neutral';
}

/**
 * How to read a rise in each metric. Shorter waits and fewer no-shows are
 * improvements; more covers and better ratings are too. The API cannot know
 * this, which is why it ships both windows and leaves the judgement here.
 */
type Direction = 'higher-is-better' | 'lower-is-better';

function sampleHint(count: number): string | undefined {
  if (count === 0) return 'Sin datos aún';
  if (count < MIN_SAMPLE) return `Pocos datos (${count})`;
  return undefined;
}

/**
 * Comparison against the previous window.
 *
 * Returns nothing when either side is missing or the previous window was empty:
 * "+100% vs. nada" is arithmetic, not information.
 */
function compare(
  current: number | null,
  previous: number | null,
  direction: Direction,
  format: (value: number) => string,
  previousSample: number,
): Pick<MetricView, 'delta' | 'trend' | 'tone'> {
  if (current == null || previous == null || previousSample === 0) return {};

  const difference = current - previous;
  if (difference === 0) return { delta: 'Sin cambio', trend: 'neutral', tone: 'neutral' };

  const rose = difference > 0;
  const improved = direction === 'higher-is-better' ? rose : !rose;

  return {
    delta: `${rose ? '+' : '−'}${format(Math.abs(difference))} vs. periodo anterior`,
    trend: rose ? 'up' : 'down',
    tone: improved ? 'positive' : 'negative',
  };
}

/**
 * Turns raw metrics into what the dashboard renders.
 *
 * Kept out of the component so the thin-data and comparison rules are testable
 * on their own — they are the part most likely to be wrong.
 */
export function toMetricViews(
  metrics: RestaurantMetrics,
  previous?: RestaurantMetrics,
): MetricView[] {
  const minutes = (value: number) => `${Math.round(value)} min`;
  const percent = (value: number) => formatPercent(value);
  const plain = (value: number) => String(Math.round(value));
  const rating = (value: number) => value.toFixed(1);

  return [
    {
      label: 'Espera promedio',
      value: formatWaitMinutes(metrics.averageWaitMinutes),
      hint: sampleHint(metrics.seatedCount),
      ...compare(
        metrics.averageWaitMinutes,
        previous?.averageWaitMinutes ?? null,
        'lower-is-better',
        minutes,
        previous?.seatedCount ?? 0,
      ),
    },
    {
      // A count, not a ratio: zero today is a fact, not missing data.
      label: 'Personas hoy',
      value: String(metrics.peopleJoined),
      ...compare(
        metrics.peopleJoined,
        previous?.peopleJoined ?? null,
        'higher-is-better',
        plain,
        previous?.peopleJoined ?? 0,
      ),
    },
    {
      label: 'Tasa de no-show',
      value: formatPercent(metrics.noShowRate),
      hint: sampleHint(metrics.resolvedCount),
      ...compare(
        metrics.noShowRate,
        previous?.noShowRate ?? null,
        'lower-is-better',
        percent,
        previous?.resolvedCount ?? 0,
      ),
    },
    {
      label: 'Conversión anotado → sentado',
      value: formatPercent(metrics.seatedConversion),
      hint: sampleHint(metrics.resolvedCount),
      ...compare(
        metrics.seatedConversion,
        previous?.seatedConversion ?? null,
        'higher-is-better',
        percent,
        previous?.resolvedCount ?? 0,
      ),
    },
    {
      label: 'Rating promedio',
      value: formatRating(metrics.averageRating),
      hint: sampleHint(metrics.reviewCount),
      ...compare(
        metrics.averageRating,
        previous?.averageRating ?? null,
        'higher-is-better',
        rating,
        previous?.reviewCount ?? 0,
      ),
    },
  ];
}

/** True when nothing has happened yet, so the panel can explain itself. */
export function hasNoActivity(metrics: RestaurantMetrics): boolean {
  return metrics.resolvedCount === 0 && metrics.peopleJoined === 0;
}
