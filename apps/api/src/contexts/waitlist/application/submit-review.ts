import type { ServiceReview } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { ReviewRepository } from '../domain/review-repository';
import type { WaitlistRepository } from '../domain/waitlist-repository';

export interface SubmitReviewInput {
  entryId: string;
  rating: number;
  feedback?: string | null;
}

/** Use case: a served diner leaves a post-service review. */
export class SubmitReview {
  constructor(
    private readonly waitlist: WaitlistRepository,
    private readonly reviews: ReviewRepository,
  ) {}

  async execute(input: SubmitReviewInput): Promise<ServiceReview> {
    const entry = await this.waitlist.findById(input.entryId);
    if (!entry) throw new NotFoundError('Entry not found');
    if (entry.status !== 'seated') {
      throw new ValidationError('Only served diners can leave a review');
    }
    if (await this.reviews.existsForEntry(entry.id)) {
      throw new ValidationError('This visit was already reviewed');
    }
    return this.reviews.create({
      entryId: entry.id,
      restaurantId: entry.restaurantId,
      rating: input.rating,
      feedback: input.feedback ?? null,
    });
  }
}
