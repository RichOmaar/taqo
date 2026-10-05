import type { MembershipStats } from '@nexa/types';
import type { PrismaClient } from '@prisma/client';

import type { TimeRange } from '../../../shared/time-range';

export interface StatsRepository {
  compute(programId: string, range: TimeRange): Promise<MembershipStats>;
}

interface TierRow {
  tier_id: string | null;
  tier_name: string;
  members: number;
}

/**
 * Programme health, for the owner's analytics panel.
 *
 * A loyalty scheme is sold on return, so these have to be defensible: an active
 * member is one who actually came back inside the window, not merely one who
 * signed up and never returned.
 */
export class PrismaStatsRepository implements StatsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async compute(programId: string, range: TimeRange): Promise<MembershipStats> {
    const [totalMembers, activeMembers, tiers, issued, redeemed, visits] = await Promise.all([
      this.prisma.membership.count({ where: { programId, status: 'active' } }),

      // Distinct members with an accrual in the window — the returning ones.
      this.prisma.membership
        .count({
          where: {
            programId,
            status: 'active',
            ledger: {
              some: { kind: 'accrual', occurredAt: { gte: range.from, lt: range.to } },
            },
          },
        })
        .then((count) => count),

      this.prisma.$queryRaw<TierRow[]>`
        SELECT
          t.id AS tier_id,
          COALESCE(t.name, 'Sin nivel') AS tier_name,
          COUNT(m.id)::int AS members
        FROM memberships m
        LEFT JOIN membership_tiers t
          ON t.program_id = m.program_id AND t.position = m.held_tier_position
        WHERE m.program_id = ${programId}::uuid AND m.status = 'active'
        GROUP BY t.id, t.name
        ORDER BY MIN(COALESCE(t.position, -1))
      `,

      this.prisma.redemption.count({
        where: {
          membership: { programId },
          issuedAt: { gte: range.from, lt: range.to },
        },
      }),

      this.prisma.redemption.count({
        where: {
          membership: { programId },
          status: 'redeemed',
          redeemedAt: { gte: range.from, lt: range.to },
        },
      }),

      this.prisma.ledgerEntry.aggregate({
        where: {
          membership: { programId },
          kind: 'accrual',
          occurredAt: { gte: range.from, lt: range.to },
        },
        _sum: { visits: true },
      }),
    ]);

    const totalVisits = visits._sum.visits ?? 0;

    return {
      totalMembers,
      activeMembers,
      tierDistribution: tiers.map((row) => ({
        tierId: row.tier_id,
        tierName: row.tier_name,
        members: row.members,
      })),
      redemptionsIssued: issued,
      redemptionsRedeemed: redeemed,
      // Averaged over members who actually returned; dividing by everyone who
      // ever signed up would flatter a dormant programme.
      visitsPerMember: activeMembers > 0 ? Number((totalVisits / activeMembers).toFixed(1)) : 0,
    };
  }
}
