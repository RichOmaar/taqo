import type { Queue } from '@nexa/types';

import { NotFoundError } from '../../../shared/errors';
import type {
  QueueUpdate,
  RestaurantConfigUpdate,
  RestaurantRepository,
  RestaurantWithQueues,
} from '../domain/restaurant-repository';

/** Use cases for editing a restaurant's configuration and its queues. */
export class RestaurantConfig {
  constructor(private readonly restaurants: RestaurantRepository) {}

  async updateConfig(code: string, data: RestaurantConfigUpdate): Promise<RestaurantWithQueues> {
    const id = await this.requireId(code);
    await this.restaurants.updateConfig(id, data);
    return this.load(code);
  }

  async addQueue(code: string, name: string, priority: number): Promise<RestaurantWithQueues> {
    const id = await this.requireId(code);
    await this.restaurants.addQueue(id, { name, priority });
    return this.load(code);
  }

  async updateQueue(queueId: string, data: QueueUpdate): Promise<Queue> {
    const queue = await this.restaurants.updateQueue(queueId, data);
    if (!queue) throw new NotFoundError('Queue not found');
    return queue;
  }

  private async requireId(code: string): Promise<string> {
    const id = await this.restaurants.findIdByCode(code);
    if (!id) throw new NotFoundError('Restaurant not found');
    return id;
  }

  private async load(code: string): Promise<RestaurantWithQueues> {
    const found = await this.restaurants.findByCode(code);
    if (!found) throw new NotFoundError('Restaurant not found');
    return found;
  }
}
