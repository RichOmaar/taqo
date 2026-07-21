import type {
  AccrualMode,
  DowngradePolicy,
  MembershipProgram,
  ProgramStatus,
  Reward,
  TierMetric,
  TierPeriod,
} from '@nexa/types';

/** Tier as the owner defines it; the store assigns the id. */
export interface TierDraft {
  name: string;
  threshold: number;
  benefits: string[];
  position: number;
}

export interface ProgramDraft {
  name: string;
  accrualMode: AccrualMode;
  pointsPerVisit: number;
  tierMetric: TierMetric;
  tierPeriod: TierPeriod;
  tierWindowDays: number | null;
  downgradePolicy: DowngradePolicy;
}

export interface RewardDraft {
  name: string;
  description: string | null;
  costPoints: number;
  minTierPosition: number | null;
  limitPerMember: number | null;
  isActive: boolean;
}

/** Write side of a programme, used by the owner's configuration screens. */
export interface ProgramWriteRepository {
  create(ownerRef: string, draft: ProgramDraft): Promise<MembershipProgram>;
  update(programId: string, draft: Partial<ProgramDraft>): Promise<MembershipProgram>;
  setStatus(programId: string, status: ProgramStatus): Promise<MembershipProgram>;
  /**
   * Replaces the tier scheme wholesale and bumps the version.
   *
   * Wholesale because tiers are meaningless individually — a threshold only
   * makes sense relative to its neighbours — and versioned so a tier already
   * awarded stays readable against the rules that granted it.
   */
  replaceTiers(programId: string, tiers: TierDraft[]): Promise<MembershipProgram>;
  createReward(programId: string, draft: RewardDraft): Promise<Reward>;
  updateReward(rewardId: string, draft: Partial<RewardDraft>): Promise<Reward>;
}
