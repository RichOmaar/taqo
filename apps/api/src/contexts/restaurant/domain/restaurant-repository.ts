import type { Queue, Restaurant } from '@nexa/types';

export interface RestaurantWithQueues {
  restaurant: Restaurant;
  queues: Queue[];
}

/** Read port for restaurant data. */
export interface RestaurantRepository {
  findByCode(code: string): Promise<RestaurantWithQueues | null>;
}
