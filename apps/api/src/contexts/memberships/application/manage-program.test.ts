import type { MembershipProgram } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { ProgramDraft, ProgramWriteRepository, TierDraft } from '../domain/program-repository';
import type { ProgramRepository } from '../domain/repositories';
import { ManageProgram } from './manage-program';

const TIERS = [
  { id: 't0', name: 'Bronce', threshold: 0, benefits: [], position: 0 },
  { id: 't1', name: 'Plata', threshold: 5, benefits: [], position: 1 },
];

function program(overrides: Partial<MembershipProgram> = {}): MembershipProgram {
  return {
    id: 'p1',
    ownerRef: 'r1',
    name: 'Club Bistro',
    status: 'draft',
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

function draft(overrides: Partial<ProgramDraft> = {}): ProgramDraft {
  return {
    name: 'Club Bistro',
    accrualMode: 'both',
    pointsPerVisit: 10,
    tierMetric: 'visits',
    tierPeriod: 'lifetime',
    tierWindowDays: null,
    downgradePolicy: 'never',
    ...overrides,
  };
}

function build(existing: MembershipProgram | null = program()) {
  const writes = {
    create: vi.fn().mockResolvedValue(program()),
    update: vi.fn().mockResolvedValue(program()),
    setStatus: vi.fn().mockResolvedValue(program({ status: 'active' })),
    replaceTiers: vi.fn().mockResolvedValue(program({ version: 2 })),
    createReward: vi.fn().mockResolvedValue({}),
    updateReward: vi.fn().mockResolvedValue({}),
  } as unknown as ProgramWriteRepository;

  const programs = {
    findByOwner: () => Promise.resolve(existing),
    findById: () => Promise.resolve(existing),
  } as unknown as ProgramRepository;

  return { writes, useCase: new ManageProgram(programs, writes) };
}

describe('ManageProgram.create', () => {
  it('creates a programme for an owner who has none', async () => {
    const { writes, useCase } = build(null);

    await useCase.create('r1', draft());

    expect(writes.create).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({ name: 'Club Bistro' }),
    );
  });

  it('refuses a second programme for the same owner', async () => {
    const { useCase } = build();

    await expect(useCase.create('r1', draft())).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses points accrual that awards nothing', async () => {
    const { useCase } = build(null);

    await expect(
      useCase.create('r1', draft({ accrualMode: 'points', pointsPerVisit: 0 })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses ranking by points when visits never earn points', async () => {
    // Everyone would sit at the entry level forever.
    const { useCase } = build(null);

    await expect(
      useCase.create('r1', draft({ accrualMode: 'visits', tierMetric: 'points' })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses a rolling period with no window', async () => {
    const { useCase } = build(null);

    await expect(
      useCase.create('r1', draft({ tierPeriod: 'rolling', tierWindowDays: null })),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('ManageProgram.publish', () => {
  it('activates a programme that has levels', async () => {
    const { writes, useCase } = build();

    await useCase.publish('r1');

    expect(writes.setStatus).toHaveBeenCalledWith('p1', 'active');
  });

  it('refuses to publish a programme with no levels', async () => {
    // Members would accrue visits they can neither spend nor climb with.
    const { useCase } = build(program({ tiers: [] }));

    await expect(useCase.publish('r1')).rejects.toBeInstanceOf(ValidationError);
  });

  it('reports a missing programme rather than creating one', async () => {
    const { useCase } = build(null);

    await expect(useCase.publish('r1')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ManageProgram.pause', () => {
  it('pauses without touching balances', async () => {
    // Stepping back is not a reason to confiscate what members earned.
    const { writes, useCase } = build();

    await useCase.pause('r1');

    expect(writes.setStatus).toHaveBeenCalledWith('p1', 'paused');
  });
});

describe('ManageProgram.replaceTiers', () => {
  const tiers: TierDraft[] = [
    { name: 'Bronce', threshold: 0, benefits: [], position: 0 },
    { name: 'Plata', threshold: 5, benefits: [], position: 1 },
    { name: 'Oro', threshold: 15, benefits: [], position: 2 },
  ];

  it('replaces the scheme wholesale', async () => {
    const { writes, useCase } = build();

    await useCase.replaceTiers('r1', tiers);

    expect(writes.replaceTiers).toHaveBeenCalledWith('p1', tiers);
  });

  it('refuses thresholds that do not rise with position', async () => {
    // Otherwise reaching level three means you already passed level two, and
    // the ordering is a lie.
    const broken = [tiers[0]!, { ...tiers[1]!, threshold: 20 }, { ...tiers[2]!, threshold: 10 }];
    const { useCase } = build();

    await expect(useCase.replaceTiers('r1', broken)).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses two levels at the same position', async () => {
    const clashing = [tiers[0]!, { ...tiers[1]!, position: 0 }];
    const { useCase } = build();

    await expect(useCase.replaceTiers('r1', clashing)).rejects.toBeInstanceOf(ValidationError);
  });

  it('accepts an empty scheme, which simply cannot be published', async () => {
    const { writes, useCase } = build();

    await useCase.replaceTiers('r1', []);

    expect(writes.replaceTiers).toHaveBeenCalledWith('p1', []);
  });

  it('reads positions rather than array order', async () => {
    const shuffled = [tiers[2]!, tiers[0]!, tiers[1]!];
    const { useCase } = build();

    await expect(useCase.replaceTiers('r1', shuffled)).resolves.toBeDefined();
  });
});

describe('ManageProgram.createReward', () => {
  const reward = {
    name: 'Postre',
    description: null,
    costPoints: 50,
    minTierPosition: null,
    limitPerMember: null,
    isActive: true,
  };

  it('creates a reward against the programme', async () => {
    const { writes, useCase } = build();

    await useCase.createReward('r1', reward);

    expect(writes.createReward).toHaveBeenCalledWith('p1', reward);
  });

  it('refuses a reward gated behind a level that does not exist', async () => {
    const { useCase } = build();

    await expect(
      useCase.createReward('r1', { ...reward, minTierPosition: 9 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses a negative cost', async () => {
    const { useCase } = build();

    await expect(useCase.createReward('r1', { ...reward, costPoints: -10 })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('refuses a limit that allows nothing', async () => {
    const { useCase } = build();

    await expect(
      useCase.createReward('r1', { ...reward, limitPerMember: 0 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('allows a free reward gated only by level', async () => {
    const { useCase } = build();

    await expect(
      useCase.createReward('r1', { ...reward, costPoints: 0, minTierPosition: 1 }),
    ).resolves.toBeDefined();
  });
});
