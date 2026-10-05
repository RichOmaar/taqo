import type {
  GetMetricsResponse,
  GetMetricsSeriesResponse,
  GetPeakHoursResponse,
} from '@nexa/types';
import { describe, expect, it } from 'vitest';

import { base, generalQueueId, getJson, join, staffToken } from './helpers';

/**
 * These exercise the SQL itself. The aggregation is raw and timezone-aware, so
 * a repository fake proves nothing about it — only a real Postgres does.
 */
describe('metrics end-to-end', () => {
  it('counts a fresh join in the current window', async () => {
    const token = await staffToken();
    const before = await getJson<GetMetricsResponse>('/restaurants/DEMO/metrics', token);

    await join(await generalQueueId(), 'E2E Metrics');

    const after = await getJson<GetMetricsResponse>('/restaurants/DEMO/metrics', token);
    expect(after.metrics.peopleJoined).toBe(before.metrics.peopleJoined + 1);
  });

  it('reports the window it used and a comparison window before it', async () => {
    const token = await staffToken();

    const result = await getJson<GetMetricsResponse>('/restaurants/DEMO/metrics', token);

    expect(Date.parse(result.range.to)).toBeGreaterThan(Date.parse(result.range.from));
    expect(result.previousRange.to).toBe(result.range.from);
  });

  it('excludes activity outside the requested window', async () => {
    const token = await staffToken();
    await join(await generalQueueId(), 'E2E Outside');

    const past = await getJson<GetMetricsResponse>(
      '/restaurants/DEMO/metrics?from=2020-01-01T00:00:00Z&to=2020-02-01T00:00:00Z',
      token,
    );

    expect(past.metrics.peopleJoined).toBe(0);
    expect(past.metrics.resolvedCount).toBe(0);
  });

  describe('time series', () => {
    it('returns one bucket per hour of the day, including empty ones', async () => {
      const token = await staffToken();

      const series = await getJson<GetMetricsSeriesResponse>(
        '/restaurants/DEMO/metrics/timeseries',
        token,
      );

      expect(series.bucket).toBe('hour');
      expect(series.points.length).toBeGreaterThanOrEqual(23);
      expect(series.points.some((point) => point.joined === 0)).toBe(true);
    });

    it('places a day bucket on local midnight, not an arbitrary instant', async () => {
      // Regression: the column is `timestamp without time zone`, so without
      // declaring it UTC before converting, Postgres read the stored value as
      // already local and shifted it the wrong way. Every day then collapsed
      // into one bucket sitting at 18:00Z — a midnight nowhere.
      //
      // Asserting the count of non-empty buckets would NOT catch this: the
      // seeded database only holds entries from the current day, so one bucket
      // is the right answer either way. The bucket's *instant* is what differs.
      const token = await staffToken();
      await join(await generalQueueId(), 'E2E Bucket');

      const series = await getJson<GetMetricsSeriesResponse>(
        '/restaurants/DEMO/metrics/timeseries?bucket=day',
        token,
      );

      const withActivity = series.points.filter((point) => point.joined > 0);
      expect(withActivity.length).toBeGreaterThan(0);

      // DEMO is America/Mexico_City (UTC-6), so local midnight is 06:00Z.
      for (const point of withActivity) {
        const at = new Date(point.at);
        expect(at.getUTCHours()).toBe(6);
        expect(at.getUTCMinutes()).toBe(0);
      }
    });

    it('aligns buckets to the restaurant timezone, not to UTC', async () => {
      const token = await staffToken();

      const series = await getJson<GetMetricsSeriesResponse>(
        '/restaurants/DEMO/metrics/timeseries?bucket=day',
        token,
      );

      expect(series.timezone).toBe('America/Mexico_City');
      // Mexico City midnight is 06:00Z, so a day bucket must not sit at 00:00Z.
      expect(new Date(series.range.from).getUTCHours()).toBe(6);
    });

    it('rejects a bucket size it does not support', async () => {
      const token = await staffToken();

      const res = await fetch(`${base}/restaurants/DEMO/metrics/timeseries?bucket=week`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(400);
    });
  });

  describe('peak hours', () => {
    it('returns the whole 7 x 24 grid so the heatmap has no holes', async () => {
      const token = await staffToken();

      const result = await getJson<GetPeakHoursResponse>(
        '/restaurants/DEMO/metrics/peak-hours',
        token,
      );

      expect(result.cells).toHaveLength(168);
      expect(result.cells[0]).toMatchObject({ dayOfWeek: 0, hour: 0 });
    });

    it('places a join in the weekday and hour of the restaurant local clock', async () => {
      const token = await staffToken();
      await join(await generalQueueId(), 'E2E Peak');

      const result = await getJson<GetPeakHoursResponse>(
        '/restaurants/DEMO/metrics/peak-hours',
        token,
      );

      // Where the entry should land, read in the restaurant's zone.
      const local = new Intl.DateTimeFormat('en-GB', {
        timeZone: result.timezone,
        weekday: 'short',
        hour: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const hour = Number(local.find((part) => part.type === 'hour')?.value);
      const weekday = local.find((part) => part.type === 'weekday')?.value ?? '';
      const dayOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday);

      const target = result.cells.find(
        (cell) => cell.dayOfWeek === dayOfWeek && cell.hour === hour % 24,
      );
      expect(target?.joined).toBeGreaterThan(0);
    });

    it('reports the busiest cell for scaling the colour ramp', async () => {
      const token = await staffToken();

      const result = await getJson<GetPeakHoursResponse>(
        '/restaurants/DEMO/metrics/peak-hours',
        token,
      );
      const highest = Math.max(...result.cells.map((cell) => cell.joined));

      expect(result.busiest).toBe(highest);
    });

    it('looks back several weeks by default, since one day is not a heatmap', async () => {
      const token = await staffToken();

      const result = await getJson<GetPeakHoursResponse>(
        '/restaurants/DEMO/metrics/peak-hours',
        token,
      );
      const days = (Date.parse(result.range.to) - Date.parse(result.range.from)) / 86_400_000;

      expect(days).toBe(28);
    });

    it('rejects a malformed range', async () => {
      const token = await staffToken();

      const res = await fetch(`${base}/restaurants/DEMO/metrics/peak-hours?from=not-a-date`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(400);
    });
  });
});
