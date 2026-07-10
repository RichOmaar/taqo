import { describe, expect, it, vi } from 'vitest';

import { makeEntry } from '../../../testing/fixtures';
import type { WaitlistRepository } from '../domain/waitlist-repository';
import { ExpireNoShows } from './expire-no-shows';
import type { WaitlistEventPublisher } from './ports';

const publisher = (): WaitlistEventPublisher => ({
  entryAdded: vi.fn(),
  entryUpdated: vi.fn(),
  entryRemoved: vi.fn(),
});

describe('ExpireNoShows', () => {
  it('expires notified entries past their deadline', async () => {
    const entry = makeEntry({ status: 'notified', notifiedAt: '2026-01-01T00:00:00.000Z' });
    const waitlist = {
      findNotified: vi.fn().mockResolvedValue([{ entry, expirationMinutes: 10 }]),
      transition: vi.fn(async (_id, status) => makeEntry({ ...entry, status })),
    } as unknown as WaitlistRepository;
    const pub = publisher();

    const count = await new ExpireNoShows(waitlist, pub).execute(
      new Date('2026-01-01T00:20:00.000Z'),
    );

    expect(count).toBe(1);
    expect(waitlist.transition).toHaveBeenCalledWith('e1', 'no_show');
    expect(pub.entryRemoved).toHaveBeenCalledOnce();
  });

  it('keeps entries still within their deadline', async () => {
    const entry = makeEntry({ status: 'notified', notifiedAt: '2026-01-01T00:00:00.000Z' });
    const waitlist = {
      findNotified: vi.fn().mockResolvedValue([{ entry, expirationMinutes: 10 }]),
      transition: vi.fn(),
    } as unknown as WaitlistRepository;

    const count = await new ExpireNoShows(waitlist, publisher()).execute(
      new Date('2026-01-01T00:05:00.000Z'),
    );

    expect(count).toBe(0);
    expect(waitlist.transition).not.toHaveBeenCalled();
  });
});
