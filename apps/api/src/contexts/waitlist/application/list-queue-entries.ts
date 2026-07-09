import type { WaitlistEntry } from '@nexa/types';

import type { WaitlistRepository } from '../domain/waitlist-repository';

/** Query: active entries in a queue, ordered by position. */
export class ListQueueEntries {
  constructor(private readonly waitlist: WaitlistRepository) {}

  execute(queueId: string): Promise<WaitlistEntry[]> {
    return this.waitlist.listByQueue(queueId);
  }
}
