import type { RestaurantMetrics } from '@nexa/types';

export interface MetricsRepository {
  compute(restaurantId: string): Promise<RestaurantMetrics>;
}
