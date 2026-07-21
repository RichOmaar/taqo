import type { MetricsSeriesPoint, RestaurantMetrics } from '@nexa/types';
import { Prisma, type PrismaClient } from '@prisma/client';

import type { TimeRange } from '../../../shared/time-range';
import type { MetricsRepository, SeriesQuery } from '../domain/metrics-repository';

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

interface SeriesRow {
  bucket_at: Date;
  joined: number;
  seated: number;
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

  /**
   * Volume per bucket, aligned to the restaurant's local clock.
   *
   * `date_trunc` over `AT TIME ZONE` is why this is raw SQL: an hour bucket
   * must start on the restaurant's hour and a day bucket on its midnight, and
   * Postgres already knows every zone's DST history. Truncating in JS would
   * mean reimplementing that.
   *
   * The zone is interpolated as a parameter, never concatenated, so an invalid
   * one is a database error rather than an injection point.
   *
   * `AT TIME ZONE 'UTC'` first is load-bearing. Prisma maps DateTime to
   * `timestamp without time zone`, so the column carries UTC wall-clock with no
   * zone attached; without that clause Postgres reads the stored value as
   * already being local and shifts it the wrong way, which silently collapsed
   * every day into a single bucket.
   */
  async series(restaurantId: string, query: SeriesQuery): Promise<MetricsSeriesPoint[]> {
    // The unit is a SQL keyword, not a value, so it cannot be a bind parameter.
    // It is constrained to a two-value union upstream and re-checked here.
    const unit = query.bucket === 'day' ? 'day' : 'hour';

    const rows = await this.prisma.$queryRaw<SeriesRow[]>`
      SELECT
        (date_trunc(
            ${Prisma.raw(`'${unit}'`)},
            joined_at AT TIME ZONE 'UTC' AT TIME ZONE ${query.timezone}
          ) AT TIME ZONE ${query.timezone}) AS bucket_at,
        COUNT(*)::int AS joined,
        COUNT(*) FILTER (WHERE status = 'seated')::int AS seated
      FROM waitlist_entries
      WHERE restaurant_id = ${restaurantId}::uuid
        AND joined_at >= ${query.range.from}
        AND joined_at < ${query.range.to}
      GROUP BY bucket_at
      ORDER BY bucket_at ASC
    `;

    return rows.map((row) => ({
      at: row.bucket_at.toISOString(),
      joined: row.joined,
      seated: row.seated,
    }));
  }
}
