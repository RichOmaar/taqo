import type { PeakHourCell } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import {
  addDays,
  localDayRange,
  startOfLocalDay,
  type TimeRange,
} from '../../../shared/time-range';
import type { MetricsRepository } from '../domain/metrics-repository';
import type { RestaurantRepository } from '../domain/restaurant-repository';

export interface PeakHoursInput {
  from?: Date;
  to?: Date;
}

export interface PeakHoursResult {
  cells: PeakHourCell[];
  busiest: number;
  range: TimeRange;
  timezone: string;
}

const DAYS_IN_WEEK = 7;
const HOURS_IN_DAY = 24;

/**
 * A heatmap answers "which shifts are busy", which needs several samples of
 * each weekday. One day gives a grid with a single populated column, so the
 * default looks back four weeks.
 */
const DEFAULT_LOOKBACK_DAYS = 28;

/** Query: volume by weekday and hour, for the peak-hours heatmap. */
export class GetPeakHours {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly metrics: MetricsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(code: string, input: PeakHoursInput = {}): Promise<PeakHoursResult> {
    const found = await this.restaurants.findByCode(code);
    if (!found) throw new NotFoundError('Restaurant not found');

    const { timezone } = found.restaurant;
    const range = this.resolveRange(input, timezone);
    const observed = await this.metrics.peakHours(found.restaurant.id, { range, timezone });

    const cells = this.fillGrid(observed);
    const busiest = cells.reduce((highest, cell) => Math.max(highest, cell.joined), 0);

    return { cells, busiest, range, timezone };
  }

  private resolveRange(input: PeakHoursInput, timezone: string): TimeRange {
    const today = localDayRange(this.now(), timezone);
    const to = input.to ?? today.to;
    const from =
      input.from ?? startOfLocalDay(addDays(today.from, -(DEFAULT_LOOKBACK_DAYS - 1)), timezone);

    if (to.getTime() <= from.getTime()) {
      throw new ValidationError('Range end must be after its start');
    }

    return { from, to };
  }

  /**
   * Emits all 7 × 24 cells, Monday 00:00 first.
   *
   * A heatmap with holes cannot be rendered as a grid, and an absent cell and a
   * zero-traffic cell mean the same thing to a reader.
   */
  private fillGrid(observed: PeakHourCell[]): PeakHourCell[] {
    const byKey = new Map(observed.map((cell) => [`${cell.dayOfWeek}:${cell.hour}`, cell.joined]));
    const cells: PeakHourCell[] = [];

    for (let dayOfWeek = 0; dayOfWeek < DAYS_IN_WEEK; dayOfWeek += 1) {
      for (let hour = 0; hour < HOURS_IN_DAY; hour += 1) {
        cells.push({ dayOfWeek, hour, joined: byKey.get(`${dayOfWeek}:${hour}`) ?? 0 });
      }
    }

    return cells;
  }
}
