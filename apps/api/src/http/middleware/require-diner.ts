import { fromNodeHeaders } from 'better-auth/node';
import type { RequestHandler } from 'express';

import { auth } from '../../auth';
import { UnauthorizedError } from '../../shared/errors';

/** Any signed-in user, whatever their role. */
export interface AuthenticatedDiner {
  userId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      diner?: AuthenticatedDiner;
    }
  }
}

/**
 * Require a signed-in account, of any role.
 *
 * Distinct from `requireStaff`: a membership belongs to a diner, and staff have
 * no business spending someone else's points. It authenticates only — deciding
 * whether this user owns the thing being acted on is the route's job.
 */
export const requireDiner: RequestHandler = async (req, _res, next) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) throw new UnauthorizedError();

    req.diner = { userId: (session.user as { id: string }).id };
    next();
  } catch (error) {
    next(error);
  }
};
