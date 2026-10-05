import type { LedgerEntry, MembershipProgram } from '@nexa/types';
import { describe, expect, it } from 'vitest';

import { balanceFor, effectiveTier, nextTier, tierFor, tierProgressFor } from './tier-policy';

const TIERS = [
  { id: 't0', name: 'Bronce', threshold: 0, benefits: [], position: 0 },
  { id: 't1', name: 'Plata', threshold: 5, benefits: [], position: 1 },
  { id: 't2', name: 'Oro', threshold: 15, benefits: [], position: 2 },
];

function program(overrides: Partial<MembershipProgram> = {}): MembershipProgram {
  return {
    id: 'p1',
    ownerRef: 'r1',
    name: 'Club Bistro',
    status: 'active',
    accrualMode: 'visits',
    pointsPerVisit: 10,
    tierMetric: 'visits',
    tierPeriod: 'lifetime',
    tierWindowDays: null,
    downgradePolicy: 'never',
    tiers: TIERS,
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

let sequence = 0;

function visit(at: string, points = 10): LedgerEntry {
  sequence += 1;
  return {
    id: `l${sequence}`,
    membershipId: 'm1',
    kind: 'accrual',
    points,
    visits: 1,
    sourceRef: `entry:${sequence}`,
    note: null,
    occurredAt: at,
  };
}

const NOW = new Date('2026-07-21T12:00:00Z');

describe('tierFor', () => {
  it('gives the highest tier the progress reaches', () => {
    expect(tierFor(program(), 16)?.name).toBe('Oro');
    expect(tierFor(program(), 5)?.name).toBe('Plata');
  });

  it('includes a threshold exactly met', () => {
    expect(tierFor(program(), 15)?.name).toBe('Oro');
  });

  it('gives the entry tier at zero, since its threshold is zero', () => {
    expect(tierFor(program(), 0)?.name).toBe('Bronce');
  });

  it('returns nothing when no tier is reachable', () => {
    const noEntryTier = program({ tiers: [TIERS[1]!, TIERS[2]!] });

    expect(tierFor(noEntryTier, 1)).toBeNull();
  });

  it('reads tiers by position, not by array order', () => {
    const shuffled = program({ tiers: [TIERS[2]!, TIERS[0]!, TIERS[1]!] });

    expect(tierFor(shuffled, 6)?.name).toBe('Plata');
  });
});

describe('tierProgressFor', () => {
  const ledger = [
    visit('2026-01-15T12:00:00Z'),
    visit('2026-07-01T12:00:00Z'),
    visit('2026-07-15T12:00:00Z'),
  ];

  it('counts every visit for a lifetime program', () => {
    expect(tierProgressFor(program(), ledger, NOW)).toBe(3);
  });

  it('counts only the window for a rolling program', () => {
    // January falls outside a 30-day window; the two July visits remain.
    const rolling = program({ tierPeriod: 'rolling', tierWindowDays: 30 });

    expect(tierProgressFor(rolling, ledger, NOW)).toBe(2);
  });

  it('measures points when the program does', () => {
    const byPoints = program({ tierMetric: 'points' });

    expect(tierProgressFor(byPoints, ledger, NOW)).toBe(30);
  });

  it('ignores redemptions, so spending does not demote anyone', () => {
    const spent: LedgerEntry = { ...visit(NOW.toISOString()), kind: 'redemption', points: -100 };

    expect(tierProgressFor(program({ tierMetric: 'points' }), [...ledger, spent], NOW)).toBe(30);
  });
});

describe('effectiveTier', () => {
  it('promotes as soon as the threshold is met', () => {
    expect(effectiveTier(program(), 15, 1)?.name).toBe('Oro');
  });

  it('keeps a tier already earned when the policy never demotes', () => {
    // The rolling window moved past the visits that earned Oro; the member
    // keeps it because the program promised they would.
    expect(effectiveTier(program({ downgradePolicy: 'never' }), 2, 2)?.name).toBe('Oro');
  });

  it('demotes when the policy says progress must be maintained', () => {
    const demoting = program({ downgradePolicy: 'on_period_exit' });

    expect(effectiveTier(demoting, 2, 2)?.name).toBe('Bronce');
  });

  it('uses current progress for a member holding nothing yet', () => {
    expect(effectiveTier(program(), 6, null)?.name).toBe('Plata');
  });

  it('falls back to current progress when the held tier no longer exists', () => {
    // The owner deleted a tier; a member cannot hold a level that is gone.
    expect(effectiveTier(program(), 6, 9)?.name).toBe('Plata');
  });
});

describe('nextTier', () => {
  it('reports the next level and the distance to it', () => {
    expect(nextTier(program(), 3)).toEqual({ name: 'Plata', remaining: 2 });
  });

  it('reports nothing at the top', () => {
    expect(nextTier(program(), 20)).toBeNull();
  });

  it('skips a tier already reached', () => {
    expect(nextTier(program(), 5)).toEqual({ name: 'Oro', remaining: 10 });
  });
});

describe('balanceFor', () => {
  it('reports spendable points separately from tier standing', () => {
    const ledger = [
      visit('2026-07-01T12:00:00Z'),
      visit('2026-07-02T12:00:00Z'),
      visit('2026-07-03T12:00:00Z'),
      visit('2026-07-04T12:00:00Z'),
      visit('2026-07-05T12:00:00Z'),
      { ...visit('2026-07-06T12:00:00Z'), kind: 'redemption' as const, points: -30, visits: 0 },
    ];

    const balance = balanceFor(program(), ledger, NOW);

    // Spent 30 of 50 points, but the five visits still stand.
    expect(balance.points).toBe(20);
    expect(balance.visits).toBe(5);
    expect(balance.tierName).toBe('Plata');
  });

  it('gives a brand-new member the entry tier and a target', () => {
    const balance = balanceFor(program(), [], NOW);

    expect(balance).toMatchObject({
      points: 0,
      visits: 0,
      tierName: 'Bronce',
      nextTier: { name: 'Plata', remaining: 5 },
    });
  });
});
