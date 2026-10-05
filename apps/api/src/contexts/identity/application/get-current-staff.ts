import type { GetCurrentStaffResponse } from '@nexa/types';

import { ForbiddenError, NotFoundError } from '../../../shared/errors';
import type { StaffRepository } from '../domain/staff-repository';
import type { RestaurantLookup } from './ports';

/**
 * Resolves the signed-in staff user together with the restaurant they manage.
 *
 * This is what lets a frontend discover its restaurant from the session rather
 * than carrying a hardcoded code.
 */
export class GetCurrentStaff {
  constructor(
    private readonly staff: StaffRepository,
    private readonly restaurants: RestaurantLookup,
  ) {}

  async execute(userId: string): Promise<GetCurrentStaffResponse> {
    const found = await this.staff.findById(userId);
    if (!found) throw new NotFoundError('Staff user not found');

    // Staff with no restaurant cannot act on anything; surfacing it as a 403
    // beats returning a half-empty session the UI has to special-case.
    if (!found.restaurantId) {
      throw new ForbiddenError('Staff user is not assigned to a restaurant');
    }

    const restaurant = await this.restaurants.findById(found.restaurantId);
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    return {
      user: {
        id: found.id,
        restaurantId: found.restaurantId,
        email: found.email,
        name: found.name,
        role: found.role,
      },
      restaurant,
    };
  }
}
