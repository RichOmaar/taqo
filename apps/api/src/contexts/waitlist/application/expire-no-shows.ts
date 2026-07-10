import type { WaitlistRepository } from '../domain/waitlist-repository';
import type { WaitlistEventPublisher } from './ports';

/**
 * Sweep: notified entries that were not seated within their restaurant's
 * expiration window transition to no_show and leave the queue.
 */
export class ExpireNoShows {
  constructor(
    private readonly waitlist: WaitlistRepository,
    private readonly publisher: WaitlistEventPublisher,
  ) {}

  async execute(now: Date = new Date()): Promise<number> {
    const candidates = await this.waitlist.findNotified();
    let expired = 0;
    for (const { entry, expirationMinutes } of candidates) {
      if (!entry.notifiedAt) continue;
      const deadline = new Date(entry.notifiedAt).getTime() + expirationMinutes * 60_000;
      if (now.getTime() >= deadline) {
        const updated = await this.waitlist.transition(entry.id, 'no_show');
        this.publisher.entryRemoved({
          entryId: updated.id,
          queueId: updated.queueId,
          restaurantId: updated.restaurantId,
        });
        expired += 1;
      }
    }
    return expired;
  }
}
