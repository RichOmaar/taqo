import type { Queue, Restaurant } from '@nexa/types';
import type {
  PrismaClient,
  Queue as PrismaQueue,
  Restaurant as PrismaRestaurant,
} from '@prisma/client';

import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';

function toRestaurant(row: PrismaRestaurant): Restaurant {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    qrToken: row.qrToken,
    etaBaseMinutes: row.etaBaseMinutes,
    expirationMinutes: row.expirationMinutes,
    plan: row.plan,
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
}
