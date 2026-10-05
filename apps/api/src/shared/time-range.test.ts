import { describe, expect, it } from 'vitest';

import { addDays, localDayRange, previousRange, startOfLocalDay } from './time-range';

const MEXICO = 'America/Mexico_City'; // UTC-6, no DST since 2022
const MADRID = 'Europe/Madrid'; // UTC+1 / UTC+2, DST in spring
const TOKYO = 'Asia/Tokyo'; // UTC+9, ahead of UTC

describe('startOfLocalDay', () => {
  it('resolves local midnight to the right UTC instant', () => {
    // 2026-03-10 08:00 UTC is 02:00 in Mexico City, so the day began at 06:00Z.
    const start = startOfLocalDay(new Date('2026-03-10T08:00:00Z'), MEXICO);

    expect(start.toISOString()).toBe('2026-03-10T06:00:00.000Z');
  });

  it('attributes a late-night instant to the local day, not the UTC one', () => {
    // 23:30 local on the 10th is already the 11th in UTC. Bucketing on the
    // process clock would file this evening service under the wrong day.
    const start = startOfLocalDay(new Date('2026-03-11T05:30:00Z'), MEXICO);

    expect(start.toISOString()).toBe('2026-03-10T06:00:00.000Z');
  });

  it('handles a zone ahead of UTC', () => {
    // 2026-03-10 01:00 UTC is 10:00 in Tokyo; that day began at 15:00Z on the 9th.
    const start = startOfLocalDay(new Date('2026-03-10T01:00:00Z'), TOKYO);

    expect(start.toISOString()).toBe('2026-03-09T15:00:00.000Z');
  });

  it('is idempotent', () => {
    const once = startOfLocalDay(new Date('2026-03-10T08:00:00Z'), MEXICO);
    const twice = startOfLocalDay(once, MEXICO);

    expect(twice.toISOString()).toBe(once.toISOString());
  });

  describe('across a DST transition', () => {
    // Madrid springs forward at 02:00 on 2026-03-29.
    it('uses the offset in effect on the day itself, not the current one', () => {
      const start = startOfLocalDay(new Date('2026-03-29T12:00:00Z'), MADRID);

      // Midnight local was still CET (+1), so 23:00Z the previous day.
      expect(start.toISOString()).toBe('2026-03-28T23:00:00.000Z');
    });

    it('gives the day after the change its own, shorter offset', () => {
      const start = startOfLocalDay(new Date('2026-03-30T12:00:00Z'), MADRID);

      // Now CEST (+2), so midnight local is 22:00Z the previous day.
      expect(start.toISOString()).toBe('2026-03-29T22:00:00.000Z');
    });
  });
});

describe('localDayRange', () => {
  it('spans exactly one day and excludes its end', () => {
    const range = localDayRange(new Date('2026-03-10T08:00:00Z'), MEXICO);

    expect(range.from.toISOString()).toBe('2026-03-10T06:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-03-11T06:00:00.000Z');
  });

  it('is 23 hours long on the day the clocks go forward', () => {
    // The naive "+24h" would swallow an hour of the next day.
    const range = localDayRange(new Date('2026-03-29T12:00:00Z'), MADRID);
    const hours = (range.to.getTime() - range.from.getTime()) / 3_600_000;

    expect(hours).toBe(23);
  });

  it('tiles with the following day without gap or overlap', () => {
    const today = localDayRange(new Date('2026-03-29T12:00:00Z'), MADRID);
    const tomorrow = localDayRange(today.to, MADRID);

    expect(tomorrow.from.toISOString()).toBe(today.to.toISOString());
  });
});

describe('previousRange', () => {
  it('returns the equally long window ending where the range begins', () => {
    const range = localDayRange(new Date('2026-03-10T08:00:00Z'), MEXICO);
    const previous = previousRange(range);

    expect(previous.to.toISOString()).toBe(range.from.toISOString());
    expect(previous.from.toISOString()).toBe('2026-03-09T06:00:00.000Z');
  });

  it('mirrors a multi-day window', () => {
    const week = { from: new Date('2026-03-08T06:00:00Z'), to: new Date('2026-03-15T06:00:00Z') };

    expect(previousRange(week).from.toISOString()).toBe('2026-03-01T06:00:00.000Z');
  });
});

describe('addDays', () => {
  it('advances by whole days', () => {
    expect(addDays(new Date('2026-03-10T06:00:00Z'), 1).toISOString()).toBe(
      '2026-03-11T06:00:00.000Z',
    );
  });
});
