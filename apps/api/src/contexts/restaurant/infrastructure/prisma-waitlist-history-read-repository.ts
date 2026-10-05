import type { WaitlistHistoryEntry } from '@nexa/types';
import type { PrismaClient } from '@prisma/client';

import type {
  ListWaitlistHistoryQuery,
  WaitlistHistoryReadRepository,
} from '../domain/waitlist-history-read-repository';

const MS_PER_MINUTE = 60_000;

/**
 * How long the diner actually waited.
 *
 * Only defined for a seated entry: a no-show waited an unknown amount, and
 * counting the time until we gave up on them would read as a wait they served.
 */
function waitMinutes(joinedAt: Date, seatedAt: Date | null): number | null {
  if (!seatedAt) return null;
  return Math.max(0, Math.round((seatedAt.getTime() - joinedAt.getTime()) / MS_PER_MINUTE));
}

export class PrismaWaitlistHistoryReadRepository implements WaitlistHistoryReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(
    restaurantId: string,
    query: ListWaitlistHistoryQuery,
  ): Promise<WaitlistHistoryEntry[]> {
    const rows = await this.prisma.waitlistEntry.findMany({
      where: {
        restaurantId,
        ...(query.range && { joinedAt: { gte: query.range.from, lt: query.range.to } }),
        ...(query.status && { status: query.status }),
        ...(query.queueId && { queueId: query.queueId }),
        // Substring rather than prefix: staff search for the part of the name
        // they remember, which is rarely the beginning.
        ...(query.search && {
          displayName: { contains: query.search, mode: 'insensitive' as const },
        }),
        // Keyset pagination on (joinedAt, id): the tie-break is what stops an
        // entry being skipped when two share a millisecond at a page edge.
        ...(query.cursor && {
          OR: [
            { joinedAt: { lt: query.cursor.joinedAt } },
            { joinedAt: query.cursor.joinedAt, id: { lt: query.cursor.id } },
          ],
        }),
      },
      orderBy: [{ joinedAt: 'desc' }, { id: 'desc' }],
      take: query.limit,
      include: { queue: { select: { name: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      queueId: row.queueId,
      queueName: row.queue.name,
      displayName: row.displayName,
      partySize: row.partySize,
      status: row.status,
      joinedAt: row.joinedAt.toISOString(),
      notifiedAt: row.notifiedAt?.toISOString() ?? null,
      seatedAt: row.seatedAt?.toISOString() ?? null,
      waitMinutes: waitMinutes(row.joinedAt, row.seatedAt),
    }));
  }
}
