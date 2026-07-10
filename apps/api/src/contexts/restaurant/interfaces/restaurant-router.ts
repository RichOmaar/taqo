import type { GetRestaurantResponse, QueueResponse } from '@nexa/types';
import { Router } from 'express';
import { z } from 'zod';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { RestaurantConfig } from '../application/restaurant-config';
import type { RestaurantRepository } from '../domain/restaurant-repository';

const updateConfigSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  etaBaseMinutes: z.number().int().positive().max(600).optional(),
  expirationMinutes: z.number().int().positive().max(600).optional(),
});

const addQueueSchema = z.object({
  name: z.string().min(1).max(60),
  priority: z.number().int().min(0).max(100).optional(),
});

const updateQueueSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

/** Routes for reading and editing restaurant config and its queues. */
export function restaurantRouter(
  restaurants: RestaurantRepository,
  config: RestaurantConfig,
): Router {
  const router = Router();

  router.get('/restaurants/:code', async (req, res, next) => {
    try {
      const found = await restaurants.findByCode(req.params.code);
      if (!found) throw new NotFoundError('Restaurant not found');
      res.json(found);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/restaurants/:code', async (req, res, next) => {
    try {
      const parsed = updateConfigSchema.safeParse(req.body);
      if (!parsed.success)
        throw new ValidationError('Invalid config', { issues: parsed.error.issues });
      const updated = await config.updateConfig(req.params.code, parsed.data);
      const response: GetRestaurantResponse = updated;
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/restaurants/:code/queues', async (req, res, next) => {
    try {
      const parsed = addQueueSchema.safeParse(req.body);
      if (!parsed.success)
        throw new ValidationError('Invalid queue', { issues: parsed.error.issues });
      const updated = await config.addQueue(
        req.params.code,
        parsed.data.name,
        parsed.data.priority ?? 0,
      );
      const response: GetRestaurantResponse = updated;
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/queues/:id', async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) throw new ValidationError('Missing queue id');
      const parsed = updateQueueSchema.safeParse(req.body);
      if (!parsed.success)
        throw new ValidationError('Invalid queue', { issues: parsed.error.issues });
      const queue = await config.updateQueue(id, parsed.data);
      const response: QueueResponse = { queue };
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
