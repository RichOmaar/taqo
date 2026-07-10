import { fromNodeHeaders } from 'better-auth/node';
import type { RequestHandler } from 'express';

import { auth } from '../../auth';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors';

const STAFF_ROLES = new Set(['admin', 'hostess']);

/** Require an authenticated staff user (hostess or admin) via bearer token. */
export const requireStaff: RequestHandler = async (req, _res, next) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) throw new UnauthorizedError();
    const role = (session.user as { role?: string | null }).role ?? 'diner';
    if (!STAFF_ROLES.has(role)) throw new ForbiddenError();
    next();
  } catch (error) {
    next(error);
  }
};
