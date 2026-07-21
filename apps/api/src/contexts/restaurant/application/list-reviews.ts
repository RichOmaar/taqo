import type { RestaurantReview } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { TimeRange } from '../../../shared/time-range';
import type { ReviewCursor, ReviewReadRepository } from '../domain/review-read-repository';
import type { RestaurantRepository } from '../domain/restaurant-repository';

export interface ListReviewsInput {
  from?: Date;
  to?: Date;
  rating?: number;
  limit?: number;
  /** Opaque to callers; encodes the position of the last item seen. */
  cursor?: string;
}

export interface ListReviewsResult {
  reviews: RestaurantReview[];
  nextCursor: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Encodes a cursor so callers cannot build one by hand and depend on its shape. */
export function encodeCursor(cursor: ReviewCursor): string {
  return Buffer.from(`${cursor.createdAt.toISOString()}|${cursor.id}`).toString('base64url');
}

export function decodeCursor(value: string): ReviewCursor {
  const [at, id] = Buffer.from(value, 'base64url').toString('utf8').split('|');
  const createdAt = at ? new Date(at) : new Date(Number.NaN);

  if (!id || Number.isNaN(createdAt.getTime())) {
    throw new ValidationError('Invalid cursor');
  }

  return { createdAt, id };
}

/** Query: a restaurant's reviews, newest first. */
export class ListReviews {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly reviews: ReviewReadRepository,
  ) {}

  async execute(code: string, input: ListReviewsInput = {}): Promise<ListReviewsResult> {
    const found = await this.restaurants.findByCode(code);
    if (!found) throw new NotFoundError('Restaurant not found');

    if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
      throw new ValidationError('Rating filter must be between 1 and 5');
    }

    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));

    // Ask for one more than requested: if it comes back, there is another page,
    // which avoids a second count query just to answer "is there more".
    const rows = await this.reviews.list(found.restaurant.id, {
      range: this.resolveRange(input),
      rating: input.rating,
      limit: limit + 1,
      cursor: input.cursor ? decodeCursor(input.cursor) : undefined,
    });

    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    const hasMore = rows.length > limit;

    return {
      reviews: page,
      nextCursor:
        hasMore && last ? encodeCursor({ createdAt: new Date(last.createdAt), id: last.id }) : null,
    };
  }

  /** Undefined means "all time"; reviews are sparse enough not to need a default. */
  private resolveRange(input: ListReviewsInput): TimeRange | undefined {
    if (!input.from && !input.to) return undefined;

    const from = input.from ?? new Date(0);
    const to = input.to ?? new Date('9999-12-31T00:00:00Z');

    if (to.getTime() <= from.getTime()) {
      throw new ValidationError('Range end must be after its start');
    }

    return { from, to };
  }
}
