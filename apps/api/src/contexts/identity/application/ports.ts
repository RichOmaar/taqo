import type { Restaurant } from '@nexa/types';

/**
 * Outbound port for reading the restaurant a staff user is scoped to.
 *
 * Declared here rather than importing the restaurant context's repository, so
 * identity stays independent of it; the composition root supplies the adapter.
 */
export interface RestaurantLookup {
  findById(id: string): Promise<Restaurant | null>;
}
