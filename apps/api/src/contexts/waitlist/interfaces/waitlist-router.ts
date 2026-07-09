import type { JoinWaitlistResponse, ListQueueEntriesResponse } from '@nexa/types';
import { Router } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../../shared/errors';
import type { JoinWaitlist } from '../application/join-waitlist';
import type { ListQueueEntries } from '../application/list-queue-entries';

const joinSchema = z.object({
  queueId: z.string().uuid(),
  displayName: z.string().min(1).max(80),
  partySize: z.number().int().positive().max(50),
  phone: z.string().max(30).nullable().optional(),
  formData: z.record(z.unknown()).optional(),
});

/** Routes for joining a queue and reading a queue snapshot. */
export function waitlistRouter(join: JoinWaitlist, list: ListQueueEntries): Router {
  const router = Router();

  router.post('/restaurants/:code/waitlist', async (req, res, next) => {
    try {
      const parsed = joinSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid join payload', { issues: parsed.error.issues });
      }
      const entry = await join.execute({ restaurantCode: req.params.code, ...parsed.data });
      const response: JoinWaitlistResponse = { entry };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get('/restaurants/:restaurantId/queues/:queueId/entries', async (req, res, next) => {
    try {
      const entries = await list.execute(req.params.queueId);
      const response: ListQueueEntriesResponse = { entries };
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
