import type { LedgerEntry, Membership, MembershipProgram, Redemption, Reward } from '@nexa/types';

import type { NewLedgerEntry } from './ledger';

export interface ProgramRepository {
  findById(programId: string): Promise<MembershipProgram | null>;
  /** The owner's programme, whatever its status. */
  findByOwner(ownerRef: string): Promise<MembershipProgram | null>;
}

/**
 * A membership as the domain works with it.
 *
 * Carries the highest tier ever awarded, which the public DTO deliberately
 * omits: it is bookkeeping for the downgrade policy, not something a diner's
 * screen has any use for.
 */
export interface MembershipRecord extends Membership {
  heldTierPosition: number | null;
}

export interface MembershipRepository {
  findById(membershipId: string): Promise<MembershipRecord | null>;
  findByProgramAndUser(programId: string, userId: string): Promise<MembershipRecord | null>;
  create(programId: string, userId: string): Promise<MembershipRecord>;
  /** Records the highest tier ever awarded, for a never-demote policy. */
  setHeldTierPosition(membershipId: string, position: number): Promise<void>;
}

export interface LedgerRepository {
  listByMembership(membershipId: string): Promise<LedgerEntry[]>;
  /**
   * Appends a movement, or returns null when this cause was already recorded.
   *
   * The uniqueness of (membershipId, sourceRef) is enforced by the store, so a
   * racing duplicate loses there rather than in a read-then-write check.
   */
  append(entry: NewLedgerEntry): Promise<LedgerEntry | null>;
}

export interface RewardRepository {
  findById(rewardId: string): Promise<Reward | null>;
  listByProgram(programId: string, onlyActive?: boolean): Promise<Reward[]>;
}

/** A redemption about to be issued; the store assigns its timestamps. */
export interface NewRedemption {
  rewardId: string;
  membershipId: string;
  code: string;
  expiresAt: Date | null;
}

export interface RedemptionRepository {
  /** How many times this member has already taken this reward. */
  countForMember(rewardId: string, membershipId: string): Promise<number>;
  /**
   * Persists the debit and the redemption together, or neither.
   *
   * Atomicity is the point: a redemption without its debit is a free reward,
   * and a debit without its redemption is points taken for nothing.
   */
  issue(debit: NewLedgerEntry, redemption: NewRedemption): Promise<Redemption>;
  findByCode(code: string): Promise<Redemption | null>;
  markRedeemed(redemptionId: string, at: Date): Promise<Redemption>;
}
