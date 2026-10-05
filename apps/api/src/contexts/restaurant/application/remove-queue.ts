import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';

export type RemovalOutcome = 'deleted' | 'deactivated';

export interface RemoveQueueResult {
  restaurant: RestaurantWithQueues;
  outcome: RemovalOutcome;
}

/**
 * Retires a queue.
 *
 * Deleting the row would take its waitlist entries with it — the schema
 * cascades — and those entries are the restaurant's history and the input to
 * every metric. So a queue that has ever been used is deactivated, not
 * deleted; only one that never took a diner is actually removed.
 *
 * Either way it disappears from the diner's options, which is what the owner
 * asked for. The difference is only whether the past survives.
 */
export class RemoveQueue {
  constructor(private readonly restaurants: RestaurantRepository) {}

  async execute(queueId: string): Promise<RemoveQueueResult> {
    const queue = await this.restaurants.findQueueById(queueId);
    if (!queue) throw new NotFoundError('Queue not found');

    const found = await this.restaurants.findById(queue.restaurantId);
    if (!found) throw new NotFoundError('Restaurant not found');

    const active = await this.restaurants.countActiveQueues(queue.restaurantId);
    if (queue.isActive && active <= 1) {
      // A restaurant with no queue cannot take anyone: the join form would
      // have nothing to offer.
      throw new ValidationError('A restaurant needs at least one active queue');
    }

    const waiting = await this.restaurants.countLiveEntries(queueId);
    if (waiting > 0) {
      // Silently stranding people mid-wait is worse than refusing.
      throw new ValidationError(
        'This queue still has diners waiting. Seat or cancel them before removing it.',
      );
    }

    const total = await this.restaurants.countEntries(queueId);
    if (total > 0) {
      await this.restaurants.deactivateQueue(queueId);
    } else {
      await this.restaurants.deleteQueue(queueId);
    }

    const restaurant = await this.restaurants.findByCode(found.code);
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    return { restaurant, outcome: total > 0 ? 'deactivated' : 'deleted' };
  }
}
