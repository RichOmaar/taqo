import type { Queue, Restaurant, RestaurantSummary } from '@nexa/types';
import type {
  PrismaClient,
  Queue as PrismaQueue,
  Restaurant as PrismaRestaurant,
} from '@prisma/client';

import type {
  NewQueue,
  QueueUpdate,
  RestaurantConfigUpdate,
  RestaurantRepository,
  RestaurantWithQueues,
} from '../domain/restaurant-repository';

function toRestaurant(row: PrismaRestaurant): Restaurant {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    qrToken: row.qrToken,
    etaBaseMinutes: row.etaBaseMinutes,
    expirationMinutes: row.expirationMinutes,
    plan: row.plan,
    timezone: row.timezone,
    createdAt: row.createdAt.toISOString(),
  };
}

function toQueue(row: PrismaQueue): Queue {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    name: row.name,
    priority: row.priority,
    isActive: row.isActive,
  };
}

export class PrismaRestaurantRepository implements RestaurantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listSummaries(): Promise<RestaurantSummary[]> {
    const restaurants = await this.prisma.restaurant.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
    const counts = await this.prisma.waitlistEntry.groupBy({
      by: ['restaurantId'],
      where: { status: { in: ['waiting', 'notified'] } },
      _count: { _all: true },
    });
    const waitingByRestaurant = new Map(counts.map((c) => [c.restaurantId, c._count._all]));
    return restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      waitingCount: waitingByRestaurant.get(r.id) ?? 0,
    }));
  }

  async findByCode(code: string): Promise<RestaurantWithQueues | null> {
    const row = await this.prisma.restaurant.findUnique({
      where: { code },
      include: { queues: { where: { isActive: true }, orderBy: { priority: 'asc' } } },
    });
    if (!row) return null;
    return {
      restaurant: toRestaurant(row),
      queues: row.queues.map(toQueue),
    };
  }

  async findById(id: string): Promise<Restaurant | null> {
    const row = await this.prisma.restaurant.findUnique({ where: { id } });
    return row ? toRestaurant(row) : null;
  }

  async findIdByCode(code: string): Promise<string | null> {
    const row = await this.prisma.restaurant.findUnique({
      where: { code },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findQueueById(queueId: string): Promise<Queue | null> {
    const row = await this.prisma.queue.findUnique({ where: { id: queueId } });
    return row ? toQueue(row) : null;
  }

  async updateConfig(id: string, data: RestaurantConfigUpdate): Promise<void> {
    await this.prisma.restaurant.update({
      where: { id },
      data: {
        name: data.name,
        etaBaseMinutes: data.etaBaseMinutes,
        expirationMinutes: data.expirationMinutes,
      },
    });
  }

  async addQueue(restaurantId: string, data: NewQueue): Promise<Queue> {
    const row = await this.prisma.queue.create({
      data: { restaurantId, name: data.name, priority: data.priority },
    });
    return toQueue(row);
  }

  async updateQueue(queueId: string, data: QueueUpdate): Promise<Queue | null> {
    const existing = await this.prisma.queue.findUnique({ where: { id: queueId } });
    if (!existing) return null;
    const row = await this.prisma.queue.update({
      where: { id: queueId },
      data: { name: data.name, priority: data.priority, isActive: data.isActive },
    });
    return toQueue(row);
  }
}
