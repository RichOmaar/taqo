import type { RestaurantReview } from '@nexa/types';
import type { PrismaClient } from '@prisma/client';

import type { TimeRange } from '../../../shared/time-range';
import type {
  ListReviewsQuery,
  ReviewReadRepository,
  ReviewSummary,
} from '../domain/review-read-repository';

function createdAtFilter(range?: TimeRange) {
  return range ? { createdAt: { gte: range.from, lt: range.to } } : {};
}

export class PrismaReviewReadRepository implements ReviewReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(restaurantId: string, query: ListReviewsQuery): Promise<RestaurantReview[]> {
    const rows = await this.prisma.serviceReview.findMany({
      where: {
        restaurantId,
        ...createdAtFilter(query.range),
        ...(query.rating !== undefined && { rating: query.rating }),
        // Keyset pagination on (createdAt, id): the tie-break is what stops a
        // review being skipped when two share a millisecond at a page edge.
        ...(query.cursor && {
          OR: [
            { createdAt: { lt: query.cursor.createdAt } },
            { createdAt: query.cursor.createdAt, id: { lt: query.cursor.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit,
      include: { entry: { select: { displayName: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      entryId: row.entryId,
      displayName: row.entry.displayName,
      rating: row.rating,
      feedback: row.feedback,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async summarize(restaurantId: string, range?: TimeRange): Promise<ReviewSummary> {
    const where = { restaurantId, ...createdAtFilter(range) };

    const [aggregate, byRating] = await Promise.all([
      this.prisma.serviceReview.aggregate({
        where,
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.serviceReview.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);

    return {
      average: aggregate._avg.rating != null ? Number(aggregate._avg.rating.toFixed(1)) : null,
      total: aggregate._count._all,
      distribution: byRating.map((row) => ({ rating: row.rating, count: row._count._all })),
    };
  }
}
