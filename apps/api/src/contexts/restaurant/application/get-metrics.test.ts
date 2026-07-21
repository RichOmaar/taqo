import type { RestaurantMetrics } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../../../shared/errors';
import type { MetricsRepository } from '../domain/metrics-repository';
import type { RestaurantRepository } from '../domain/restaurant-repository';
import { GetMetrics } from './get-metrics';

const METRICS: RestaurantMetrics = {
  averageWaitMinutes: 18,
  seatedCount: 42,
  peopleToday: 12,
  noShowRate: 0.04,
  seatedConversion: 0.92,
  resolvedCount: 50,
  averageRating: 4.6,
  reviewCount: 9,
};

function build(restaurantId: string | null) {
  const compute = vi.fn<MetricsRepository['compute']>().mockResolvedValue(METRICS);
  const restaurants = {
    findIdByCode: () => Promise.resolve(restaurantId),
  } as unknown as RestaurantRepository;

  return { compute, useCase: new GetMetrics(restaurants, { compute }) };
}

describe('GetMetrics', () => {
  it('computes metrics for the restaurant behind the code', async () => {
    const { compute, useCase } = build('r1');

    await expect(useCase.execute('DEMO')).resolves.toEqual(METRICS);
    expect(compute).toHaveBeenCalledWith('r1');
  });

  it('rejects an unknown restaurant code without computing anything', async () => {
    const { compute, useCase } = build(null);

    await expect(useCase.execute('NOPE')).rejects.toBeInstanceOf(NotFoundError);
    expect(compute).not.toHaveBeenCalled();
  });

  it('carries the sample counts through, so the dashboard can spot thin data', async () => {
    // A ratio alone cannot distinguish "0% of 200" from "0% of nothing".
    const { useCase } = build('r1');

    const result = await useCase.execute('DEMO');

    expect(result).toMatchObject({ resolvedCount: 50, reviewCount: 9, seatedCount: 42 });
  });
});
