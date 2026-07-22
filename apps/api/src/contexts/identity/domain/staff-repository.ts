import type { StaffRole } from '@nexa/types';

/**
 * A staff member as the domain sees them.
 *
 * `restaurantId` is nullable here on purpose: the database allows staff with no
 * restaurant, and the application layer decides that this is an error rather
 * than pretending it cannot happen.
 */
export interface Staff {
  id: string;
  email: string;
  name: string | null;
  role: StaffRole;
  restaurantId: string | null;
}

export interface StaffRepository {
  findById(userId: string): Promise<Staff | null>;
}
