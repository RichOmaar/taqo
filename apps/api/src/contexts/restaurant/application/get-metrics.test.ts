import type { RestaurantMetrics } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { TimeRange } from '../../../shared/time-range';
import type { MetricsRepository } from '../domain/metrics-repository';
import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';
import { GetMetrics } from './get-metrics';

const METRICS: RestaurantMetrics = {
  averageWaitMinutes: 18,
  seatedCount: 42,
  peopleJoined: 12,
  noShowRate: 0.04,
  seatedConversion: 0.92,
  resolvedCount: 50,
  averageRating: 4.6,
  reviewCount: 9,
};

const MEXICO = 'America/Mexico_City';

function restaurant(timezone: string): RestaurantWithQueues {
  return {
    restaurant: {
      id: 'r1',
      name: 'Bistro Moderno',
      code: 'DEMO',
      qrToken: 'demo-qr-token',
      etaBaseMinutes: 10,
      expirationMinutes: 10,
      plan: 'free',
      timezone,
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    queues: [],
  };
}

function build(options: { timezone?: string; found?: boolean; now?: string } = {}) {
  const { timezone = MEXICO, found = true, now = '2026-03-10T20:00:00Z' } = options;
  const compute = vi.fn<MetricsRepository['compute']>().mockResolvedValue(METRICS);
  const restaurants = {
    findByCode: () => Promise.resolve(found ? restaurant(timezone) : null),
  } as unknown as RestaurantRepository;

  return {
    compute,
    useCase: new GetMetrics(restaurants, { compute }, () => new Date(now)),
  };
}

/** The range the repository was asked for. */
function rangeArg(compute: ReturnType<typeof build>['compute']): TimeRange {
  const call = compute.mock.calls[0];
  if (!call) throw new Error('compute was not called');
  return call[1];
}

describe('GetMetrics', () => {
  it('defaults to the restaurant local day, not the server one', async () => {
    // 20:00Z on the 10th is 14:00 in Mexico City; that day runs 06:00Z to 06:00Z.
    const { compute, useCase } = build();

    await useCase.execute('DEMO');

    expect(rangeArg(compute).from.toISOString()).toBe('2026-03-10T06:00:00.000Z');
    expect(rangeArg(compute).to.toISOString()).toBe('2026-03-11T06:00:00.000Z');
  });

  it('uses each restaurant own zone for the same instant', async () => {
    // Same moment, a restaurant in Tokyo: already the 11th locally.
    const { compute, useCase } = build({ timezone: 'Asia/Tokyo' });

    await useCase.execute('DEMO');

    expect(rangeArg(compute).from.toISOString()).toBe('2026-03-10T15:00:00.000Z');
  });

  it('honours an explicit window', async () => {
    const { compute, useCase } = build();
    const from = new Date('2026-03-01T06:00:00Z');
    const to = new Date('2026-03-08T06:00:00Z');

    await useCase.execute('DEMO', { from, to });

    expect(rangeArg(compute)).toEqual({ from, to });
  });

  it('fills a missing end from the local day', async () => {
    const { compute, useCase } = build();
    const from = new Date('2026-03-01T06:00:00Z');

    await useCase.execute('DEMO', { from });

    expect(rangeArg(compute).from).toEqual(from);
    expect(rangeArg(compute).to.toISOString()).toBe('2026-03-11T06:00:00.000Z');
  });

  it('echoes the resolved range, since the default is server-side', async () => {
    const { useCase } = build();

    const result = await useCase.execute('DEMO');

    expect(result.range.from.toISOString()).toBe('2026-03-10T06:00:00.000Z');
    expect(result.metrics).toEqual(METRICS);
  });

  it('rejects a window that ends before it starts', async () => {
    const { compute, useCase } = build();

    await expect(
      useCase.execute('DEMO', {
        from: new Date('2026-03-08T00:00:00Z'),
        to: new Date('2026-03-01T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(compute).not.toHaveBeenCalled();
  });

  it('rejects an empty window', async () => {
    const { useCase } = build();
    const instant = new Date('2026-03-08T00:00:00Z');

    await expect(useCase.execute('DEMO', { from: instant, to: instant })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('rejects an unknown restaurant code without computing anything', async () => {
    const { compute, useCase } = build({ found: false });

    await expect(useCase.execute('NOPE')).rejects.toBeInstanceOf(NotFoundError);
    expect(compute).not.toHaveBeenCalled();
  });
});
