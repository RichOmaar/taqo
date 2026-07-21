import type { MembershipProgram, Redemption, Reward } from '@nexa/types';
import type { PrismaClient } from '@prisma/client';

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
import {
  isUniqueViolation,
  toLedgerEntry,
  toMembership,
  toProgram,
  toRedemption,
  toReward,
} from './mappers';

/** Tiers always travel with their programme; a programme without them is unusable. */
const WITH_TIERS = { tiers: true } as const;

export class PrismaProgramRepository implements ProgramRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(programId: string): Promise<MembershipProgram | null> {
    const row = await this.prisma.membershipProgram.findUnique({
      where: { id: programId },
      include: WITH_TIERS,
    });
    return row ? toProgram(row) : null;
  }

  async findByOwner(ownerRef: string): Promise<MembershipProgram | null> {
    const row = await this.prisma.membershipProgram.findFirst({
      where: { ownerRef },
      include: WITH_TIERS,
      orderBy: { createdAt: 'asc' },
    });
    return row ? toProgram(row) : null;
  }
}

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(membershipId: string): Promise<MembershipRecord | null> {
    const row = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    return row ? toMembership(row) : null;
  }

  async findByProgramAndUser(programId: string, userId: string): Promise<MembershipRecord | null> {
    const row = await this.prisma.membership.findUnique({
      where: { programId_userId: { programId, userId } },
    });
    return row ? toMembership(row) : null;
  }

  async create(programId: string, userId: string): Promise<MembershipRecord> {
    return toMembership(await this.prisma.membership.create({ data: { programId, userId } }));
  }

  async setHeldTierPosition(membershipId: string, position: number): Promise<void> {
    await this.prisma.membership.update({
      where: { id: membershipId },
      data: { heldTierPosition: position },
    });
  }
}

export class PrismaLedgerRepository implements LedgerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByMembership(membershipId: string) {
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { membershipId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map(toLedgerEntry);
  }

  /**
   * Appends a movement, or reports the cause as already recorded.
   *
   * The unique (membershipId, sourceRef) index is what decides, not a prior
   * read: two concurrent deliveries would both pass a read-then-write check,
   * and exactly one loses here.
   */
  async append(entry: NewLedgerEntry) {
    try {
      const row = await this.prisma.ledgerEntry.create({
        data: {
          membershipId: entry.membershipId,
          kind: entry.kind,
          points: entry.points,
          visits: entry.visits,
          sourceRef: entry.sourceRef,
          note: entry.note ?? null,
          occurredAt: entry.occurredAt,
        },
      });
      return toLedgerEntry(row);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }
}

export class PrismaRewardRepository implements RewardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(rewardId: string): Promise<Reward | null> {
    const row = await this.prisma.reward.findUnique({ where: { id: rewardId } });
    return row ? toReward(row) : null;
  }

  async listByProgram(programId: string, onlyActive = false): Promise<Reward[]> {
    const rows = await this.prisma.reward.findMany({
      where: { programId, ...(onlyActive && { isActive: true }) },
      orderBy: [{ costPoints: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toReward);
  }
}

export class PrismaRedemptionRepository implements RedemptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  countForMember(rewardId: string, membershipId: string): Promise<number> {
    // A cancelled redemption gave nothing away, so it does not use up an
    // allowance; anything issued or already taken does.
    return this.prisma.redemption.count({
      where: { rewardId, membershipId, status: { in: ['issued', 'redeemed', 'expired'] } },
    });
  }

  /**
   * Writes the debit and the redemption together.
   *
   * One transaction because neither is meaningful alone: a redemption without
   * its debit is a free reward, a debit without its redemption is points taken
   * for nothing.
   */
  async issue(debit: NewLedgerEntry, redemption: NewRedemption): Promise<Redemption> {
    return this.prisma.$transaction(async (tx) => {
      await tx.ledgerEntry.create({
        data: {
          membershipId: debit.membershipId,
          kind: debit.kind,
          points: debit.points,
          visits: debit.visits,
          sourceRef: debit.sourceRef,
          note: debit.note ?? null,
          occurredAt: debit.occurredAt,
        },
      });

      const row = await tx.redemption.create({
        data: {
          rewardId: redemption.rewardId,
          membershipId: redemption.membershipId,
          code: redemption.code,
          expiresAt: redemption.expiresAt,
        },
      });

      return toRedemption(row);
    });
  }

  async findByCode(code: string): Promise<Redemption | null> {
    const row = await this.prisma.redemption.findUnique({ where: { code } });
    return row ? toRedemption(row) : null;
  }

  async markRedeemed(redemptionId: string, at: Date): Promise<Redemption> {
    const row = await this.prisma.redemption.update({
      where: { id: redemptionId },
      data: { status: 'redeemed', redeemedAt: at },
    });
    return toRedemption(row);
  }
}
