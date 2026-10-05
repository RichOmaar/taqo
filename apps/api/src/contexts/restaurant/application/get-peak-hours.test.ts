import type { PeakHourCell } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { MetricsRepository } from '../domain/metrics-repository';
import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';
import { GetPeakHours } from './get-peak-hours';

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

function build(options: { observed?: PeakHourCell[]; timezone?: string; now?: string } = {}) {
  const { observed = [], timezone = MEXICO, now = '2026-03-10T20:00:00Z' } = options;
  const peakHours = vi.fn<MetricsRepository['peakHours']>().mockResolvedValue(observed);
  const restaurants = {
    findByCode: () => Promise.resolve(restaurant(timezone)),
  } as unknown as RestaurantRepository;

  return {
    peakHours,
    useCase: new GetPeakHours(
      restaurants,
      { compute: vi.fn(), series: vi.fn(), peakHours },
      () => new Date(now),
    ),
  };
}

function cell(cells: PeakHourCell[], dayOfWeek: number, hour: number): PeakHourCell {
  const found = cells.find((c) => c.dayOfWeek === dayOfWeek && c.hour === hour);
  if (!found) throw new Error(`no cell for day ${dayOfWeek} hour ${hour}`);
  return found;
}

describe('GetPeakHours', () => {
  it('returns the full grid so the heatmap has no holes', async () => {
    const { useCase } = build();

    const result = await useCase.execute('DEMO');

    expect(result.cells).toHaveLength(7 * 24);
  });

  it('orders cells Monday 00:00 first', async () => {
    const { useCase } = build();

    const result = await useCase.execute('DEMO');

    expect(result.cells[0]).toMatchObject({ dayOfWeek: 0, hour: 0 });
    expect(result.cells[23]).toMatchObject({ dayOfWeek: 0, hour: 23 });
    expect(result.cells[24]).toMatchObject({ dayOfWeek: 1, hour: 0 });
  });

  it('places observed traffic in its cell and zeroes the rest', async () => {
    const { useCase } = build({
      observed: [{ dayOfWeek: 5, hour: 20, joined: 31 }],
    });

    const result = await useCase.execute('DEMO');

    expect(cell(result.cells, 5, 20).joined).toBe(31);
    expect(cell(result.cells, 5, 19).joined).toBe(0);
  });

  it('reports the busiest cell for scaling the colour ramp', async () => {
    const { useCase } = build({
      observed: [
        { dayOfWeek: 5, hour: 20, joined: 31 },
        { dayOfWeek: 2, hour: 13, joined: 12 },
      ],
    });

    const result = await useCase.execute('DEMO');

    expect(result.busiest).toBe(31);
  });

  it('reports zero busiest for a restaurant with no traffic', async () => {
    // The UI divides by this; it must not have to guard against undefined.
    const { useCase } = build();

    expect((await useCase.execute('DEMO')).busiest).toBe(0);
  });

  it('looks back four weeks by default, not one day', async () => {
    // A single day would populate one column of seven and read as broken.
    const { peakHours, useCase } = build();

    const result = await useCase.execute('DEMO');
    const days = (result.range.to.getTime() - result.range.from.getTime()) / 86_400_000;

    expect(days).toBe(28);
    expect(peakHours.mock.calls[0]?.[1]).toMatchObject({ timezone: MEXICO });
  });

  it('ends the default window at the close of the local day', async () => {
    const { useCase } = build();

    const result = await useCase.execute('DEMO');

    expect(result.range.to.toISOString()).toBe('2026-03-11T06:00:00.000Z');
  });

  it('honours an explicit window', async () => {
    const { useCase } = build();
    const from = new Date('2026-01-01T06:00:00Z');
    const to = new Date('2026-02-01T06:00:00Z');

    const result = await useCase.execute('DEMO', { from, to });

    expect(result.range).toEqual({ from, to });
  });

  it('reads the grid in the restaurant own zone', async () => {
    const { peakHours, useCase } = build({ timezone: 'Asia/Tokyo' });

    const result = await useCase.execute('DEMO');

    expect(result.timezone).toBe('Asia/Tokyo');
    expect(peakHours.mock.calls[0]?.[1]).toMatchObject({ timezone: 'Asia/Tokyo' });
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

  it('rejects an unknown restaurant code', async () => {
    const restaurants = {
      findByCode: () => Promise.resolve(null),
    } as unknown as RestaurantRepository;
    const useCase = new GetPeakHours(restaurants, {
      compute: vi.fn(),
      series: vi.fn(),
      peakHours: vi.fn(),
    });

    await expect(useCase.execute('NOPE')).rejects.toBeInstanceOf(NotFoundError);
  });
});
