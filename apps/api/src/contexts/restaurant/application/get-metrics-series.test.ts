import type { MetricsSeriesPoint } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { MetricsRepository } from '../domain/metrics-repository';
import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';
import { GetMetricsSeries } from './get-metrics-series';

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

function build(options: { timezone?: string; observed?: MetricsSeriesPoint[]; now?: string } = {}) {
  const { timezone = MEXICO, observed = [], now = '2026-03-10T20:00:00Z' } = options;
  const series = vi.fn<MetricsRepository['series']>().mockResolvedValue(observed);
  const restaurants = {
    findByCode: () => Promise.resolve(restaurant(timezone)),
  } as unknown as RestaurantRepository;

  return {
    series,
    useCase: new GetMetricsSeries(restaurants, { compute: vi.fn(), series }, () => new Date(now)),
  };
}

describe('GetMetricsSeries', () => {
  it('defaults to the restaurant local day, bucketed hourly', async () => {
    const { useCase } = build();

    const result = await useCase.execute('DEMO');

    expect(result.bucket).toBe('hour');
    expect(result.timezone).toBe(MEXICO);
    // A full local day is 24 hourly buckets.
    expect(result.points).toHaveLength(24);
    expect(result.points[0]?.at).toBe('2026-03-10T06:00:00.000Z');
  });

  it('emits empty buckets rather than skipping quiet hours', async () => {
    // The gap between a busy lunch and a busy dinner is the story; omitting
    // the dead hours between them would compress it away.
    const { useCase } = build({
      observed: [{ at: '2026-03-10T20:00:00.000Z', joined: 7, seated: 5 }],
    });

    const result = await useCase.execute('DEMO');

    expect(result.points).toHaveLength(24);
    expect(result.points.filter((p) => p.joined === 0)).toHaveLength(23);
    expect(result.points.find((p) => p.at === '2026-03-10T20:00:00.000Z')).toEqual({
      at: '2026-03-10T20:00:00.000Z',
      joined: 7,
      seated: 5,
    });
  });

  it('returns buckets oldest first', async () => {
    const { useCase } = build();

    const result = await useCase.execute('DEMO');
    const instants = result.points.map((p) => Date.parse(p.at));

    expect(instants).toEqual([...instants].sort((a, b) => a - b));
  });

  it('buckets by day when asked', async () => {
    const { useCase } = build();

    const result = await useCase.execute('DEMO', {
      from: new Date('2026-03-01T06:00:00Z'),
      to: new Date('2026-03-08T06:00:00Z'),
      bucket: 'day',
    });

    expect(result.points).toHaveLength(7);
    expect(result.points[0]?.at).toBe('2026-03-01T06:00:00.000Z');
  });

  it('passes the zone to the repository so buckets align locally', async () => {
    const { series, useCase } = build({ timezone: 'Asia/Tokyo' });

    await useCase.execute('DEMO');

    expect(series.mock.calls[0]?.[1]).toMatchObject({ timezone: 'Asia/Tokyo', bucket: 'hour' });
  });

  describe('across a DST transition', () => {
    const MADRID = 'Europe/Madrid';

    it('gives the short day 23 hourly buckets', async () => {
      // Madrid springs forward at 02:00 on 2026-03-29.
      const { useCase } = build({ timezone: MADRID, now: '2026-03-29T12:00:00Z' });

      const result = await useCase.execute('DEMO');

      expect(result.points).toHaveLength(23);
    });

    it('keeps daily buckets one per local day across the change', async () => {
      const { useCase } = build({ timezone: MADRID, now: '2026-03-29T12:00:00Z' });

      const result = await useCase.execute('DEMO', {
        from: new Date('2026-03-27T23:00:00Z'),
        to: new Date('2026-03-31T22:00:00Z'),
        bucket: 'day',
      });

      // 28th, 29th (short), 30th, 31st — four days, not three-and-a-bit.
      expect(result.points).toHaveLength(4);
    });
  });

  it('rejects a window that ends before it starts', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute('DEMO', {
        from: new Date('2026-03-08T00:00:00Z'),
        to: new Date('2026-03-01T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a range that would produce an unreasonable number of buckets', async () => {
    // A decade by the hour is a mistake, not a dashboard.
    const { series, useCase } = build();

    await expect(
      useCase.execute('DEMO', {
        from: new Date('2020-01-01T00:00:00Z'),
        to: new Date('2030-01-01T00:00:00Z'),
        bucket: 'hour',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(series).not.toHaveBeenCalled();
  });

  it('allows the same span when bucketed by day', async () => {
    const { useCase } = build();

    const result = await useCase.execute('DEMO', {
      from: new Date('2026-01-01T06:00:00Z'),
      to: new Date('2026-03-01T06:00:00Z'),
      bucket: 'day',
    });

    expect(result.points.length).toBeGreaterThan(50);
  });

  it('rejects an unknown restaurant code', async () => {
    const restaurants = {
      findByCode: () => Promise.resolve(null),
    } as unknown as RestaurantRepository;
    const useCase = new GetMetricsSeries(restaurants, { compute: vi.fn(), series: vi.fn() });

    await expect(useCase.execute('NOPE')).rejects.toBeInstanceOf(NotFoundError);
  });
});
