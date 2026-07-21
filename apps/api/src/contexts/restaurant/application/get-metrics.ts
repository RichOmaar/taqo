import type { RestaurantMetrics } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import { localDayRange, type TimeRange } from '../../../shared/time-range';
import type { MetricsRepository } from '../domain/metrics-repository';
import type { RestaurantRepository } from '../domain/restaurant-repository';

/** Caller-supplied window; either end may be omitted. */
export interface MetricsRangeInput {
  from?: Date;
  to?: Date;
}

export interface MetricsResult {
  metrics: RestaurantMetrics;
  range: TimeRange;
}

/** Query: compute a restaurant's dashboard KPIs by code, over a window. */
export class GetMetrics {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly metrics: MetricsRepository,
    /** Injectable so tests are not tied to the wall clock. */
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(code: string, input: MetricsRangeInput = {}): Promise<MetricsResult> {
    const found = await this.restaurants.findByCode(code);
    if (!found) throw new NotFoundError('Restaurant not found');

    const range = this.resolveRange(input, found.restaurant.timezone);
    return { metrics: await this.metrics.compute(found.restaurant.id, range), range };
  }

  /**
   * Defaults to the restaurant's own current day, so "hoy" is the local day
   * rather than the server's. A half-open window falls back to that day's
   * boundary for whichever end is missing.
   */
  private resolveRange(input: MetricsRangeInput, timezone: string): TimeRange {
    const today = localDayRange(this.now(), timezone);
    const from = input.from ?? today.from;
    const to = input.to ?? today.to;

    if (to.getTime() <= from.getTime()) {
      throw new ValidationError('Range end must be after its start');
    }

    return { from, to };
  }
}
