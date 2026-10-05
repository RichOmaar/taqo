import type { Request, RequestHandler } from 'express';

import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors';

/**
 * Resolves the restaurant a request targets.
 *
 * Returns null when the target does not exist, which the middleware reports as
 * a 404 — the caller learns nothing about restaurants they cannot see.
 */
export type RestaurantResolver = (req: Request) => Promise<string | null>;

/**
 * Enforce that the signed-in staff user may act on the restaurant this request
 * targets. Must run after `requireStaff`, which populates `req.staff`.
 *
 * Without this, role alone was the only check: any hostess or admin could read
 * metrics for, and mutate, every restaurant in the system.
 */
export function requireRestaurantScope(resolve: RestaurantResolver): RequestHandler {
  return async (req, _res, next) => {
    try {
      const staff = req.staff;
      if (!staff) throw new UnauthorizedError();
      if (!staff.restaurantId) {
        throw new ForbiddenError('Staff user is not assigned to a restaurant');
      }

      const targetId = await resolve(req);
      if (!targetId) throw new NotFoundError();

      // Report a cross-restaurant target as 404 rather than 403: a 403 would
      // confirm the resource exists to someone with no right to know.
      if (targetId !== staff.restaurantId) throw new NotFoundError();

      next();
    } catch (error) {
      next(error);
    }
  };
}
