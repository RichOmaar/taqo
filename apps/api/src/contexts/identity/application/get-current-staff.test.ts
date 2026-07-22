import type { Restaurant } from '@nexa/types';
import { describe, expect, it } from 'vitest';

import { ForbiddenError, NotFoundError } from '../../../shared/errors';
import type { Staff, StaffRepository } from '../domain/staff-repository';
import { GetCurrentStaff } from './get-current-staff';
import type { RestaurantLookup } from './ports';

const RESTAURANT: Restaurant = {
  id: 'r1',
  name: 'Bistro Moderno',
  code: 'DEMO',
  qrToken: 'demo-qr-token',
  etaBaseMinutes: 10,
  expirationMinutes: 10,
  plan: 'free',
  timezone: 'America/Mexico_City',
  createdAt: '2026-07-01T00:00:00.000Z',
};

const OWNER: Staff = {
  id: 'u1',
  email: 'owner@demo.nexa',
  name: 'Dueño Demo',
  role: 'admin',
  restaurantId: 'r1',
};

function build(staff: Staff | null, restaurant: Restaurant | null = RESTAURANT) {
  const staffRepo: StaffRepository = { findById: () => Promise.resolve(staff) };
  const restaurants: RestaurantLookup = { findById: () => Promise.resolve(restaurant) };
  return new GetCurrentStaff(staffRepo, restaurants);
}

describe('GetCurrentStaff', () => {
  it('returns the staff user with the restaurant they manage', async () => {
    const result = await build(OWNER).execute('u1');

    expect(result).toEqual({
      user: {
        id: 'u1',
        restaurantId: 'r1',
        email: 'owner@demo.nexa',
        name: 'Dueño Demo',
        role: 'admin',
      },
      restaurant: RESTAURANT,
    });
  });

  it('rejects when the user is not staff', async () => {
    await expect(build(null).execute('diner')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects staff that are not assigned to a restaurant', async () => {
    const unassigned = { ...OWNER, restaurantId: null };

    await expect(build(unassigned).execute('u1')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects when the assigned restaurant no longer exists', async () => {
    await expect(build(OWNER, null).execute('u1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
