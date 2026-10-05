import type { MetricsBucket, MetricsSeriesPoint } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import {
  localDayRange,
  nextBucketStart,
  startOfLocal,
  type TimeRange,
} from '../../../shared/time-range';
import type { MetricsRepository } from '../domain/metrics-repository';
import type { RestaurantRepository } from '../domain/restaurant-repository';

export interface MetricsSeriesInput {
  from?: Date;
  to?: Date;
  bucket?: MetricsBucket;
}

export interface MetricsSeriesResult {
  points: MetricsSeriesPoint[];
  bucket: MetricsBucket;
  range: TimeRange;
  timezone: string;
}

/**
 * Guard against a caller asking for, say, a decade by the hour. Well above any
 * real dashboard range (a month of hours is ~744) and far below what would
 * trouble the chart or the response size.
 */
const MAX_BUCKETS = 1500;

/** Query: volume over time, bucketed in the restaurant's own zone. */
export class GetMetricsSeries {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly metrics: MetricsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(code: string, input: MetricsSeriesInput = {}): Promise<MetricsSeriesResult> {
    const found = await this.restaurants.findByCode(code);
    if (!found) throw new NotFoundError('Restaurant not found');

    const { timezone } = found.restaurant;
    const bucket = input.bucket ?? 'hour';
    const range = this.resolveRange(input, timezone);

    const observed = await this.metrics.series(found.restaurant.id, { range, bucket, timezone });

    return { points: this.fillGaps(observed, range, bucket, timezone), bucket, range, timezone };
  }

  private resolveRange(input: MetricsSeriesInput, timezone: string): TimeRange {
    const today = localDayRange(this.now(), timezone);
    const from = input.from ?? today.from;
    const to = input.to ?? today.to;

    if (to.getTime() <= from.getTime()) {
      throw new ValidationError('Range end must be after its start');
    }

    const unit = (input.bucket ?? 'hour') === 'day' ? 86_400_000 : 3_600_000;
    if ((to.getTime() - from.getTime()) / unit > MAX_BUCKETS) {
      throw new ValidationError('Range is too long for this bucket size');
    }

    return { from, to };
  }

  /**
   * Emits every bucket in the range, including empty ones.
   *
   * A chart that omits quiet hours draws a misleading picture: the gap between
   * a busy 14:00 and a busy 19:00 is the story, and skipping the dead hours
   * between them would compress it away.
   */
  private fillGaps(
    observed: MetricsSeriesPoint[],
    range: TimeRange,
    bucket: MetricsBucket,
    timezone: string,
  ): MetricsSeriesPoint[] {
    const byInstant = new Map(observed.map((point) => [point.at, point]));
    const points: MetricsSeriesPoint[] = [];

    let cursor = startOfLocal(range.from, timezone, bucket);
    // The first bucket may start before the range when the range begins
    // mid-bucket; the caller asked for that window, so skip ahead.
    if (cursor.getTime() < range.from.getTime()) {
      cursor = nextBucketStart(cursor, timezone, bucket);
    }

    while (cursor.getTime() < range.to.getTime() && points.length < MAX_BUCKETS) {
      const at = cursor.toISOString();
      points.push(byInstant.get(at) ?? { at, joined: 0, seated: 0 });
      cursor = nextBucketStart(cursor, timezone, bucket);
    }

    return points;
  }
}
