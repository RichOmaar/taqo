import type { RestaurantSummary } from '@nexa/types';

import type { RestaurantRepository } from '../domain/restaurant-repository';

/** Query: public catalog of restaurants with their current wait. */
export class ListRestaurants {
  constructor(private readonly restaurants: RestaurantRepository) {}

  execute(): Promise<RestaurantSummary[]> {
    return this.restaurants.listSummaries();
  }
}
