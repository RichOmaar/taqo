import type { WaitlistHistoryEntry } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';
import type { WaitlistHistoryReadRepository } from '../domain/waitlist-history-read-repository';
import { ListWaitlistHistory, decodeCursor, encodeCursor } from './list-waitlist-history';

function restaurant(): RestaurantWithQueues {
  return {
    restaurant: {
      id: 'r1',
      name: 'Bistro Moderno',
      code: 'DEMO',
      qrToken: 'demo-qr-token',
      etaBaseMinutes: 10,
      expirationMinutes: 10,
      plan: 'free',
      timezone: 'America/Mexico_City',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    queues: [],
  };
}

function entry(index: number): WaitlistHistoryEntry {
  return {
    id: `e${index}`,
    queueId: 'q1',
    queueName: 'General',
    displayName: `Comensal ${index}`,
    partySize: 2,
    status: 'seated',
    joinedAt: new Date(Date.UTC(2026, 6, 21, 12, 0, index)).toISOString(),
    notifiedAt: null,
    seatedAt: null,
    waitMinutes: 12,
  };
}

function build(options: { rows?: WaitlistHistoryEntry[]; found?: boolean } = {}) {
  const { rows = [], found = true } = options;
  const list = vi.fn<WaitlistHistoryReadRepository['list']>().mockResolvedValue(rows);
  const restaurants = {
    findByCode: () => Promise.resolve(found ? restaurant() : null),
  } as unknown as RestaurantRepository;

  return { list, useCase: new ListWaitlistHistory(restaurants, { list }) };
}

describe('cursor encoding', () => {
  it('round-trips a position', () => {
    const cursor = { joinedAt: new Date('2026-07-21T12:00:00.000Z'), id: 'e1' };

    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('is opaque, so callers cannot depend on its shape', () => {
    expect(encodeCursor({ joinedAt: new Date(), id: 'e1' })).not.toContain('e1');
  });

  it('rejects a malformed cursor rather than querying with garbage', () => {
    expect(() => decodeCursor('not-a-cursor')).toThrow(ValidationError);
  });

  it('rejects a cursor with no id', () => {
    const halfBaked = Buffer.from('2026-07-21T12:00:00.000Z|').toString('base64url');

    expect(() => decodeCursor(halfBaked)).toThrow(ValidationError);
  });
});

describe('ListWaitlistHistory', () => {
  it('refuses an unknown restaurant', async () => {
    const { useCase } = build({ found: false });

    await expect(useCase.execute('NOPE')).rejects.toThrow(NotFoundError);
  });

  it('returns the entries it was given', async () => {
    const { useCase } = build({ rows: [entry(1), entry(2)] });

    const result = await useCase.execute('DEMO');

    expect(result.entries.map((row) => row.id)).toEqual(['e1', 'e2']);
  });

  describe('paging', () => {
    it('asks for one more than requested, to know whether there is another page', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO', { limit: 10 });

      expect(list.mock.calls[0]?.[1].limit).toBe(11);
    });

    it('does not return the extra row it asked for', async () => {
      const rows = Array.from({ length: 4 }, (_, index) => entry(index));
      const { useCase } = build({ rows });

      const result = await useCase.execute('DEMO', { limit: 3 });

      expect(result.entries).toHaveLength(3);
    });

    it('hands back a cursor when there is more', async () => {
      const rows = Array.from({ length: 4 }, (_, index) => entry(index));
      const { useCase } = build({ rows });

      const result = await useCase.execute('DEMO', { limit: 3 });

      expect(result.nextCursor).not.toBeNull();
    });

    it('points the cursor at the last row returned, not the extra one', async () => {
      const rows = Array.from({ length: 4 }, (_, index) => entry(index));
      const { useCase } = build({ rows });

      const result = await useCase.execute('DEMO', { limit: 3 });

      // Row index 2 is the last of the page; index 3 is the lookahead.
      expect(decodeCursor(result.nextCursor!).id).toBe('e2');
    });

    it('hands back no cursor on the last page', async () => {
      const { useCase } = build({ rows: [entry(1)] });

      const result = await useCase.execute('DEMO', { limit: 3 });

      expect(result.nextCursor).toBeNull();
    });

    it('caps the limit, so one request cannot ask for the whole table', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO', { limit: 5000 });

      expect(list.mock.calls[0]?.[1].limit).toBe(101);
    });

    it('refuses a limit below one rather than querying for nothing', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO', { limit: 0 });

      expect(list.mock.calls[0]?.[1].limit).toBe(2);
    });
  });

  describe('the status filter', () => {
    it('passes a known status through', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO', { status: 'no_show' });

      expect(list.mock.calls[0]?.[1].status).toBe('no_show');
    });

    it('rejects an unknown status rather than silently returning everything', async () => {
      // Ignoring it would render as "there were no no-shows", which is a lie.
      const { useCase } = build();

      await expect(useCase.execute('DEMO', { status: 'noshow' })).rejects.toThrow(ValidationError);
    });

    it('means no filter when absent', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO');

      expect(list.mock.calls[0]?.[1].status).toBeUndefined();
    });
  });

  describe('the search filter', () => {
    it('passes a term through', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO', { search: 'Ana' });

      expect(list.mock.calls[0]?.[1].search).toBe('Ana');
    });

    it('trims the term', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO', { search: '  Ana  ' });

      expect(list.mock.calls[0]?.[1].search).toBe('Ana');
    });

    it('treats a blank term as no filter, not as matching everything', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO', { search: '   ' });

      expect(list.mock.calls[0]?.[1].search).toBeUndefined();
    });

    it('refuses an absurdly long term', async () => {
      const { useCase } = build();

      await expect(useCase.execute('DEMO', { search: 'x'.repeat(200) })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('the range', () => {
    it('is absent when neither end is given, meaning all time', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO');

      expect(list.mock.calls[0]?.[1].range).toBeUndefined();
    });

    it('fills in an open start', async () => {
      const { list, useCase } = build();

      await useCase.execute('DEMO', { to: new Date('2026-07-21T00:00:00Z') });

      expect(list.mock.calls[0]?.[1].range?.from).toEqual(new Date(0));
    });

    it('refuses a range that ends before it starts', async () => {
      const { useCase } = build();

      await expect(
        useCase.execute('DEMO', {
          from: new Date('2026-07-21T00:00:00Z'),
          to: new Date('2026-07-20T00:00:00Z'),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('refuses an empty range, which can only return nothing', async () => {
      const at = new Date('2026-07-21T00:00:00Z');
      const { useCase } = build();

      await expect(useCase.execute('DEMO', { from: at, to: at })).rejects.toThrow(ValidationError);
    });
  });

  it('passes the queue filter through', async () => {
    const { list, useCase } = build();

    await useCase.execute('DEMO', { queueId: 'q9' });

    expect(list.mock.calls[0]?.[1].queueId).toBe('q9');
  });
});
