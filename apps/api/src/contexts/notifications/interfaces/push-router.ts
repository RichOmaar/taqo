import type { VapidKeyResponse } from '@nexa/types';
import { Router } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../../shared/errors';
import type { PushSubscriptionRepository } from '../domain/push-subscription-repository';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

/** Routes: VAPID public key and push subscription registration (by entry id). */
export function pushRouter(
  subscriptions: PushSubscriptionRepository,
  publicKey: string | undefined,
): Router {
  const router = Router();

  router.get('/push/public-key', (_req, res) => {
    const response: VapidKeyResponse = { publicKey: publicKey ?? null };
    res.json(response);
  });

  router.post('/entries/:id/push-subscription', async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) throw new ValidationError('Missing entry id');
      const parsed = subscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid subscription', { issues: parsed.error.issues });
      }
      await subscriptions.save({
        entryId: id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      });
      res.status(201).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
