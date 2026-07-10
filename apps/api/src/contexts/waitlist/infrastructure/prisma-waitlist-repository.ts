import type { WaitlistEntry, WaitlistStatus } from '@nexa/types';
import { Prisma } from '@prisma/client';
import type { PrismaClient, WaitlistEntry as PrismaWaitlistEntry } from '@prisma/client';

import type {
  NewWaitlistEntry,
  TransitionOptions,
  WaitlistRepository,
} from '../domain/waitlist-repository';

const ACTIVE_STATUSES = ['waiting', 'notified'] as const;

function toEntry(row: PrismaWaitlistEntry): WaitlistEntry {
  return {
    id: row.id,
    queueId: row.queueId,
    restaurantId: row.restaurantId,
    userId: row.userId,
    displayName: row.displayName,
    partySize: row.partySize,
    phone: row.phone,
    status: row.status,
    position: row.position,
    etaMinutes: row.etaMinutes,
    etaIsManual: row.etaIsManual,
    formData: (row.formData ?? {}) as Record<string, unknown>,
    joinedAt: row.joinedAt.toISOString(),
    notifiedAt: row.notifiedAt?.toISOString() ?? null,
    seatedAt: row.seatedAt?.toISOString() ?? null,
  };
}

export class PrismaWaitlistRepository implements WaitlistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  countActiveInQueue(queueId: string): Promise<number> {
    return this.prisma.waitlistEntry.count({
      where: { queueId, status: { in: [...ACTIVE_STATUSES] } },
    });
  }

  async create(entry: NewWaitlistEntry): Promise<WaitlistEntry> {
    const row = await this.prisma.waitlistEntry.create({
      data: {
        queueId: entry.queueId,
        restaurantId: entry.restaurantId,
        userId: entry.userId,
        displayName: entry.displayName,
        partySize: entry.partySize,
        phone: entry.phone,
        status: 'waiting',
        position: entry.position,
        etaMinutes: entry.etaMinutes,
        formData: entry.formData as Prisma.InputJsonValue,
      },
    });
    return toEntry(row);
  }

  async listByQueue(queueId: string): Promise<WaitlistEntry[]> {
    const rows = await this.prisma.waitlistEntry.findMany({
      where: { queueId, status: { in: [...ACTIVE_STATUSES] } },
      orderBy: { position: 'asc' },
    });
    return rows.map(toEntry);
  }

  async findById(id: string): Promise<WaitlistEntry | null> {
    const row = await this.prisma.waitlistEntry.findUnique({ where: { id } });
    return row ? toEntry(row) : null;
  }

  async findNotified(): Promise<Array<{ entry: WaitlistEntry; expirationMinutes: number }>> {
    const rows = await this.prisma.waitlistEntry.findMany({
      where: { status: 'notified' },
      include: { restaurant: { select: { expirationMinutes: true } } },
    });
    return rows.map((row) => ({
      entry: toEntry(row),
      expirationMinutes: row.restaurant.expirationMinutes,
    }));
  }

  async transition(
    id: string,
    status: WaitlistStatus,
    options?: TransitionOptions,
  ): Promise<WaitlistEntry> {
    const row = await this.prisma.waitlistEntry.update({
      where: { id },
      data: {
        status,
        ...(options?.notified ? { notifiedAt: new Date() } : {}),
        ...(options?.seated ? { seatedAt: new Date() } : {}),
      },
    });
    return toEntry(row);
  }
}
