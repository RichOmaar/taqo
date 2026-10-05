import type { JoinWaitlistRequest, WaitlistEntry } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { RestaurantRepository } from '../../restaurant/domain/restaurant-repository';
import type { WaitlistRepository } from '../domain/waitlist-repository';
import type { WaitlistEventPublisher } from './ports';

export interface JoinWaitlistInput extends JoinWaitlistRequest {
  restaurantCode: string;
  /** Set when the diner is authenticated; null for guests. */
  userId?: string | null;
}

/** Use case: a diner joins a restaurant queue. */
export class JoinWaitlist {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly waitlist: WaitlistRepository,
    private readonly publisher: WaitlistEventPublisher,
  ) {}

  async execute(input: JoinWaitlistInput): Promise<WaitlistEntry> {
    const found = await this.restaurants.findByCode(input.restaurantCode);
    if (!found) throw new NotFoundError('Restaurant not found');

    const queue = found.queues.find((q) => q.id === input.queueId);
    if (!queue) throw new ValidationError('Queue does not belong to this restaurant');

    const activeCount = await this.waitlist.countActiveInQueue(queue.id);
    const position = activeCount + 1;
    // Synthetic ETA until we have rotation history (NEXA-031).
    const etaMinutes = position * found.restaurant.etaBaseMinutes;

    const entry = await this.waitlist.create({
      queueId: queue.id,
      restaurantId: found.restaurant.id,
      userId: input.userId ?? null,
      displayName: input.displayName,
      partySize: input.partySize,
      phone: input.phone ?? null,
      position,
      etaMinutes,
      formData: input.formData ?? {},
    });

    this.publisher.entryAdded({ entry });
    return entry;
  }
}
