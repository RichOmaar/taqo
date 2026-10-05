import type { WaitlistEntry, WaitlistHistoryEntry } from '@nexa/types';
import { describe, expect, it } from 'vitest';

import {
  csvField,
  csvFilename,
  isLive,
  liveEntries,
  partyLabel,
  toCsv,
  waitLabel,
} from './waitlist-view';

function entry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id: 'e1',
    queueId: 'q1',
    restaurantId: 'r1',
    userId: null,
    displayName: 'Ana',
    partySize: 2,
    phone: null,
    status: 'waiting',
    position: 1,
    etaMinutes: 10,
    etaIsManual: false,
    formData: {},
    joinedAt: '2026-07-21T12:00:00.000Z',
    notifiedAt: null,
    seatedAt: null,
    ...overrides,
  };
}

function historyEntry(overrides: Partial<WaitlistHistoryEntry> = {}): WaitlistHistoryEntry {
  return {
    id: 'e1',
    queueId: 'q1',
    queueName: 'General',
    displayName: 'Ana',
    partySize: 2,
    status: 'seated',
    joinedAt: '2026-07-21T12:00:00.000Z',
    notifiedAt: '2026-07-21T12:10:00.000Z',
    seatedAt: '2026-07-21T12:12:00.000Z',
    waitMinutes: 12,
    ...overrides,
  };
}

describe('isLive', () => {
  it('counts a waiting diner', () => {
    expect(isLive(entry({ status: 'waiting' }))).toBe(true);
  });

  it('counts a notified diner, who is still waiting for their table', () => {
    expect(isLive(entry({ status: 'notified' }))).toBe(true);
  });

  it('does not count a seated diner', () => {
    expect(isLive(entry({ status: 'seated' }))).toBe(false);
  });

  it('does not count a no-show', () => {
    expect(isLive(entry({ status: 'no_show' }))).toBe(false);
  });

  it('does not count a cancellation', () => {
    expect(isLive(entry({ status: 'cancelled' }))).toBe(false);
  });
});

describe('liveEntries', () => {
  it('drops everyone who has left the queue', () => {
    const entries = [entry({ id: 'a' }), entry({ id: 'b', status: 'seated', position: 2 })];

    expect(liveEntries(entries).map((row) => row.id)).toEqual(['a']);
  });

  it('orders by position, not by arrival in the array', () => {
    // The socket delivers updates in whatever order they happen.
    const entries = [entry({ id: 'b', position: 2 }), entry({ id: 'a', position: 1 })];

    expect(liveEntries(entries).map((row) => row.id)).toEqual(['a', 'b']);
  });

  it('does not mutate what it was given', () => {
    const entries = [entry({ id: 'b', position: 2 }), entry({ id: 'a', position: 1 })];
    liveEntries(entries);

    expect(entries.map((row) => row.id)).toEqual(['b', 'a']);
  });
});

describe('waitLabel', () => {
  it('shows the minutes', () => {
    expect(waitLabel(12)).toBe('12 min');
  });

  it('shows a dash for a wait nobody served', () => {
    expect(waitLabel(null)).toBe('—');
  });

  it('shows zero rather than a dash, which means something different', () => {
    expect(waitLabel(0)).toBe('0 min');
  });
});

describe('partyLabel', () => {
  it('agrees in the singular', () => {
    expect(partyLabel(1)).toBe('1 persona');
  });

  it('agrees in the plural', () => {
    expect(partyLabel(4)).toBe('4 personas');
  });
});

describe('csvField', () => {
  it('quotes a plain value', () => {
    expect(csvField('Ana')).toBe('"Ana"');
  });

  it('escapes an embedded quote by doubling it', () => {
    expect(csvField('Ana "La Jefa"')).toBe('"Ana ""La Jefa"""');
  });

  it('survives a comma, which would otherwise shift every later column', () => {
    expect(csvField('Pérez, Ana')).toBe('"Pérez, Ana"');
  });

  it('survives a newline in a name', () => {
    expect(csvField('Ana\nMaría')).toBe('"Ana\nMaría"');
  });

  it('renders a number', () => {
    expect(csvField(4)).toBe('"4"');
  });

  it('renders zero, not an empty cell', () => {
    expect(csvField(0)).toBe('"0"');
  });

  it('renders null as an empty cell', () => {
    expect(csvField(null)).toBe('""');
  });

  describe('formula injection', () => {
    // A spreadsheet runs a leading =, +, - or @ as a formula, so a diner could
    // name themselves one and have it execute when staff open the export.
    it('defuses a leading equals', () => {
      expect(csvField('=1+1')).toBe(`"'=1+1"`);
    });

    it('defuses a leading plus', () => {
      expect(csvField('+1')).toBe(`"'+1"`);
    });

    it('defuses a leading minus', () => {
      expect(csvField('-1')).toBe(`"'-1"`);
    });

    it('defuses a leading at sign', () => {
      expect(csvField('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
    });

    it('defuses the classic command payload', () => {
      expect(csvField("=cmd|' /C calc'!A0")).toContain(`'=cmd`);
    });

    it('leaves an ordinary name alone', () => {
      expect(csvField('Ana')).not.toContain("'");
    });

    it('leaves a minus in the middle alone', () => {
      expect(csvField('Ana-María')).toBe('"Ana-María"');
    });
  });
});

describe('toCsv', () => {
  it('starts with a header row', () => {
    expect(toCsv([]).split('\n')[0]).toContain('"Nombre"');
  });

  it('writes a row per entry', () => {
    const csv = toCsv([historyEntry(), historyEntry({ id: 'e2', displayName: 'Beto' })]);

    expect(csv.trim().split('\n')).toHaveLength(3);
  });

  it('writes the diner name', () => {
    expect(toCsv([historyEntry()])).toContain('"Ana"');
  });

  it('writes the status in Spanish, as the panel shows it', () => {
    expect(toCsv([historyEntry({ status: 'no_show' })])).toContain('"No-show"');
  });

  it('leaves an unreached timestamp blank', () => {
    const csv = toCsv([historyEntry({ status: 'no_show', seatedAt: null, waitMinutes: null })]);

    expect(csv).toContain('"",""');
  });

  it('ends with a newline, so POSIX tools do not read it as truncated', () => {
    expect(toCsv([historyEntry()]).endsWith('\n')).toBe(true);
  });

  it('has a header even with no entries, so the file is still readable', () => {
    expect(toCsv([]).trim().split('\n')).toHaveLength(1);
  });

  it('keeps every column aligned when a name contains a comma', () => {
    const csv = toCsv([historyEntry({ displayName: 'Pérez, Ana' })]);
    const row = csv.trim().split('\n')[1]!;

    // Eight quoted fields, whatever is inside them.
    expect(row.match(/"(?:[^"]|"")*"/g)).toHaveLength(8);
  });
});

describe('csvFilename', () => {
  it('stamps the date, so downloads do not collide', () => {
    expect(csvFilename(new Date('2026-07-21T12:00:00Z'))).toBe('lista-de-espera-2026-07-21.csv');
  });
});
