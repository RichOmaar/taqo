import type { MetricsBucket, MetricsSeriesPoint, RestaurantMetrics } from '@nexa/types';

import type { TimeRange } from '../../../shared/time-range';

export interface SeriesQuery {
  range: TimeRange;
  bucket: MetricsBucket;
  /** Zone the buckets are aligned to, so a "day" is the restaurant's day. */
  timezone: string;
}

export interface MetricsRepository {
  /** KPIs for entries that joined within `range` (`to` exclusive). */
  compute(restaurantId: string, range: TimeRange): Promise<RestaurantMetrics>;
  /** Volume per bucket. Only buckets with activity are returned. */
  series(restaurantId: string, query: SeriesQuery): Promise<MetricsSeriesPoint[]>;
}
