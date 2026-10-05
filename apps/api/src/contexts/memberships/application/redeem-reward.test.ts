import type { LedgerEntry, MembershipProgram, Redemption, Reward } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/errors';
import type { NewLedgerEntry } from '../domain/ledger';
import type {
  LedgerRepository,
  MembershipRecord,
  MembershipRepository,
  NewRedemption,
  ProgramRepository,
  RedemptionRepository,
  RewardRepository,
} from '../domain/repositories';
import { RedeemReward } from './redeem-reward';

const TIERS = [
  { id: 't0', name: 'Bronce', threshold: 0, benefits: [], position: 0 },
  { id: 't1', name: 'Oro', threshold: 10, benefits: [], position: 1 },
];

const PROGRAM: MembershipProgram = {
  id: 'p1',
  ownerRef: 'r1',
  name: 'Club Bistro',
  status: 'active',
  accrualMode: 'both',
  pointsPerVisit: 10,
  tierMetric: 'visits',
  tierPeriod: 'lifetime',
  tierWindowDays: null,
  downgradePolicy: 'never',
  tiers: TIERS,
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function reward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: 'rw1',
    programId: 'p1',
    name: 'Postre de cortesía',
    description: null,
    costPoints: 50,
    minTierPosition: null,
    limitPerMember: null,
    isActive: true,
    ...overrides,
  };
}

function membership(overrides: Partial<MembershipRecord> = {}): MembershipRecord {
  return {
    id: 'm1',
    programId: 'p1',
    userId: 'u1',
    status: 'active',
    heldTierPosition: null,
    enrolledAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** A ledger holding `points` earned across `visits` accruals. */
function ledgerWith(points: number, visits = 1): LedgerEntry[] {
  return [
    {
      id: 'l1',
      membershipId: 'm1',
      kind: 'accrual',
      points,
      visits,
      sourceRef: 'entry:e1',
      note: null,
      occurredAt: '2026-07-01T12:00:00.000Z',
    },
  ];
}

function build(
  options: {
    member?: MembershipRecord | null;
    rw?: Reward | null;
    entries?: LedgerEntry[];
    alreadyTaken?: number;
  } = {},
) {
  const {
    member = membership(),
    rw = reward(),
    entries = ledgerWith(100),
    alreadyTaken = 0,
  } = options;

  const issue = vi
    .fn<RedemptionRepository['issue']>()
    .mockImplementation((_debit: NewLedgerEntry, redemption: NewRedemption) =>
      Promise.resolve({
        id: 'red1',
        rewardId: redemption.rewardId,
        membershipId: redemption.membershipId,
        code: redemption.code,
        status: 'issued',
        issuedAt: '2026-07-21T20:00:00.000Z',
        redeemedAt: null,
        expiresAt: redemption.expiresAt?.toISOString() ?? null,
      } satisfies Redemption),
    );

  const useCase = new RedeemReward(
    { findById: () => Promise.resolve(PROGRAM) } as unknown as ProgramRepository,
    { findById: () => Promise.resolve(member) } as unknown as MembershipRepository,
    { listByMembership: () => Promise.resolve(entries) } as unknown as LedgerRepository,
    { findById: () => Promise.resolve(rw) } as unknown as RewardRepository,
    {
      issue,
      countForMember: () => Promise.resolve(alreadyTaken),
    } as unknown as RedemptionRepository,
    () => new Date('2026-07-21T20:00:00Z'),
    () => 0.5,
  );

  return { issue, useCase };
}

/** The debit handed to the store alongside the redemption. */
function debit(issue: ReturnType<typeof build>['issue']): NewLedgerEntry {
  const call = issue.mock.calls[0];
  if (!call) throw new Error('nothing was issued');
  return call[0];
}

describe('RedeemReward', () => {
  it('issues a redemption with a code', async () => {
    const { useCase } = build();

    const redemption = await useCase.execute('m1', 'rw1');

    expect(redemption.code).toMatch(/^NX-[A-Z2-9]{6}$/);
    expect(redemption.status).toBe('issued');
  });

  it('debits the cost as a negative movement, not a separate column', async () => {
    const { issue, useCase } = build();

    await useCase.execute('m1', 'rw1');

    expect(debit(issue)).toMatchObject({ kind: 'redemption', points: -50, visits: 0 });
  });

  it('ties the debit to the code, so the pair can be traced', async () => {
    const { issue, useCase } = build();

    const redemption = await useCase.execute('m1', 'rw1');

    expect(debit(issue).sourceRef).toBe(`redemption:${redemption.code}`);
  });

  it('writes the debit and the redemption in one call, so neither can happen alone', async () => {
    // A redemption without its debit is a free reward; a debit without its
    // redemption is points taken for nothing.
    const { issue, useCase } = build();

    await useCase.execute('m1', 'rw1');

    expect(issue).toHaveBeenCalledTimes(1);
  });

  it('gives the code an expiry', async () => {
    const { useCase } = build();

    const redemption = await useCase.execute('m1', 'rw1');

    expect(Date.parse(redemption.expiresAt!)).toBeGreaterThan(Date.parse('2026-07-21T20:00:00Z'));
  });

  describe('refuses when', () => {
    it('the member cannot afford it', async () => {
      const { issue, useCase } = build({ entries: ledgerWith(20) });

      await expect(useCase.execute('m1', 'rw1')).rejects.toBeInstanceOf(ValidationError);
      expect(issue).not.toHaveBeenCalled();
    });

    it('the reward is switched off', async () => {
      const { useCase } = build({ rw: reward({ isActive: false }) });

      await expect(useCase.execute('m1', 'rw1')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('the reward belongs to another programme', async () => {
      // Otherwise points earned at one restaurant buy a reward at another.
      const { useCase } = build({ rw: reward({ programId: 'other' }) });

      await expect(useCase.execute('m1', 'rw1')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('the member has not reached the required tier', async () => {
      const { useCase } = build({
        rw: reward({ minTierPosition: 1 }),
        entries: ledgerWith(100, 1),
      });

      await expect(useCase.execute('m1', 'rw1')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('the per-member limit is already used up', async () => {
      const { useCase } = build({ rw: reward({ limitPerMember: 1 }), alreadyTaken: 1 });

      await expect(useCase.execute('m1', 'rw1')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('the membership was cancelled', async () => {
      const { useCase } = build({ member: membership({ status: 'cancelled' }) });

      await expect(useCase.execute('m1', 'rw1')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('the membership does not exist', async () => {
      const { useCase } = build({ member: null });

      await expect(useCase.execute('m1', 'rw1')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('the reward does not exist', async () => {
      const { useCase } = build({ rw: null });

      await expect(useCase.execute('m1', 'rw1')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  it('allows a tier-gated reward once the member qualifies', async () => {
    const { useCase } = build({
      rw: reward({ minTierPosition: 1, costPoints: 0 }),
      entries: ledgerWith(100, 10),
    });

    await expect(useCase.execute('m1', 'rw1')).resolves.toMatchObject({ status: 'issued' });
  });

  it('allows a repeat when the reward sets no limit', async () => {
    const { useCase } = build({ alreadyTaken: 7 });

    await expect(useCase.execute('m1', 'rw1')).resolves.toMatchObject({ status: 'issued' });
  });

  it('allows spending the balance down to exactly zero', async () => {
    const { useCase } = build({ entries: ledgerWith(50) });

    await expect(useCase.execute('m1', 'rw1')).resolves.toMatchObject({ status: 'issued' });
  });
});
