import type { LedgerEntry, MembershipProgram, ProgramStatus } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import type { NewLedgerEntry } from '../domain/ledger';
import type {
  LedgerRepository,
  MembershipRecord,
  MembershipRepository,
  ProgramRepository,
} from '../domain/repositories';
import { RecordVisit, type SeatedVisit } from './record-visit';

const TIERS = [
  { id: 't0', name: 'Bronce', threshold: 0, benefits: [], position: 0 },
  { id: 't1', name: 'Plata', threshold: 2, benefits: [], position: 1 },
];

function program(overrides: Partial<MembershipProgram> = {}): MembershipProgram {
  return {
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

const SEATING: SeatedVisit = {
  sourceRef: 'entry:e1',
  userId: 'u1',
  ownerRef: 'r1',
  occurredAt: new Date('2026-07-21T20:00:00Z'),
};

function build(
  options: {
    prog?: MembershipProgram | null;
    member?: MembershipRecord | null;
    existing?: LedgerEntry[];
    duplicate?: boolean;
  } = {},
) {
  const { prog = program(), member = membership(), existing = [], duplicate = false } = options;

  const append = vi.fn<LedgerRepository['append']>().mockImplementation((entry: NewLedgerEntry) =>
    Promise.resolve(
      duplicate
        ? null
        : {
            id: 'l1',
            membershipId: entry.membershipId,
            kind: entry.kind,
            points: entry.points,
            visits: entry.visits,
            sourceRef: entry.sourceRef,
            note: entry.note ?? null,
            occurredAt: entry.occurredAt.toISOString(),
          },
    ),
  );

  const setHeldTierPosition = vi.fn<MembershipRepository['setHeldTierPosition']>();

  const programs = {
    findByOwner: () => Promise.resolve(prog),
    findById: () => Promise.resolve(prog),
  } as unknown as ProgramRepository;

  const memberships = {
    findByProgramAndUser: () => Promise.resolve(member),
    setHeldTierPosition,
  } as unknown as MembershipRepository;

  const ledger = {
    append,
    listByMembership: () => Promise.resolve(existing),
  } as unknown as LedgerRepository;

  return { append, setHeldTierPosition, useCase: new RecordVisit(programs, memberships, ledger) };
}

/** A recorded accrual, as it was handed to the ledger. */
function appended(append: ReturnType<typeof build>['append']): NewLedgerEntry {
  const call = append.mock.calls[0];
  if (!call) throw new Error('nothing was appended');
  return call[0];
}

describe('RecordVisit', () => {
  it('credits points and a visit for a member', async () => {
    const { append, useCase } = build();

    await useCase.execute(SEATING);

    expect(appended(append)).toMatchObject({
      kind: 'accrual',
      points: 10,
      visits: 1,
      sourceRef: 'entry:e1',
    });
  });

  it('credits only visits when the programme does not use points', async () => {
    const { append, useCase } = build({ prog: program({ accrualMode: 'visits' }) });

    await useCase.execute(SEATING);

    expect(appended(append)).toMatchObject({ points: 0, visits: 1 });
  });

  it('credits only points when the programme does not count visits', async () => {
    const { append, useCase } = build({ prog: program({ accrualMode: 'points' }) });

    await useCase.execute(SEATING);

    expect(appended(append)).toMatchObject({ points: 10, visits: 0 });
  });

  it('carries the cause through, so the ledger can reject a repeat', async () => {
    const { append, useCase } = build();

    await useCase.execute(SEATING);

    expect(appended(append).sourceRef).toBe('entry:e1');
  });

  describe('does nothing, quietly, when', () => {
    // Every one of these is an ordinary outcome. A seating must never fail
    // because loyalty had no reason to record it.
    it('the diner is a guest', async () => {
      const { append, useCase } = build();

      await useCase.execute({ ...SEATING, userId: null });

      expect(append).not.toHaveBeenCalled();
    });

    it('the restaurant has no programme', async () => {
      const { append, useCase } = build({ prog: null });

      await useCase.execute(SEATING);

      expect(append).not.toHaveBeenCalled();
    });

    it.each<ProgramStatus>(['draft', 'paused'])('the programme is %s', async (status) => {
      const { append, useCase } = build({ prog: program({ status }) });

      await useCase.execute(SEATING);

      expect(append).not.toHaveBeenCalled();
    });

    it('the diner is not a member', async () => {
      const { append, useCase } = build({ member: null });

      await useCase.execute(SEATING);

      expect(append).not.toHaveBeenCalled();
    });

    it('the membership was cancelled', async () => {
      const { append, useCase } = build({ member: membership({ status: 'cancelled' }) });

      await useCase.execute(SEATING);

      expect(append).not.toHaveBeenCalled();
    });
  });

  describe('promotion', () => {
    const twoVisits: LedgerEntry[] = [1, 2].map((n) => ({
      id: `l${n}`,
      membershipId: 'm1',
      kind: 'accrual' as const,
      points: 10,
      visits: 1,
      sourceRef: `entry:e${n}`,
      note: null,
      occurredAt: '2026-07-21T20:00:00.000Z',
    }));

    it('records a tier once its threshold is reached', async () => {
      const { setHeldTierPosition, useCase } = build({ existing: twoVisits });

      await useCase.execute(SEATING);

      expect(setHeldTierPosition).toHaveBeenCalledWith('m1', 1);
    });

    it('does not rewrite a tier the member already holds', async () => {
      const { setHeldTierPosition, useCase } = build({
        existing: twoVisits,
        member: membership({ heldTierPosition: 1 }),
      });

      await useCase.execute(SEATING);

      expect(setHeldTierPosition).not.toHaveBeenCalled();
    });

    it('never lowers a held tier here, since demotion is decided on read', async () => {
      const { setHeldTierPosition, useCase } = build({
        existing: [],
        member: membership({ heldTierPosition: 1 }),
      });

      await useCase.execute(SEATING);

      expect(setHeldTierPosition).not.toHaveBeenCalled();
    });
  });

  it('skips promotion entirely when the ledger rejected the entry as a repeat', async () => {
    // The store's unique constraint decided; there is nothing new to evaluate.
    const { setHeldTierPosition, useCase } = build({ duplicate: true });

    await useCase.execute(SEATING);

    expect(setHeldTierPosition).not.toHaveBeenCalled();
  });
});
