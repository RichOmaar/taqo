import type { RestaurantMetrics } from '@nexa/types';
import type { PrismaClient } from '@prisma/client';

import type { MetricsRepository } from '../domain/metrics-repository';

export class PrismaMetricsRepository implements MetricsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async compute(restaurantId: string): Promise<RestaurantMetrics> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [byStatus, seated, peopleToday, ratingAgg] = await Promise.all([
      this.prisma.waitlistEntry.groupBy({
        by: ['status'],
        where: { restaurantId },
        _count: { _all: true },
      }),
      this.prisma.waitlistEntry.findMany({
        where: { restaurantId, status: 'seated', seatedAt: { not: null } },
        select: { joinedAt: true, seatedAt: true },
      }),
      this.prisma.waitlistEntry.count({
        where: { restaurantId, joinedAt: { gte: startOfToday } },
      }),
      this.prisma.serviceReview.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const countOf = (status: string) => byStatus.find((b) => b.status === status)?._count._all ?? 0;
    const seatedCount = countOf('seated');
    const resolved = seatedCount + countOf('no_show') + countOf('cancelled');

    const durations = seated
      .filter((e) => e.seatedAt)
      .map((e) => (e.seatedAt as Date).getTime() - e.joinedAt.getTime());
    const averageWaitMinutes = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60_000)
      : null;

    const averageRating =
      ratingAgg._avg.rating != null ? Number(ratingAgg._avg.rating.toFixed(1)) : null;

    return {
      averageWaitMinutes,
      seatedCount: durations.length,
      peopleToday,
      noShowRate: resolved ? countOf('no_show') / resolved : 0,
      seatedConversion: resolved ? seatedCount / resolved : 0,
      resolvedCount: resolved,
      averageRating,
      reviewCount: ratingAgg._count._all,
    };
  }
}
