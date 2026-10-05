import type {
  EntryActionResponse,
  GetEntryResponse,
  JoinWaitlistResponse,
  ListQueueEntriesResponse,
  SubmitReviewResponse,
  WaitlistEntry,
} from '@nexa/types';
import { fromNodeHeaders } from 'better-auth/node';
import type { RequestHandler } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { auth } from '../../../auth';
import { requireStaff } from '../../../http/middleware/require-staff';
import { requireRestaurantScope } from '../../../http/middleware/restaurant-scope';
import { ValidationError } from '../../../shared/errors';
import type { EntryActions } from '../application/entry-actions';
import type { GetEntry } from '../application/get-entry';
import type { JoinWaitlist } from '../application/join-waitlist';
import type { ListQueueEntries } from '../application/list-queue-entries';
import type { SubmitReview } from '../application/submit-review';

const joinSchema = z.object({
  queueId: z.string().uuid(),
  displayName: z.string().min(1).max(80),
  partySize: z.number().int().positive().max(50),
  phone: z.string().max(30).nullable().optional(),
  formData: z.record(z.unknown()).optional(),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(500).nullable().optional(),
});

/** Wrap an entry action into a route handler returning the updated entry. */
function actionRoute(action: (id: string) => Promise<WaitlistEntry>): RequestHandler {
  return async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) throw new ValidationError('Missing entry id');
      const entry = await action(id);
      const response: EntryActionResponse = { entry };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}

/** Routes for joining a queue, reading a snapshot, and entry lifecycle actions. */
export function waitlistRouter(
  join: JoinWaitlist,
  list: ListQueueEntries,
  getEntry: GetEntry,
  actions: EntryActions,
  submitReview: SubmitReview,
): Router {
  const router = Router();

  // Entry actions are addressed by entry id, so the restaurant comes from the
  // entry itself: a hostess must not act on another restaurant's queue.
  const scopeByEntry = requireRestaurantScope(async (req) => {
    const entry = await getEntry.execute(String(req.params.id));
    return entry.restaurantId;
  });

  router.get('/entries/:id', async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) throw new ValidationError('Missing entry id');
      const entry = await getEntry.execute(id);
      const response: GetEntryResponse = { entry };
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/entries/:id/review', async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) throw new ValidationError('Missing entry id');
      const parsed = reviewSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid review', { issues: parsed.error.issues });
      }
      const review = await submitReview.execute({ entryId: id, ...parsed.data });
      const response: SubmitReviewResponse = { review };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Diner self-cancel — the entry id is the capability, no staff auth required.
  router.post(
    '/entries/:id/leave',
    actionRoute((id) => actions.cancel(id)),
  );

  router.post('/restaurants/:code/waitlist', async (req, res, next) => {
    try {
      const parsed = joinSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid join payload', { issues: parsed.error.issues });
      }
      // Optional auth: link the entry to the diner's account when signed in.
      const session = await auth.api
        .getSession({ headers: fromNodeHeaders(req.headers) })
        .catch(() => null);
      const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
      const entry = await join.execute({
        restaurantCode: req.params.code,
        userId,
        ...parsed.data,
      });
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

  router.post(
    '/entries/:id/notify',
    requireStaff,
    scopeByEntry,
    actionRoute((id) => actions.notify(id)),
  );
  router.post(
    '/entries/:id/seat',
    requireStaff,
    scopeByEntry,
    actionRoute((id) => actions.seat(id)),
  );
  router.post(
    '/entries/:id/no-show',
    requireStaff,
    scopeByEntry,
    actionRoute((id) => actions.markNoShow(id)),
  );
  router.post(
    '/entries/:id/cancel',
    requireStaff,
    scopeByEntry,
    actionRoute((id) => actions.cancel(id)),
  );

  return router;
}
