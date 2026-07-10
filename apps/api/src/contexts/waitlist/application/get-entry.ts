import type { WaitlistEntry } from '@nexa/types';

import { NotFoundError } from '../../../shared/errors';
import type { WaitlistRepository } from '../domain/waitlist-repository';

/** Query: a single waitlist entry by id. */
export class GetEntry {
  constructor(private readonly waitlist: WaitlistRepository) {}

  async execute(id: string): Promise<WaitlistEntry> {
    const entry = await this.waitlist.findById(id);
    if (!entry) throw new NotFoundError('Entry not found');
    return entry;
  }
}
