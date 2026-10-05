import type {
  LedgerEntry,
  MembershipProgram,
  MembershipTier,
  Redemption,
  Reward,
} from '@nexa/types';
import { Prisma } from '@prisma/client';
import type {
  LedgerEntry as PrismaLedgerEntry,
  Membership as PrismaMembership,
  MembershipProgram as PrismaProgram,
  MembershipTier as PrismaTier,
  Redemption as PrismaRedemption,
  Reward as PrismaReward,
} from '@prisma/client';

import type { MembershipRecord } from '../domain/repositories';

/** Postgres reports a unique-constraint breach as P2002. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function toTier(row: PrismaTier): MembershipTier {
  return {
    id: row.id,
    name: row.name,
    threshold: row.threshold,
    benefits: row.benefits,
    position: row.position,
  };
}

export function toProgram(row: PrismaProgram & { tiers: PrismaTier[] }): MembershipProgram {
  return {
    id: row.id,
    ownerRef: row.ownerRef,
    name: row.name,
    status: row.status,
    accrualMode: row.accrualMode,
    pointsPerVisit: row.pointsPerVisit,
    tierMetric: row.tierMetric,
    tierPeriod: row.tierPeriod,
    tierWindowDays: row.tierWindowDays,
    downgradePolicy: row.downgradePolicy,
    tiers: [...row.tiers].sort((a, b) => a.position - b.position).map(toTier),
    version: row.version,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toMembership(row: PrismaMembership): MembershipRecord {
  return {
    id: row.id,
    programId: row.programId,
    userId: row.userId,
    status: row.status,
    heldTierPosition: row.heldTierPosition,
    enrolledAt: row.enrolledAt.toISOString(),
  };
}

export function toLedgerEntry(row: PrismaLedgerEntry): LedgerEntry {
  return {
    id: row.id,
    membershipId: row.membershipId,
    kind: row.kind,
    points: row.points,
    visits: row.visits,
    sourceRef: row.sourceRef,
    note: row.note,
    occurredAt: row.occurredAt.toISOString(),
  };
}

export function toReward(row: PrismaReward): Reward {
  return {
    id: row.id,
    programId: row.programId,
    name: row.name,
    description: row.description,
    costPoints: row.costPoints,
    minTierPosition: row.minTierPosition,
    limitPerMember: row.limitPerMember,
    isActive: row.isActive,
  };
}

export function toRedemption(row: PrismaRedemption): Redemption {
  return {
    id: row.id,
    rewardId: row.rewardId,
    membershipId: row.membershipId,
    code: row.code,
    status: row.status,
    issuedAt: row.issuedAt.toISOString(),
    redeemedAt: row.redeemedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}
