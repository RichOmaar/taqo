import { balanceFor } from '../domain/tier-policy';
import type {
  LedgerRepository,
  MembershipRepository,
  ProgramRepository,
} from '../domain/repositories';

/** What the waitlist context reports when a diner is seated. */
export interface SeatedVisit {
  /** Identifies the cause, making the accrual idempotent. */
  sourceRef: string;
  /** Whose visit; guests have no membership and are ignored. */
  userId: string | null;
  /** Which restaurant seated them, matched against the programme owner. */
  ownerRef: string;
  occurredAt: Date;
}

/**
 * Credits a seating to a member's ledger.
 *
 * Every reason to do nothing is a normal outcome, not an error: most diners are
 * guests, most restaurants have no programme, and a re-delivered event is
 * expected. A seating must never fail because loyalty declined to record it.
 */
export class RecordVisit {
  constructor(
    private readonly programs: ProgramRepository,
    private readonly memberships: MembershipRepository,
    private readonly ledger: LedgerRepository,
  ) {}

  async execute(visit: SeatedVisit): Promise<void> {
    // A guest has no durable identity to attach a balance to.
    if (!visit.userId) return;

    const program = await this.programs.findByOwner(visit.ownerRef);
    if (!program || program.status !== 'active') return;

    const membership = await this.memberships.findByProgramAndUser(program.id, visit.userId);
    if (!membership || membership.status !== 'active') return;

    const earnsPoints = program.accrualMode === 'points' || program.accrualMode === 'both';
    const earnsVisits = program.accrualMode === 'visits' || program.accrualMode === 'both';

    // Returns null when this cause was already recorded; the store's unique
    // constraint is what decides, so two racing deliveries cannot both win.
    const appended = await this.ledger.append({
      membershipId: membership.id,
      kind: 'accrual',
      points: earnsPoints ? program.pointsPerVisit : 0,
      visits: earnsVisits ? 1 : 0,
      sourceRef: visit.sourceRef,
      occurredAt: visit.occurredAt,
    });
    if (!appended) return;

    await this.promoteIfEarned(
      program.id,
      membership.id,
      membership.heldTierPosition ?? null,
      visit.occurredAt,
    );
  }

  /**
   * Records a promotion so it survives the rolling window moving on.
   *
   * Only ever raises the held position: demotion, where a programme allows it,
   * is decided when the balance is read, not written here.
   */
  private async promoteIfEarned(
    programId: string,
    membershipId: string,
    heldPosition: number | null,
    now: Date,
  ): Promise<void> {
    const program = await this.programs.findById(programId);
    if (!program) return;

    const entries = await this.ledger.listByMembership(membershipId);
    const balance = balanceFor(program, entries, now, heldPosition);
    const reached = program.tiers.find((tier) => tier.id === balance.tierId);

    if (reached && reached.position > (heldPosition ?? -1)) {
      await this.memberships.setHeldTierPosition(membershipId, reached.position);
    }
  }
}
