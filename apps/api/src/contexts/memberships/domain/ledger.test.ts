import type { LedgerEntry, LedgerKind } from '@nexa/types';
import { describe, expect, it } from 'vitest';

import { alreadyRecorded, earnedEver, earnedWithin, spendablePoints, totals } from './ledger';

let sequence = 0;

function entry(overrides: Partial<LedgerEntry> & { kind?: LedgerKind } = {}): LedgerEntry {
  sequence += 1;
  return {
    id: `l${sequence}`,
    membershipId: 'm1',
    kind: 'accrual',
    points: 0,
    visits: 0,
    sourceRef: `entry:${sequence}`,
    note: null,
    occurredAt: '2026-07-21T12:00:00.000Z',
    ...overrides,
  };
}

describe('totals', () => {
  it('sums an empty ledger to nothing', () => {
    expect(totals([])).toEqual({ points: 0, visits: 0 });
  });

  it('adds accruals', () => {
    const ledger = [entry({ points: 10, visits: 1 }), entry({ points: 15, visits: 1 })];

    expect(totals(ledger)).toEqual({ points: 25, visits: 2 });
  });

  it('subtracts a redemption, which carries negative points', () => {
    const ledger = [entry({ points: 100, visits: 5 }), entry({ kind: 'redemption', points: -40 })];

    expect(totals(ledger)).toEqual({ points: 60, visits: 5 });
  });

  it('applies a correction as an adjustment rather than an edit', () => {
    // The mistaken entry stays; the correction sits beside it.
    const ledger = [
      entry({ points: 500, visits: 1, note: 'typo' }),
      entry({ kind: 'adjustment', points: -450, note: 'corrige captura' }),
    ];

    expect(totals(ledger).points).toBe(50);
  });

  it('never reports a negative balance', () => {
    // Redemption rules prevent overspending; a negative total would be an
    // impossible figure to show a member.
    const ledger = [entry({ points: 10 }), entry({ kind: 'adjustment', points: -50 })];

    expect(totals(ledger).points).toBe(0);
  });

  it('subtracts an expiry', () => {
    const ledger = [entry({ points: 100 }), entry({ kind: 'expiry', points: -30 })];

    expect(totals(ledger).points).toBe(70);
  });
});

describe('earnedEver', () => {
  it('counts accruals only, so spending does not cost tier standing', () => {
    const ledger = [entry({ points: 100, visits: 4 }), entry({ kind: 'redemption', points: -80 })];

    expect(earnedEver(ledger)).toEqual({ points: 100, visits: 4 });
    expect(spendablePoints(ledger)).toBe(20);
  });

  it('ignores adjustments, which are corrections rather than earnings', () => {
    const ledger = [entry({ points: 50, visits: 2 }), entry({ kind: 'adjustment', points: 25 })];

    expect(earnedEver(ledger).points).toBe(50);
  });
});

describe('earnedWithin', () => {
  const january = entry({ points: 10, visits: 1, occurredAt: '2026-01-10T12:00:00.000Z' });
  const july = entry({ points: 20, visits: 2, occurredAt: '2026-07-10T12:00:00.000Z' });

  it('counts only what falls inside the window', () => {
    expect(earnedWithin([january, july], new Date('2026-06-01T00:00:00Z'))).toEqual({
      points: 20,
      visits: 2,
    });
  });

  it('includes an entry exactly on the boundary', () => {
    expect(earnedWithin([july], new Date('2026-07-10T12:00:00.000Z')).visits).toBe(2);
  });

  it('excludes redemptions from the window as well', () => {
    const spend = entry({ kind: 'redemption', points: -15, occurredAt: '2026-07-11T12:00:00Z' });

    expect(earnedWithin([july, spend], new Date('2026-06-01T00:00:00Z')).points).toBe(20);
  });
});

describe('alreadyRecorded', () => {
  it('recognises a cause it has already credited', () => {
    // The guard against a re-delivered seating crediting twice.
    const ledger = [entry({ sourceRef: 'entry:abc', points: 10, visits: 1 })];

    expect(alreadyRecorded(ledger, 'entry:abc')).toBe(true);
  });

  it('does not confuse a different cause', () => {
    const ledger = [entry({ sourceRef: 'entry:abc' })];

    expect(alreadyRecorded(ledger, 'entry:xyz')).toBe(false);
  });

  it('is false against an empty ledger', () => {
    expect(alreadyRecorded([], 'entry:abc')).toBe(false);
  });
});
