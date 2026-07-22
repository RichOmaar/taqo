import type { Queue, Restaurant, RestaurantSummary } from '@nexa/types';

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
  description?: string | null;
  priority: number;
}

export interface QueueUpdate {
  name?: string;
  description?: string | null;
  priority?: number;
  isActive?: boolean;
}

/** Read + config-write port for restaurant data. */
export interface RestaurantRepository {
  listSummaries(): Promise<RestaurantSummary[]>;
  findByCode(code: string): Promise<RestaurantWithQueues | null>;
  findById(id: string): Promise<Restaurant | null>;
  findIdByCode(code: string): Promise<string | null>;
  findQueueById(queueId: string): Promise<Queue | null>;
  updateConfig(id: string, data: RestaurantConfigUpdate): Promise<void>;
  addQueue(restaurantId: string, data: NewQueue): Promise<Queue>;
  updateQueue(queueId: string, data: QueueUpdate): Promise<Queue | null>;
  /** Queues a diner could still be sent to. */
  countActiveQueues(restaurantId: string): Promise<number>;
  /** Entries in this queue that are still waiting or notified. */
  countLiveEntries(queueId: string): Promise<number>;
  /** Every entry this queue has ever taken, whatever its status. */
  countEntries(queueId: string): Promise<number>;
  /** Hides the queue without touching its history. */
  deactivateQueue(queueId: string): Promise<void>;
  /** Removes the row. Cascades to its entries, so only for an unused queue. */
  deleteQueue(queueId: string): Promise<void>;
}
