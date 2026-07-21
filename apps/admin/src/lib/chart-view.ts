import type { MetricsSeriesPoint, PeakHourCell } from '@nexa/types';

/** Monday first, matching the grid the API returns. */
export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

/**
 * Bucket instants as local hour labels.
 *
 * The API returns instants and names the zone it bucketed in; formatting in that
 * zone rather than the browser's keeps the axis consistent with the data. A
 * viewer in another country still sees the restaurant's evening as evening.
 */
export function hourLabels(points: MetricsSeriesPoint[], timezone: string): string[] {
  const format = new Intl.DateTimeFormat('es-MX', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return points.map((point) => format.format(new Date(point.at)));
}

/** Cells keyed for the heatmap component's row/column grid. */
export function toHeatmapCells(cells: PeakHourCell[]) {
  return cells.map((cell) => ({ row: cell.dayOfWeek, column: cell.hour, value: cell.joined }));
}

/**
 * Label stride that keeps an axis readable at the width we have.
 *
 * Twenty-four hourly labels collide on any realistic dashboard column, so show
 * every third; a short series shows them all.
 */
export function strideFor(count: number, maxLabels = 9): number {
  return Math.max(1, Math.ceil(count / maxLabels));
}
