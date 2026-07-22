import { Router } from 'express';

import { requireStaff } from '../../../http/middleware/require-staff';
import { UnauthorizedError } from '../../../shared/errors';
import type { GetCurrentStaff } from '../application/get-current-staff';

/** Routes for the signed-in identity. */
export function identityRouter(getCurrentStaff: GetCurrentStaff): Router {
  const router = Router();

  router.get('/me', requireStaff, async (req, res, next) => {
    try {
      if (!req.staff) throw new UnauthorizedError();
      res.json(await getCurrentStaff.execute(req.staff.userId));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
