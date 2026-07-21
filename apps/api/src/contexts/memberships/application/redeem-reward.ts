import type { Redemption } from '@nexa/types';

import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/errors';
import { spendablePoints } from '../domain/ledger';
import { generateRedemptionCode, type RandomSource } from '../domain/redemption-code';
import type {
  LedgerRepository,
  MembershipRepository,
  ProgramRepository,
  RedemptionRepository,
  RewardRepository,
} from '../domain/repositories';
import { balanceFor } from '../domain/tier-policy';

/** How long an issued code stays valid before it lapses. */
const VALID_FOR_DAYS = 30;

/**
 * Spends points on a reward.
 *
 * Rewards cost the restaurant real product, so every gate is checked before
 * anything is written, and the debit and the redemption are persisted together
 * or not at all.
 */
export class RedeemReward {
  constructor(
    private readonly programs: ProgramRepository,
    private readonly memberships: MembershipRepository,
    private readonly ledger: LedgerRepository,
    private readonly rewards: RewardRepository,
    private readonly redemptions: RedemptionRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly random: RandomSource = Math.random,
  ) {}

  async execute(membershipId: string, rewardId: string): Promise<Redemption> {
    const membership = await this.memberships.findById(membershipId);
    if (!membership) throw new NotFoundError('Membership not found');
    if (membership.status !== 'active') {
      throw new ForbiddenError('This membership is no longer active');
    }

    const reward = await this.rewards.findById(rewardId);
    if (!reward) throw new NotFoundError('Reward not found');
    if (!reward.isActive) throw new ForbiddenError('This reward is not available');

    // A reward belongs to one programme; redeeming across programmes would
    // spend points earned somewhere else.
    if (reward.programId !== membership.programId) {
      throw new ForbiddenError('This reward belongs to another programme');
    }

    const program = await this.programs.findById(membership.programId);
    if (!program) throw new NotFoundError('Membership programme not found');

    const entries = await this.ledger.listByMembership(membershipId);
    const at = this.now();
    const balance = balanceFor(program, entries, at, membership.heldTierPosition);

    if (reward.minTierPosition !== null) {
      const held = program.tiers.find((tier) => tier.id === balance.tierId);
      if (!held || held.position < reward.minTierPosition) {
        throw new ForbiddenError('Your level does not include this reward yet');
      }
    }

    const available = spendablePoints(entries);
    if (available < reward.costPoints) {
      throw new ValidationError('Not enough points for this reward', {
        required: reward.costPoints,
        available,
      });
    }

    if (reward.limitPerMember !== null) {
      const taken = await this.redemptions.countForMember(rewardId, membershipId);
      if (taken >= reward.limitPerMember) {
        throw new ForbiddenError('You have already claimed this reward');
      }
    }

    const code = generateRedemptionCode(this.random);

    return this.redemptions.issue(
      {
        membershipId,
        kind: 'redemption',
        // Negative: the ledger sums to a balance, so spending is a movement
        // down rather than a separate "spent" column that could disagree.
        points: -reward.costPoints,
        visits: 0,
        sourceRef: `redemption:${code}`,
        note: reward.name,
        occurredAt: at,
      },
      {
        rewardId,
        membershipId,
        code,
        expiresAt: new Date(at.getTime() + VALID_FOR_DAYS * 86_400_000),
      },
    );
  }
}
