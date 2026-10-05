import type { StaffRole } from '@nexa/types';
import { fromNodeHeaders } from 'better-auth/node';
import type { RequestHandler } from 'express';

import { auth } from '../../auth';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors';

const STAFF_ROLES = new Set<string>(['admin', 'hostess']);

/** The authenticated staff user, resolved from the bearer session. */
export interface AuthenticatedStaff {
  userId: string;
  role: StaffRole;
  /** Restaurant the user may act on; null when unassigned (a misconfiguration). */
  restaurantId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: AuthenticatedStaff;
    }
  }
}

interface SessionUser {
  id: string;
  role?: string | null;
  restaurantId?: string | null;
}

/**
 * Require an authenticated staff user (hostess or admin) via bearer token.
 *
 * Attaches the resolved staff to `req.staff` so downstream handlers can
 * enforce the restaurant scope without re-reading the session.
 */
export const requireStaff: RequestHandler = async (req, _res, next) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) throw new UnauthorizedError();

    const user = session.user as unknown as SessionUser;
    const role = user.role ?? 'diner';
    if (!STAFF_ROLES.has(role)) throw new ForbiddenError();

    req.staff = {
      userId: user.id,
      role: role as StaffRole,
      restaurantId: user.restaurantId ?? null,
    };
    next();
  } catch (error) {
    next(error);
  }
};
