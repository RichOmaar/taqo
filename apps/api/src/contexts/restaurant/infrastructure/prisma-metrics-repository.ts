import type { RestaurantMetrics } from '@nexa/types';
import type { PrismaClient } from '@prisma/client';

import type { TimeRange } from '../../../shared/time-range';
import type { MetricsRepository } from '../domain/metrics-repository';

/**
 * Postgres returns numerics as strings and COUNT as bigint; both come back
 * cast to int/float in the queries below so they arrive as JS numbers.
 */
interface EntryAggregate {
  joined_count: number;
  seated_count: number;
  no_show_count: number;
  resolved_count: number;
  avg_wait_seconds: number | null;
}

interface ReviewAggregate {
  review_count: number;
  avg_rating: number | null;
}

/**
 * Raw SQL rather than the Prisma query API, which is the exception CLAUDE.md
 * allows for a justified case. Two reasons here: the average wait is over a
 * computed interval (`seated_at - joined_at`), which Prisma cannot aggregate,
 * and the previous implementation loaded every seated entry into memory to
 * average in JS — fine for a demo, not for a year of covers.
 */
export class PrismaMetricsRepository implements MetricsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async compute(restaurantId: string, range: TimeRange): Promise<RestaurantMetrics> {
    const [entries, reviews] = await Promise.all([
      this.prisma.$queryRaw<EntryAggregate[]>`
        SELECT
          COUNT(*)::int AS joined_count,
          COUNT(*) FILTER (WHERE status = 'seated')::int AS seated_count,
          COUNT(*) FILTER (WHERE status = 'no_show')::int AS no_show_count,
          COUNT(*) FILTER (WHERE status IN ('seated', 'no_show', 'cancelled'))::int
            AS resolved_count,
          AVG(EXTRACT(EPOCH FROM (seated_at - joined_at)))
            FILTER (WHERE status = 'seated' AND seated_at IS NOT NULL)::float
            AS avg_wait_seconds
        FROM waitlist_entries
        WHERE restaurant_id = ${restaurantId}::uuid
          AND joined_at >= ${range.from}
          AND joined_at < ${range.to}
      `,
      this.prisma.$queryRaw<ReviewAggregate[]>`
        SELECT
          COUNT(*)::int AS review_count,
          AVG(rating)::float AS avg_rating
        FROM service_reviews
        WHERE restaurant_id = ${restaurantId}::uuid
          AND created_at >= ${range.from}
          AND created_at < ${range.to}
      `,
    ]);

    const entry = entries[0] ?? {
      joined_count: 0,
      seated_count: 0,
      no_show_count: 0,
      resolved_count: 0,
      avg_wait_seconds: null,
    };
    const review = reviews[0] ?? { review_count: 0, avg_rating: null };
    const resolved = entry.resolved_count;

    return {
      averageWaitMinutes:
        entry.avg_wait_seconds != null ? Math.round(entry.avg_wait_seconds / 60) : null,
      seatedCount: entry.seated_count,
      peopleJoined: entry.joined_count,
      noShowRate: resolved ? entry.no_show_count / resolved : 0,
      seatedConversion: resolved ? entry.seated_count / resolved : 0,
      resolvedCount: resolved,
      averageRating: review.avg_rating != null ? Number(review.avg_rating.toFixed(1)) : null,
      reviewCount: review.review_count,
    };
  }
}
