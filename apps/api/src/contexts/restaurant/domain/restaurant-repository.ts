import type { Queue, Restaurant } from '@tablenow/types';

export interface RestaurantWithQueues {
  restaurant: Restaurant;
  queues: Queue[];
}

/** Read port for restaurant data. */
export interface RestaurantRepository {
  findByCode(code: string): Promise<RestaurantWithQueues | null>;
}
