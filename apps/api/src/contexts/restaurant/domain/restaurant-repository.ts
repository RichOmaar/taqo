import type { Queue, Restaurant } from '@nexa/types';

export interface RestaurantWithQueues {
  restaurant: Restaurant;
  queues: Queue[];
}

export interface RestaurantConfigUpdate {
  name?: string;
  etaBaseMinutes?: number;
  expirationMinutes?: number;
}

export interface NewQueue {
  name: string;
  priority: number;
}

export interface QueueUpdate {
  name?: string;
  priority?: number;
  isActive?: boolean;
}

/** Read + config-write port for restaurant data. */
export interface RestaurantRepository {
  findByCode(code: string): Promise<RestaurantWithQueues | null>;
  findIdByCode(code: string): Promise<string | null>;
  updateConfig(id: string, data: RestaurantConfigUpdate): Promise<void>;
  addQueue(restaurantId: string, data: NewQueue): Promise<Queue>;
  updateQueue(queueId: string, data: QueueUpdate): Promise<Queue | null>;
}
