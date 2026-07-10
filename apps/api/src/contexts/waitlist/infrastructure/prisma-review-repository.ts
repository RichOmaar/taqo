import type { ServiceReview } from '@nexa/types';
import type { PrismaClient, ServiceReview as PrismaServiceReview } from '@prisma/client';

import type { NewReview, ReviewRepository } from '../domain/review-repository';

function toReview(row: PrismaServiceReview): ServiceReview {
  return {
    id: row.id,
    entryId: row.entryId,
    restaurantId: row.restaurantId,
    rating: row.rating,
    feedback: row.feedback,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async existsForEntry(entryId: string): Promise<boolean> {
    const count = await this.prisma.serviceReview.count({ where: { entryId } });
    return count > 0;
  }

  async create(review: NewReview): Promise<ServiceReview> {
    const row = await this.prisma.serviceReview.create({ data: review });
    return toReview(row);
  }
}
