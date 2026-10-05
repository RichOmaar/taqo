import type { Queue } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { RestaurantRepository, RestaurantWithQueues } from '../domain/restaurant-repository';
import { RemoveQueue } from './remove-queue';

function queue(overrides: Partial<Queue> = {}): Queue {
  return {
    id: 'q1',
    restaurantId: 'r1',
    name: 'Terraza',
    description: null,
    priority: 1,
    isActive: true,
    ...overrides,
  };
}

function withQueues(): RestaurantWithQueues {
  return {
    restaurant: {
      id: 'r1',
      name: 'Bistro Moderno',
      code: 'DEMO',
      qrToken: 'demo-qr-token',
      etaBaseMinutes: 10,
      expirationMinutes: 10,
      plan: 'free',
      timezone: 'America/Mexico_City',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    queues: [],
  };
}

interface Options {
  queue?: Queue | null;
  activeQueues?: number;
  liveEntries?: number;
  totalEntries?: number;
}

function build(options: Options = {}) {
  const { queue: found = queue(), activeQueues = 2, liveEntries = 0, totalEntries = 0 } = options;

  const deactivateQueue = vi.fn().mockResolvedValue(undefined);
  const deleteQueue = vi.fn().mockResolvedValue(undefined);

  const restaurants = {
    findQueueById: vi.fn().mockResolvedValue(found),
    findById: vi.fn().mockResolvedValue(withQueues().restaurant),
    findByCode: vi.fn().mockResolvedValue(withQueues()),
    countActiveQueues: vi.fn().mockResolvedValue(activeQueues),
    countLiveEntries: vi.fn().mockResolvedValue(liveEntries),
    countEntries: vi.fn().mockResolvedValue(totalEntries),
    deactivateQueue,
    deleteQueue,
  } as unknown as RestaurantRepository;

  return { deactivateQueue, deleteQueue, useCase: new RemoveQueue(restaurants) };
}

describe('RemoveQueue', () => {
  it('refuses a queue that does not exist', async () => {
    const { useCase } = build({ queue: null });

    await expect(useCase.execute('nope')).rejects.toThrow(NotFoundError);
  });

  describe('a queue that has never been used', () => {
    it('is deleted outright, since there is no history to lose', async () => {
      const { deleteQueue, useCase } = build({ totalEntries: 0 });

      const result = await useCase.execute('q1');

      expect(deleteQueue).toHaveBeenCalledWith('q1');
      expect(result.outcome).toBe('deleted');
    });

    it('is not deactivated instead, which would leave a dead row around', async () => {
      const { deactivateQueue, useCase } = build({ totalEntries: 0 });

      await useCase.execute('q1');

      expect(deactivateQueue).not.toHaveBeenCalled();
    });
  });

  describe('a queue that has taken diners before', () => {
    it('is deactivated, not deleted', async () => {
      // Deleting cascades to its waitlist entries, which are the restaurant's
      // history and the input to every metric.
      const { deactivateQueue, useCase } = build({ totalEntries: 40 });

      const result = await useCase.execute('q1');

      expect(deactivateQueue).toHaveBeenCalledWith('q1');
      expect(result.outcome).toBe('deactivated');
    });

    it('is never deleted, whatever else is true', async () => {
      const { deleteQueue, useCase } = build({ totalEntries: 1 });

      await useCase.execute('q1');

      expect(deleteQueue).not.toHaveBeenCalled();
    });
  });

  describe('a queue with diners still waiting', () => {
    it('is refused rather than stranding them', async () => {
      const { useCase } = build({ liveEntries: 3, totalEntries: 10 });

      await expect(useCase.execute('q1')).rejects.toThrow(ValidationError);
    });

    it('is neither deleted nor deactivated', async () => {
      const { deactivateQueue, deleteQueue, useCase } = build({ liveEntries: 1 });

      await expect(useCase.execute('q1')).rejects.toThrow(ValidationError);

      expect(deactivateQueue).not.toHaveBeenCalled();
      expect(deleteQueue).not.toHaveBeenCalled();
    });

    it('says what to do about it', async () => {
      const { useCase } = build({ liveEntries: 1 });

      await expect(useCase.execute('q1')).rejects.toThrow(/Seat or cancel/);
    });
  });

  describe('the last active queue', () => {
    it('is refused, since a restaurant with none cannot take anyone', async () => {
      const { useCase } = build({ activeQueues: 1 });

      await expect(useCase.execute('q1')).rejects.toThrow(/at least one active queue/);
    });

    it('does not block removing an already-inactive queue', async () => {
      // It is not one of the active ones, so removing it strands nobody.
      const { useCase } = build({ queue: queue({ isActive: false }), activeQueues: 1 });

      await expect(useCase.execute('q1')).resolves.toMatchObject({ outcome: 'deleted' });
    });
  });

  it('returns the restaurant as it now stands', async () => {
    const { useCase } = build();

    const result = await useCase.execute('q1');

    expect(result.restaurant.restaurant.code).toBe('DEMO');
  });
});
