import type { ServiceReview } from '@nexa/types';

export interface NewReview {
  entryId: string;
  restaurantId: string;
  rating: number;
  feedback: string | null;
}

export interface ReviewRepository {
  existsForEntry(entryId: string): Promise<boolean>;
  create(review: NewReview): Promise<ServiceReview>;
}
