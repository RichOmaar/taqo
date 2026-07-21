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
