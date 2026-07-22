import type { RatingCount, RestaurantReview } from '@nexa/types';

import type { TimeRange } from '../../../shared/time-range';

/**
 * Position in the review list.
 *
 * Compound rather than a bare timestamp: two reviews can share a millisecond,
 * and a cursor on `createdAt` alone would skip one of them at a page boundary.
 */
export interface ReviewCursor {
  createdAt: Date;
  id: string;
}

export interface ListReviewsQuery {
  range?: TimeRange;
  /** Only this rating, for filtering the list to complaints or praise. */
  rating?: number;
  limit: number;
  cursor?: ReviewCursor;
}

export interface ReviewSummary {
  average: number | null;
  total: number;
  distribution: RatingCount[];
}

export interface ReviewReadRepository {
  /** Newest first. Returns at most `limit` reviews. */
  list(restaurantId: string, query: ListReviewsQuery): Promise<RestaurantReview[]>;
  summarize(restaurantId: string, range?: TimeRange): Promise<ReviewSummary>;
}
