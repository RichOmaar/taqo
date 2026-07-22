import { describe, expect, it } from 'vitest';

import { canSubscribeToQueue, type SocketStaff } from './waitlist-gateway';

const HOSTESS: SocketStaff = { role: 'hostess', restaurantId: 'r1' };

describe('canSubscribeToQueue', () => {
  it('allows staff to join their own restaurant queue room', () => {
    expect(canSubscribeToQueue(HOSTESS, 'r1')).toBe(true);
    expect(canSubscribeToQueue({ role: 'admin', restaurantId: 'r1' }, 'r1')).toBe(true);
  });

  it('denies staff of another restaurant', () => {
    // Being staff is not enough: the live board is restaurant-scoped.
    expect(canSubscribeToQueue(HOSTESS, 'r2')).toBe(false);
  });

  it('denies an unauthenticated socket', () => {
    expect(canSubscribeToQueue(null, 'r1')).toBe(false);
  });

  it('denies a diner even with a valid session', () => {
    expect(canSubscribeToQueue({ role: 'diner', restaurantId: 'r1' }, 'r1')).toBe(false);
  });

  it('denies staff with no restaurant assigned', () => {
    expect(canSubscribeToQueue({ role: 'admin', restaurantId: null }, 'r1')).toBe(false);
  });
});
