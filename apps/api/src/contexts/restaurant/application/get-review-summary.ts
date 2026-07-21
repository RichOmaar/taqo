import type { RatingCount } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { TimeRange } from '../../../shared/time-range';
import type { ReviewReadRepository } from '../domain/review-read-repository';
import type { RestaurantRepository } from '../domain/restaurant-repository';

export interface ReviewSummaryInput {
  from?: Date;
  to?: Date;
}

export interface ReviewSummaryResult {
  average: number | null;
  total: number;
  distribution: RatingCount[];
  range: TimeRange;
}

const RATINGS = [1, 2, 3, 4, 5];
const EPOCH = new Date(0);
const FAR_FUTURE = new Date('9999-12-31T00:00:00Z');

/** Query: rating distribution and average, for the reviews panel. */
export class GetReviewSummary {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly reviews: ReviewReadRepository,
  ) {}

  async execute(code: string, input: ReviewSummaryInput = {}): Promise<ReviewSummaryResult> {
    const found = await this.restaurants.findByCode(code);
    if (!found) throw new NotFoundError('Restaurant not found');

    const range = this.resolveRange(input);
    const summary = await this.reviews.summarize(found.restaurant.id, range);

    return { ...summary, distribution: this.fillRatings(summary.distribution), range };
  }

  private resolveRange(input: ReviewSummaryInput): TimeRange {
    const from = input.from ?? EPOCH;
    const to = input.to ?? FAR_FUTURE;

    if (to.getTime() <= from.getTime()) {
      throw new ValidationError('Range end must be after its start');
    }

    return { from, to };
  }

  /**
   * Every rating from 1 to 5, including the ones nobody gave.
   *
   * A distribution missing its empty ratings draws a bar chart with gaps, and a
   * reader cannot tell "no one rated this 2" from "2 was not measured".
   */
  private fillRatings(observed: RatingCount[]): RatingCount[] {
    const counts = new Map(observed.map((item) => [item.rating, item.count]));
    return RATINGS.map((rating) => ({ rating, count: counts.get(rating) ?? 0 }));
  }
}
