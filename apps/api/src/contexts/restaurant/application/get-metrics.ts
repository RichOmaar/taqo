import type { RestaurantMetrics } from '@nexa/types';

import { NotFoundError } from '../../../shared/errors';
import type { MetricsRepository } from '../domain/metrics-repository';
import type { RestaurantRepository } from '../domain/restaurant-repository';

/** Query: compute a restaurant's dashboard KPIs by code. */
export class GetMetrics {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly metrics: MetricsRepository,
  ) {}

  async execute(code: string): Promise<RestaurantMetrics> {
    const id = await this.restaurants.findIdByCode(code);
    if (!id) throw new NotFoundError('Restaurant not found');
    return this.metrics.compute(id);
  }
}
