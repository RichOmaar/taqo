import type { WaitlistEntry } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { WaitlistRepository } from '../domain/waitlist-repository';
import type { WaitlistEventPublisher } from './ports';

/**
 * Lifecycle actions on a waitlist entry performed by reception:
 * notify (still active), seat / no-show / cancel (leave the active queue).
 */
export class EntryActions {
  constructor(
    private readonly waitlist: WaitlistRepository,
    private readonly publisher: WaitlistEventPublisher,
  ) {}

  async notify(entryId: string): Promise<WaitlistEntry> {
    await this.loadActive(entryId);
    const entry = await this.waitlist.transition(entryId, 'notified', { notified: true });
    this.publisher.entryUpdated({ entry });
    return entry;
  }

  async seat(entryId: string): Promise<WaitlistEntry> {
    await this.loadActive(entryId);
    const entry = await this.waitlist.transition(entryId, 'seated', { seated: true });
    this.publishRemoved(entry);
    return entry;
  }

  async markNoShow(entryId: string): Promise<WaitlistEntry> {
    await this.loadActive(entryId);
    const entry = await this.waitlist.transition(entryId, 'no_show');
    this.publishRemoved(entry);
    return entry;
  }

  async cancel(entryId: string): Promise<WaitlistEntry> {
    await this.loadActive(entryId);
    const entry = await this.waitlist.transition(entryId, 'cancelled');
    this.publishRemoved(entry);
    return entry;
  }

  private async loadActive(entryId: string): Promise<WaitlistEntry> {
    const entry = await this.waitlist.findById(entryId);
    if (!entry) throw new NotFoundError('Entry not found');
    if (entry.status !== 'waiting' && entry.status !== 'notified') {
      throw new ValidationError(`Entry is not active (status: ${entry.status})`);
    }
    return entry;
  }

  private publishRemoved(entry: WaitlistEntry): void {
    this.publisher.entryRemoved({
      entryId: entry.id,
      queueId: entry.queueId,
      restaurantId: entry.restaurantId,
    });
  }
}
