import type { WaitlistEntry } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { WaitlistRepository } from '../domain/waitlist-repository';
import type { DinerNotifier, VisitRecorder, WaitlistEventPublisher } from './ports';

/** Loyalty is optional; without a programme wired in, seating records nothing. */
const NO_VISIT_RECORDER: VisitRecorder = { dinerSeated: () => undefined };

/**
 * Lifecycle actions on a waitlist entry performed by reception:
 * notify (still active), seat / no-show / cancel (leave the active queue).
 */
export class EntryActions {
  constructor(
    private readonly waitlist: WaitlistRepository,
    private readonly publisher: WaitlistEventPublisher,
    private readonly notifier: DinerNotifier,
    private readonly visits: VisitRecorder = NO_VISIT_RECORDER,
  ) {}

  async notify(entryId: string): Promise<WaitlistEntry> {
    await this.loadActive(entryId);
    const entry = await this.waitlist.transition(entryId, 'notified', { notified: true });
    this.publisher.entryUpdated({ entry });
    this.notifier.tableReady(entry);
    return entry;
  }

  async seat(entryId: string): Promise<WaitlistEntry> {
    const entry = await this.leave(entryId, 'seated', { seated: true });
    // Fire-and-forget: a loyalty programme failing must not fail the seating,
    // which is the operation the hostess is actually waiting on.
    this.visits.dinerSeated(entry);
    return entry;
  }

  markNoShow(entryId: string): Promise<WaitlistEntry> {
    return this.leave(entryId, 'no_show');
  }

  cancel(entryId: string): Promise<WaitlistEntry> {
    return this.leave(entryId, 'cancelled');
  }

  /** Transition out of the queue, notify the board, and renumber the remaining entries. */
  private async leave(
    entryId: string,
    status: 'seated' | 'no_show' | 'cancelled',
    options?: { seated?: boolean },
  ): Promise<WaitlistEntry> {
    await this.loadActive(entryId);
    const entry = await this.waitlist.transition(entryId, status, options);
    this.publishRemoved(entry);
    await this.resequence(entry.queueId);
    return entry;
  }

  private async resequence(queueId: string): Promise<void> {
    const changed = await this.waitlist.resequence(queueId);
    for (const entry of changed) this.publisher.entryUpdated({ entry });
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
