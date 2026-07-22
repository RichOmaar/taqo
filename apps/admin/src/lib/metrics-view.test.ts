import type { RestaurantMetrics } from '@nexa/types';
import { describe, expect, it } from 'vitest';

import { hasNoActivity, toMetricViews } from './metrics-view';

const BUSY: RestaurantMetrics = {
  averageWaitMinutes: 18,
  seatedCount: 42,
  peopleJoined: 12,
  noShowRate: 0.04,
  seatedConversion: 0.92,
  resolvedCount: 50,
  averageRating: 4.6,
  reviewCount: 9,
};

const EMPTY: RestaurantMetrics = {
  averageWaitMinutes: null,
  seatedCount: 0,
  peopleJoined: 0,
  noShowRate: 0,
  seatedConversion: 0,
  resolvedCount: 0,
  averageRating: null,
  reviewCount: 0,
};

/** The view for a given label. */
function view(metrics: RestaurantMetrics, label: string) {
  const found = toMetricViews(metrics).find((item) => item.label === label);
  if (!found) throw new Error(`no metric labelled ${label}`);
  return found;
}

describe('toMetricViews', () => {
  it('formats every metric when there is enough data', () => {
    const views = toMetricViews(BUSY);

    expect(views.every((item) => item.hint === undefined)).toBe(true);
    expect(view(BUSY, 'Espera promedio').value).toBe('18 min');
    expect(view(BUSY, 'Tasa de no-show').value).toBe('4%');
    expect(view(BUSY, 'Rating promedio').value).toBe('4.6 ⭐');
  });

  it('hides a rate computed from nothing', () => {
    // "0%" from zero resolved entries reads as flawless, not as empty.
    expect(view(EMPTY, 'Tasa de no-show').hint).toBe('Sin datos aún');
    expect(view(EMPTY, 'Conversión anotado → sentado').hint).toBe('Sin datos aún');
  });

  it('flags a sample too small to trust, and says how small', () => {
    const thin = { ...BUSY, resolvedCount: 3 };

    expect(view(thin, 'Tasa de no-show').hint).toBe('Pocos datos (3)');
  });

  it('reports each metric against its own denominator', () => {
    // Plenty of covers, barely any reviews: only the rating is unreliable.
    const fewReviews = { ...BUSY, reviewCount: 2 };

    expect(view(fewReviews, 'Rating promedio').hint).toBe('Pocos datos (2)');
    expect(view(fewReviews, 'Tasa de no-show').hint).toBeUndefined();
  });

  it('treats people today as a fact, not a sample', () => {
    // Zero covers so far today is real information, not missing data.
    const today = view(EMPTY, 'Personas hoy');

    expect(today.value).toBe('0');
    expect(today.hint).toBeUndefined();
  });

  it('does not flag a sample exactly at the threshold', () => {
    const atThreshold = { ...BUSY, resolvedCount: 5 };

    expect(view(atThreshold, 'Tasa de no-show').hint).toBeUndefined();
  });
});

describe('comparison against the previous window', () => {
  it('reads a shorter wait as an improvement', () => {
    const slower = { ...BUSY, averageWaitMinutes: 25 };

    const now = toMetricViews(BUSY, slower).find((m) => m.label === 'Espera promedio');

    expect(now).toMatchObject({ trend: 'down', tone: 'positive' });
    expect(now?.delta).toContain('7 min');
  });

  it('reads a longer wait as a regression', () => {
    const faster = { ...BUSY, averageWaitMinutes: 12 };

    expect(toMetricViews(BUSY, faster).find((m) => m.label === 'Espera promedio')).toMatchObject({
      trend: 'up',
      tone: 'negative',
    });
  });

  it('reads the same rise oppositely for a metric where up is good', () => {
    // The direction of change is identical; only the verdict differs.
    const fewer = { ...BUSY, peopleJoined: 5 };

    expect(toMetricViews(BUSY, fewer).find((m) => m.label === 'Personas hoy')).toMatchObject({
      trend: 'up',
      tone: 'positive',
    });
  });

  it('treats more no-shows as bad news', () => {
    const cleaner = { ...BUSY, noShowRate: 0.01 };

    expect(toMetricViews(BUSY, cleaner).find((m) => m.label === 'Tasa de no-show')).toMatchObject({
      trend: 'up',
      tone: 'negative',
    });
  });

  it('says so plainly when nothing moved', () => {
    expect(toMetricViews(BUSY, BUSY).find((m) => m.label === 'Espera promedio')).toMatchObject({
      delta: 'Sin cambio',
      tone: 'neutral',
    });
  });

  it('omits the comparison when there is no previous window', () => {
    expect(toMetricViews(BUSY).every((m) => m.delta === undefined)).toBe(true);
  });

  it('omits it when the previous window was empty', () => {
    // "+18 min vs. nothing" is arithmetic, not information.
    const view = toMetricViews(BUSY, EMPTY).find((m) => m.label === 'Espera promedio');

    expect(view?.delta).toBeUndefined();
  });

  it('compares each metric against its own previous denominator', () => {
    // Plenty of covers before, no reviews: only the rating lacks a comparison.
    const previous = { ...BUSY, reviewCount: 0, averageRating: null };
    const views = toMetricViews(BUSY, previous);

    expect(views.find((m) => m.label === 'Rating promedio')?.delta).toBeUndefined();
    expect(views.find((m) => m.label === 'Tasa de no-show')?.delta).toBeDefined();
  });
});

describe('hasNoActivity', () => {
  it('is true for a restaurant with nothing recorded', () => {
    expect(hasNoActivity(EMPTY)).toBe(true);
  });

  it('is false once anyone has joined today', () => {
    expect(hasNoActivity({ ...EMPTY, peopleJoined: 1 })).toBe(false);
  });

  it('is false when history exists even on a quiet day', () => {
    expect(hasNoActivity({ ...EMPTY, resolvedCount: 20 })).toBe(false);
  });
});
