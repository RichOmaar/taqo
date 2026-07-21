import type { RestaurantMetrics } from '@nexa/types';

import type { TimeRange } from '../../../shared/time-range';

export interface MetricsRepository {
  /** KPIs for entries that joined within `range` (`to` exclusive). */
  compute(restaurantId: string, range: TimeRange): Promise<RestaurantMetrics>;
}
