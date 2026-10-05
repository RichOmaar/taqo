import { describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../../../shared/errors';
import { makeQueue, makeRestaurant } from '../../../testing/fixtures';
import type { RestaurantRepository } from '../domain/restaurant-repository';
import { RestaurantConfig } from './restaurant-config';

describe('RestaurantConfig', () => {
  it('updates config and returns the restaurant with its queues', async () => {
    const repo = {
      findIdByCode: vi.fn().mockResolvedValue('r1'),
      updateConfig: vi.fn().mockResolvedValue(undefined),
      findByCode: vi.fn().mockResolvedValue({
        restaurant: makeRestaurant(),
        queues: [makeQueue()],
      }),
    } as unknown as RestaurantRepository;

    const result = await new RestaurantConfig(repo).updateConfig('DEMO', { etaBaseMinutes: 15 });

    expect(repo.updateConfig).toHaveBeenCalledWith('r1', { etaBaseMinutes: 15 });
    expect(result.queues).toHaveLength(1);
  });

  it('throws NotFound when the restaurant is unknown', async () => {
    const repo = {
      findIdByCode: vi.fn().mockResolvedValue(null),
    } as unknown as RestaurantRepository;
    await expect(new RestaurantConfig(repo).updateConfig('X', {})).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws NotFound when the queue is unknown', async () => {
    const repo = {
      updateQueue: vi.fn().mockResolvedValue(null),
    } as unknown as RestaurantRepository;
    await expect(
      new RestaurantConfig(repo).updateQueue('q9', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns the updated queue', async () => {
    const repo = {
      updateQueue: vi.fn().mockResolvedValue(makeQueue({ name: 'Terraza' })),
    } as unknown as RestaurantRepository;
    const queue = await new RestaurantConfig(repo).updateQueue('q1', { name: 'Terraza' });
    expect(queue.name).toBe('Terraza');
  });
});
