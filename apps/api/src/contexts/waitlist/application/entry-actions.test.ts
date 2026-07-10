import type { WaitlistEntry } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import { makeEntry } from '../../../testing/fixtures';
import type { WaitlistRepository } from '../domain/waitlist-repository';
import { EntryActions } from './entry-actions';
import type { DinerNotifier, WaitlistEventPublisher } from './ports';

function setup(entry: WaitlistEntry | null, resequenced: WaitlistEntry[] = []) {
  const waitlist = {
    findById: vi.fn().mockResolvedValue(entry),
    transition: vi.fn(async (_id, status) => makeEntry({ ...(entry ?? {}), status })),
    resequence: vi.fn().mockResolvedValue(resequenced),
  } as unknown as WaitlistRepository;
  const publisher: WaitlistEventPublisher = {
    entryAdded: vi.fn(),
    entryUpdated: vi.fn(),
    entryRemoved: vi.fn(),
  };
  const notifier: DinerNotifier = { tableReady: vi.fn() };
  return {
    waitlist,
    publisher,
    notifier,
    actions: new EntryActions(waitlist, publisher, notifier),
  };
}

describe('EntryActions', () => {
  it('notify transitions to notified, updates and notifies the diner', async () => {
    const { waitlist, publisher, notifier, actions } = setup(makeEntry({ status: 'waiting' }));
    await actions.notify('e1');
    expect(waitlist.transition).toHaveBeenCalledWith('e1', 'notified', { notified: true });
    expect(publisher.entryUpdated).toHaveBeenCalledOnce();
    expect(notifier.tableReady).toHaveBeenCalledOnce();
  });

  it('seat removes the entry from the queue', async () => {
    const { publisher, actions } = setup(makeEntry({ status: 'notified' }));
    await actions.seat('e1');
    expect(publisher.entryRemoved).toHaveBeenCalledWith(expect.objectContaining({ entryId: 'e1' }));
  });

  it('markNoShow removes the entry from the queue', async () => {
    const { waitlist, publisher, actions } = setup(makeEntry({ status: 'notified' }));
    await actions.markNoShow('e1');
    expect(waitlist.transition).toHaveBeenCalledWith('e1', 'no_show', undefined);
    expect(publisher.entryRemoved).toHaveBeenCalledOnce();
  });

  it('renumbers the queue and emits updates when an entry leaves', async () => {
    const shifted = makeEntry({ id: 'e2', position: 1 });
    const { waitlist, publisher, actions } = setup(makeEntry({ status: 'notified' }), [shifted]);
    await actions.seat('e1');
    expect(waitlist.resequence).toHaveBeenCalledOnce();
    expect(publisher.entryUpdated).toHaveBeenCalledWith({ entry: shifted });
  });

  it('rejects acting on a non-active entry', async () => {
    const { actions } = setup(makeEntry({ status: 'seated' }));
    await expect(actions.notify('e1')).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws NotFound when the entry is missing', async () => {
    const { actions } = setup(null);
    await expect(actions.seat('e1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
