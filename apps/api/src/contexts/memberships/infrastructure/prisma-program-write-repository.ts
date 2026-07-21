import type { MembershipProgram, ProgramStatus, Reward } from '@nexa/types';
import type { PrismaClient } from '@prisma/client';

import type {
  ProgramDraft,
  ProgramWriteRepository,
  RewardDraft,
  TierDraft,
} from '../domain/program-repository';
import { toProgram, toReward } from './mappers';

export class PrismaProgramWriteRepository implements ProgramWriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(ownerRef: string, draft: ProgramDraft): Promise<MembershipProgram> {
    const row = await this.prisma.membershipProgram.create({
      data: { ownerRef, ...draft },
      include: { tiers: true },
    });
    return toProgram(row);
  }

  async update(programId: string, draft: Partial<ProgramDraft>): Promise<MembershipProgram> {
    const row = await this.prisma.membershipProgram.update({
      where: { id: programId },
      data: draft,
      include: { tiers: true },
    });
    return toProgram(row);
  }

  async setStatus(programId: string, status: ProgramStatus): Promise<MembershipProgram> {
    const row = await this.prisma.membershipProgram.update({
      where: { id: programId },
      data: { status },
      include: { tiers: true },
    });
    return toProgram(row);
  }

  /**
   * Swaps the whole scheme in one transaction and bumps the version.
   *
   * Deleting then inserting outside a transaction would leave a programme
   * momentarily tierless, and a visit landing in that window would evaluate
   * against nothing.
   */
  async replaceTiers(programId: string, tiers: TierDraft[]): Promise<MembershipProgram> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.membershipTier.deleteMany({ where: { programId } });
      if (tiers.length > 0) {
        await tx.membershipTier.createMany({
          data: tiers.map((tier) => ({ programId, ...tier })),
        });
      }
      return tx.membershipProgram.update({
        where: { id: programId },
        data: { version: { increment: 1 } },
        include: { tiers: true },
      });
    });

    return toProgram(row);
  }

  async createReward(programId: string, draft: RewardDraft): Promise<Reward> {
    return toReward(await this.prisma.reward.create({ data: { programId, ...draft } }));
  }

  async updateReward(rewardId: string, draft: Partial<RewardDraft>): Promise<Reward> {
    return toReward(await this.prisma.reward.update({ where: { id: rewardId }, data: draft }));
  }
}
