import type { RestaurantReview } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { ReviewReadRepository } from '../domain/review-read-repository';
import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';
import { ListReviews, decodeCursor, encodeCursor } from './list-reviews';

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

function review(index: number): RestaurantReview {
  return {
    id: `rev${index}`,
    entryId: `e${index}`,
    displayName: `Comensal ${index}`,
    rating: 5,
    feedback: null,
    createdAt: new Date(Date.UTC(2026, 6, 21, 12, 0, index)).toISOString(),
  };
}

function build(options: { rows?: RestaurantReview[]; found?: boolean } = {}) {
  const { rows = [], found = true } = options;
  const list = vi.fn<ReviewReadRepository['list']>().mockResolvedValue(rows);
  const restaurants = {
    findByCode: () => Promise.resolve(found ? restaurant() : null),
  } as unknown as RestaurantRepository;

  return { list, useCase: new ListReviews(restaurants, { list, summarize: vi.fn() }) };
}

describe('cursor encoding', () => {
  it('round-trips a position', () => {
    const cursor = { createdAt: new Date('2026-07-21T12:00:00.000Z'), id: 'rev1' };

    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('is opaque, so callers cannot depend on its shape', () => {
    const encoded = encodeCursor({ createdAt: new Date(), id: 'rev1' });

    expect(encoded).not.toContain('rev1');
  });

  it('rejects a malformed cursor rather than querying with garbage', () => {
    expect(() => decodeCursor('not-a-cursor')).toThrow(ValidationError);
  });
});

describe('ListReviews', () => {
  it('returns the page and no cursor when the list fits', async () => {
    const { useCase } = build({ rows: [review(1), review(2)] });

    const result = await useCase.execute('DEMO', { limit: 20 });

    expect(result.reviews).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });

  it('asks for one extra row to detect a further page without a count query', async () => {
    const { list, useCase } = build();

    await useCase.execute('DEMO', { limit: 3 });

    expect(list.mock.calls[0]?.[1]).toMatchObject({ limit: 4 });
  });

  it('trims the extra row and returns a cursor when there is more', async () => {
    const { useCase } = build({ rows: [review(1), review(2), review(3), review(4)] });

    const result = await useCase.execute('DEMO', { limit: 3 });

    expect(result.reviews).toHaveLength(3);
    expect(result.nextCursor).not.toBeNull();
  });

  it('points the cursor at the last returned review, not the peeked one', async () => {
    // Pointing at the peeked row would skip it on the next page.
    const { useCase } = build({ rows: [review(1), review(2), review(3), review(4)] });

    const result = await useCase.execute('DEMO', { limit: 3 });
    const cursor = decodeCursor(result.nextCursor!);

    expect(cursor.id).toBe('rev3');
  });

  it('passes a decoded cursor through to the repository', async () => {
    const { list, useCase } = build();
    const cursor = encodeCursor({ createdAt: new Date('2026-07-21T12:00:00.000Z'), id: 'rev9' });

    await useCase.execute('DEMO', { cursor });

    expect(list.mock.calls[0]?.[1].cursor).toEqual({
      createdAt: new Date('2026-07-21T12:00:00.000Z'),
      id: 'rev9',
    });
  });

  it('caps the page size so one caller cannot ask for everything', async () => {
    const { list, useCase } = build();

    await useCase.execute('DEMO', { limit: 5000 });

    expect(list.mock.calls[0]?.[1].limit).toBeLessThanOrEqual(101);
  });

  it('treats an absent range as all time', async () => {
    // Reviews are sparse; defaulting to today would usually show nothing.
    const { list, useCase } = build();

    await useCase.execute('DEMO');

    expect(list.mock.calls[0]?.[1].range).toBeUndefined();
  });

  it('filters by rating when asked', async () => {
    const { list, useCase } = build();

    await useCase.execute('DEMO', { rating: 1 });

    expect(list.mock.calls[0]?.[1].rating).toBe(1);
  });

  it('rejects a rating outside the scale', async () => {
    const { useCase } = build();

    await expect(useCase.execute('DEMO', { rating: 9 })).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a window that ends before it starts', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute('DEMO', {
        from: new Date('2026-07-21T00:00:00Z'),
        to: new Date('2026-07-01T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects an unknown restaurant code', async () => {
    const { useCase } = build({ found: false });

    await expect(useCase.execute('NOPE')).rejects.toBeInstanceOf(NotFoundError);
  });
});
