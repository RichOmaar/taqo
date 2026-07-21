import type { ListReviewsResponse, ReviewSummaryResponse } from '@nexa/types';
import { beforeAll, describe, expect, it } from 'vitest';

import { base, generalQueueId, getJson, join, seatAndReview, staffToken } from './helpers';

const RATINGS = [5, 4, 5, 2, 3, 4, 5];

describe('reviews end-to-end', () => {
  beforeAll(async () => {
    const token = await staffToken();
    const queueId = await generalQueueId();

    for (const [index, rating] of RATINGS.entries()) {
      const entryId = await join(queueId, `Reseña ${index + 1}`);
      await seatAndReview(entryId, token, rating, index % 2 === 0 ? `Comentario ${index}` : null);
    }
  });

  it('returns reviews newest first, with the diner name from the entry', async () => {
    const token = await staffToken();

    const result = await getJson<ListReviewsResponse>('/restaurants/DEMO/reviews', token);

    expect(result.reviews.length).toBeGreaterThanOrEqual(RATINGS.length);
    expect(result.reviews[0]?.displayName).toMatch(/Reseña/);

    const times = result.reviews.map((review) => Date.parse(review.createdAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('pages without skipping or repeating a review', async () => {
    // The compound (createdAt, id) cursor exists for exactly this: these
    // reviews are created in a tight loop and share timestamps.
    const token = await staffToken();
    const seen: string[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < 20; page += 1) {
      const query: string = cursor ? `?limit=2&cursor=${encodeURIComponent(cursor)}` : '?limit=2';
      const result: ListReviewsResponse = await getJson<ListReviewsResponse>(
        `/restaurants/DEMO/reviews${query}`,
        token,
      );
      seen.push(...result.reviews.map((review) => review.id));
      cursor = result.nextCursor;
      if (!cursor) break;
    }

    const all = await getJson<ListReviewsResponse>('/restaurants/DEMO/reviews?limit=100', token);

    expect(new Set(seen).size).toBe(seen.length);
    expect(new Set(seen)).toEqual(new Set(all.reviews.map((review) => review.id)));
  });

  it('filters to a single rating', async () => {
    const token = await staffToken();

    const result = await getJson<ListReviewsResponse>('/restaurants/DEMO/reviews?rating=2', token);

    expect(result.reviews.length).toBeGreaterThan(0);
    expect(result.reviews.every((review) => review.rating === 2)).toBe(true);
  });

  it('summarizes with all five ratings present', async () => {
    const token = await staffToken();

    const summary = await getJson<ReviewSummaryResponse>(
      '/restaurants/DEMO/reviews/summary',
      token,
    );

    expect(summary.distribution.map((item) => item.rating)).toEqual([1, 2, 3, 4, 5]);
    expect(summary.total).toBeGreaterThanOrEqual(RATINGS.length);
    expect(summary.average).toBeGreaterThan(0);
  });

  it('counts the distribution consistently with its own total', async () => {
    const token = await staffToken();

    const summary = await getJson<ReviewSummaryResponse>(
      '/restaurants/DEMO/reviews/summary',
      token,
    );
    const counted = summary.distribution.reduce((sum, item) => sum + item.count, 0);

    expect(counted).toBe(summary.total);
  });

  it('rejects a rating outside the scale', async () => {
    const token = await staffToken();

    const res = await fetch(`${base}/restaurants/DEMO/reviews?rating=9`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(400);
  });

  it('rejects a cursor it did not issue', async () => {
    const token = await staffToken();

    const res = await fetch(`${base}/restaurants/DEMO/reviews?cursor=garbage`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(400);
  });

  it('refuses an unauthenticated caller', async () => {
    const res = await fetch(`${base}/restaurants/DEMO/reviews`);

    expect(res.status).toBe(401);
  });
});
