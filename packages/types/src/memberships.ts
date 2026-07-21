import type { ISODateString, UUID } from './common';
import type {
  AccrualMode,
  DowngradePolicy,
  LedgerKind,
  MembershipStatus,
  ProgramStatus,
  RedemptionStatus,
  TierMetric,
  TierPeriod,
} from './enums';

/** A level in a program, e.g. Plata at 10 visits. */
export interface MembershipTier {
  id: UUID;
  name: string;
  /** Value of the program's tier metric required to reach it. */
  threshold: number;
  benefits: string[];
  /** Ascending, starting at 0 for the entry level. */
  position: number;
}

/**
 * A loyalty program.
 *
 * `ownerRef` is an opaque reference rather than a restaurant foreign key, so
 * this context stays independent of `restaurant` and a Nexa-wide program later
 * is an additive change rather than a migration.
 */
export interface MembershipProgram {
  id: UUID;
  ownerRef: string;
  name: string;
  status: ProgramStatus;
  accrualMode: AccrualMode;
  /** Points earned per recorded visit, when points accrual is enabled. */
  pointsPerVisit: number;
  tierMetric: TierMetric;
  tierPeriod: TierPeriod;
  /** Length of the rolling window in days; null when the period is lifetime. */
  tierWindowDays: number | null;
  downgradePolicy: DowngradePolicy;
  tiers: MembershipTier[];
  /**
   * Bumped whenever the tier scheme changes, so a member's recorded tier can be
   * read against the rules that were in force when it was awarded.
   */
  version: number;
  createdAt: ISODateString;
}

export interface Membership {
  id: UUID;
  programId: UUID;
  /** Memberships require a registered diner; guests have no durable identity. */
  userId: UUID;
  status: MembershipStatus;
  enrolledAt: ISODateString;
}

/**
 * One immutable movement.
 *
 * The balance is the sum of these, never a stored figure: a mutable total
 * cannot be audited, corrected, or explained to a member who disputes it.
 */
export interface LedgerEntry {
  id: UUID;
  membershipId: UUID;
  kind: LedgerKind;
  /** Signed — positive on accrual, negative on redemption or expiry. */
  points: number;
  /** Visits credited, normally 0 or 1. */
  visits: number;
  /**
   * What caused the entry, unique per membership. Re-processing the same
   * seating must not credit twice, and this is what makes that impossible.
   */
  sourceRef: string;
  note: string | null;
  occurredAt: ISODateString;
}

/** Progress toward the next tier, or null once a member is at the top. */
export interface TierProgress {
  name: string;
  /** How much more of the tier metric is needed. */
  remaining: number;
}

/** Derived from the ledger; never stored as the source of truth. */
export interface MembershipBalance {
  points: number;
  visits: number;
  tierId: UUID | null;
  tierName: string | null;
  nextTier: TierProgress | null;
}

export interface Reward {
  id: UUID;
  programId: UUID;
  name: string;
  description: string | null;
  /** Points required; 0 for a reward gated only by tier. */
  costPoints: number;
  /** Lowest tier position that may redeem it; null for any member. */
  minTierPosition: number | null;
  /** How many times one member may redeem it; null for unlimited. */
  limitPerMember: number | null;
  isActive: boolean;
}

export interface Redemption {
  id: UUID;
  rewardId: UUID;
  membershipId: UUID;
  /** Shown to the diner and read back by the hostess. */
  code: string;
  status: RedemptionStatus;
  issuedAt: ISODateString;
  redeemedAt: ISODateString | null;
  expiresAt: ISODateString | null;
}

/** How many members sit in each tier. */
export interface TierHeadcount {
  tierId: UUID | null;
  tierName: string;
  members: number;
}

/** Program health, for the owner's analytics panel. */
export interface MembershipStats {
  totalMembers: number;
  /** Members with at least one accrual inside the reporting window. */
  activeMembers: number;
  tierDistribution: TierHeadcount[];
  redemptionsIssued: number;
  redemptionsRedeemed: number;
  /** Average visits per member over the window. */
  visitsPerMember: number;
}
