import type { MembershipProgram, Reward } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type {
  ProgramDraft,
  ProgramWriteRepository,
  RewardDraft,
  TierDraft,
} from '../domain/program-repository';
import type { ProgramRepository } from '../domain/repositories';

/**
 * The owner's configuration of their programme.
 *
 * Validation lives here rather than in the router because these are business
 * rules, not request shapes: a tier scheme that cannot be climbed is a broken
 * programme however well-formed the JSON was.
 */
export class ManageProgram {
  constructor(
    private readonly programs: ProgramRepository,
    private readonly writes: ProgramWriteRepository,
  ) {}

  async create(ownerRef: string, draft: ProgramDraft): Promise<MembershipProgram> {
    const existing = await this.programs.findByOwner(ownerRef);
    if (existing) {
      throw new ValidationError('This restaurant already has a membership programme');
    }

    this.assertAccrualIsCoherent(draft);
    return this.writes.create(ownerRef, draft);
  }

  async update(ownerRef: string, draft: Partial<ProgramDraft>): Promise<MembershipProgram> {
    const program = await this.require(ownerRef);
    this.assertAccrualIsCoherent({ ...program, ...draft });
    return this.writes.update(program.id, draft);
  }

  /**
   * Opens the programme to members.
   *
   * A programme with no tiers would accrue visits nobody can spend or climb
   * with, which reads to a diner as a broken feature rather than an empty one.
   */
  async publish(ownerRef: string): Promise<MembershipProgram> {
    const program = await this.require(ownerRef);
    if (program.tiers.length === 0) {
      throw new ValidationError('Add at least one level before publishing');
    }
    return this.writes.setStatus(program.id, 'active');
  }

  /**
   * Closes it to new activity without deleting anything.
   *
   * Members keep their balances: pausing is the owner stepping back, not a
   * reason to confiscate what people earned.
   */
  async pause(ownerRef: string): Promise<MembershipProgram> {
    const program = await this.require(ownerRef);
    return this.writes.setStatus(program.id, 'paused');
  }

  async replaceTiers(ownerRef: string, tiers: TierDraft[]): Promise<MembershipProgram> {
    const program = await this.require(ownerRef);
    this.assertTiersAreClimbable(tiers);
    return this.writes.replaceTiers(program.id, tiers);
  }

  async createReward(ownerRef: string, draft: RewardDraft): Promise<Reward> {
    const program = await this.require(ownerRef);
    this.assertRewardIsReachable(program, draft);
    return this.writes.createReward(program.id, draft);
  }

  async updateReward(
    ownerRef: string,
    rewardId: string,
    draft: Partial<RewardDraft>,
  ): Promise<Reward> {
    await this.require(ownerRef);
    return this.writes.updateReward(rewardId, draft);
  }

  private async require(ownerRef: string): Promise<MembershipProgram> {
    const program = await this.programs.findByOwner(ownerRef);
    if (!program) throw new NotFoundError('This restaurant has no membership programme');
    return program;
  }

  private assertAccrualIsCoherent(
    draft: Pick<
      ProgramDraft,
      'accrualMode' | 'pointsPerVisit' | 'tierMetric' | 'tierPeriod' | 'tierWindowDays'
    >,
  ): void {
    const earnsPoints = draft.accrualMode === 'points' || draft.accrualMode === 'both';

    if (earnsPoints && draft.pointsPerVisit <= 0) {
      throw new ValidationError('A points programme must award more than zero per visit');
    }

    // Ranking members by a quantity they never earn leaves everyone at the
    // entry level forever.
    if (draft.tierMetric === 'points' && !earnsPoints) {
      throw new ValidationError('Levels cannot be measured in points unless visits earn points');
    }

    if (draft.tierPeriod === 'rolling' && !draft.tierWindowDays) {
      throw new ValidationError('A rolling period needs a window in days');
    }
  }

  private assertTiersAreClimbable(tiers: TierDraft[]): void {
    if (tiers.length === 0) return;

    const byPosition = [...tiers].sort((a, b) => a.position - b.position);

    const positions = new Set(byPosition.map((tier) => tier.position));
    if (positions.size !== byPosition.length) {
      throw new ValidationError('Two levels cannot share a position');
    }

    // Thresholds must rise with position, or a member reaching level three
    // would already have passed level two and the order would be a lie.
    for (const [index, tier] of byPosition.entries()) {
      const previous = byPosition[index - 1];
      if (previous && tier.threshold <= previous.threshold) {
        throw new ValidationError(
          `"${tier.name}" must require more than "${previous.name}" to be a step up`,
        );
      }
    }
  }

  private assertRewardIsReachable(program: MembershipProgram, draft: RewardDraft): void {
    if (draft.costPoints < 0) throw new ValidationError('A reward cannot cost negative points');

    if (
      draft.minTierPosition !== null &&
      !program.tiers.some((tier) => tier.position === draft.minTierPosition)
    ) {
      throw new ValidationError('That level does not exist in this programme');
    }

    if (draft.limitPerMember !== null && draft.limitPerMember < 1) {
      throw new ValidationError('A limit must allow at least one redemption');
    }
  }
}
