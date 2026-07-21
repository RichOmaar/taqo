import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { ReviewReadRepository, ReviewSummary } from '../domain/review-read-repository';
import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';
import { GetReviewSummary } from './get-review-summary';

function restaurant(): RestaurantWithQueues {
  return {
    restaurant: {
      id: 'r1',
      name: 'Bistro Moderno',
      code: 'DEMO',
      qrToken: 'demo-qr-token',
      etaBaseMinutes: 10,
      expirationMinutes: 10,
      plan: 'free',
      timezone: 'America/Mexico_City',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    queues: [],
  };
}

function build(summary: ReviewSummary, found = true) {
  const summarize = vi.fn<ReviewReadRepository['summarize']>().mockResolvedValue(summary);
  const restaurants = {
    findByCode: () => Promise.resolve(found ? restaurant() : null),
  } as unknown as RestaurantRepository;

  return { summarize, useCase: new GetReviewSummary(restaurants, { list: vi.fn(), summarize }) };
}

describe('GetReviewSummary', () => {
  it('returns the average and total from the repository', async () => {
    const { useCase } = build({
      average: 4.6,
      total: 9,
      distribution: [{ rating: 5, count: 9 }],
    });

    const result = await useCase.execute('DEMO');

    expect(result).toMatchObject({ average: 4.6, total: 9 });
  });

  it('fills in ratings nobody gave, so the bars have no holes', async () => {
    // A reader cannot tell "nobody rated 2" from "2 was not measured".
    const { useCase } = build({
      average: 4.5,
      total: 4,
      distribution: [
        { rating: 4, count: 2 },
        { rating: 5, count: 2 },
      ],
    });

    const result = await useCase.execute('DEMO');

    expect(result.distribution).toEqual([
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 2 },
      { rating: 5, count: 2 },
    ]);
  });

  it('returns a full empty distribution when there are no reviews', async () => {
    const { useCase } = build({ average: null, total: 0, distribution: [] });

    const result = await useCase.execute('DEMO');

    expect(result.average).toBeNull();
    expect(result.distribution).toHaveLength(5);
    expect(result.distribution.every((item) => item.count === 0)).toBe(true);
  });

  it('orders the distribution from one star to five', async () => {
    const { useCase } = build({
      average: 3,
      total: 2,
      distribution: [
        { rating: 5, count: 1 },
        { rating: 1, count: 1 },
      ],
    });

    const result = await useCase.execute('DEMO');

    expect(result.distribution.map((item) => item.rating)).toEqual([1, 2, 3, 4, 5]);
  });

  it('rejects a window that ends before it starts', async () => {
    const { useCase } = build({ average: null, total: 0, distribution: [] });

    await expect(
      useCase.execute('DEMO', {
        from: new Date('2026-07-21T00:00:00Z'),
        to: new Date('2026-07-01T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects an unknown restaurant code', async () => {
    const { useCase } = build({ average: null, total: 0, distribution: [] }, false);

    await expect(useCase.execute('NOPE')).rejects.toBeInstanceOf(NotFoundError);
  });
});
