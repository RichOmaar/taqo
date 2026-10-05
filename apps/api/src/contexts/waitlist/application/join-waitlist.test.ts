import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import { makeEntry, makeQueue, makeRestaurant } from '../../../testing/fixtures';
import type { RestaurantRepository } from '../../restaurant/domain/restaurant-repository';
import type { WaitlistRepository } from '../domain/waitlist-repository';
import { JoinWaitlist } from './join-waitlist';
import type { WaitlistEventPublisher } from './ports';

function setup(restaurantResult: unknown) {
  const restaurants = {
    findByCode: vi.fn().mockResolvedValue(restaurantResult),
  } as unknown as RestaurantRepository;
  const waitlist = {
    countActiveInQueue: vi.fn().mockResolvedValue(2),
    create: vi.fn(async (e) => makeEntry({ ...e, id: 'new' })),
  } as unknown as WaitlistRepository;
  const publisher: WaitlistEventPublisher = {
    entryAdded: vi.fn(),
    entryUpdated: vi.fn(),
    entryRemoved: vi.fn(),
  };
  return {
    restaurants,
    waitlist,
    publisher,
    join: new JoinWaitlist(restaurants, waitlist, publisher),
  };
}

describe('JoinWaitlist', () => {
  it('assigns position and synthetic ETA and emits entry_added', async () => {
    const { waitlist, publisher, join } = setup({
      restaurant: makeRestaurant({ etaBaseMinutes: 10 }),
      queues: [makeQueue({ id: 'q1' })],
    });

    const entry = await join.execute({
      restaurantCode: 'DEMO',
      queueId: 'q1',
      displayName: 'Ana',
      partySize: 2,
    });

    expect(waitlist.create).toHaveBeenCalledWith(
      expect.objectContaining({ position: 3, etaMinutes: 30 }),
    );
    expect(publisher.entryAdded).toHaveBeenCalledOnce();
    expect(entry.id).toBe('new');
  });

  it('links the entry to a diner when userId is provided', async () => {
    const { waitlist, join } = setup({
      restaurant: makeRestaurant(),
      queues: [makeQueue({ id: 'q1' })],
    });
    await join.execute({
      restaurantCode: 'DEMO',
      queueId: 'q1',
      displayName: 'Ana',
      partySize: 1,
      userId: 'u1',
    });
    expect(waitlist.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
  });

  it('throws NotFound when the restaurant does not exist', async () => {
    const { join } = setup(null);
    await expect(
      join.execute({ restaurantCode: 'X', queueId: 'q1', displayName: 'A', partySize: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws Validation when the queue is not part of the restaurant', async () => {
    const { join } = setup({ restaurant: makeRestaurant(), queues: [makeQueue({ id: 'q1' })] });
    await expect(
      join.execute({ restaurantCode: 'DEMO', queueId: 'other', displayName: 'A', partySize: 1 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
