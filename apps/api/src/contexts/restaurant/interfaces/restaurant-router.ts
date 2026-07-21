import type {
  GetMetricsResponse,
  GetMetricsSeriesResponse,
  GetRestaurantResponse,
  ListRestaurantsResponse,
  QueueResponse,
} from '@nexa/types';
import { METRICS_BUCKETS } from '@nexa/types';
import { Router } from 'express';
import { z } from 'zod';

import { requireStaff } from '../../../http/middleware/require-staff';
import { requireRestaurantScope } from '../../../http/middleware/restaurant-scope';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { GetMetrics } from '../application/get-metrics';
import type { GetMetricsSeries } from '../application/get-metrics-series';
import type { ListRestaurants } from '../application/list-restaurants';
import type { RestaurantConfig } from '../application/restaurant-config';
import type { RestaurantRepository } from '../domain/restaurant-repository';

/** ISO-8601 instant, e.g. 2026-07-21T06:00:00.000Z. */
const isoDate = z
  .string()
  .datetime()
  .transform((value) => new Date(value));

const metricsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
});

const metricsSeriesQuerySchema = metricsQuerySchema.extend({
  bucket: z.enum(METRICS_BUCKETS).optional(),
});

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
  list: ListRestaurants,
  metrics: GetMetrics,
  metricsSeries: GetMetricsSeries,
  config: RestaurantConfig,
): Router {
  const router = Router();

  // Staff may only touch their own restaurant, addressed either by code or via
  // one of its queues.
  const scopeByCode = requireRestaurantScope((req) =>
    restaurants.findIdByCode(String(req.params.code)),
  );
  const scopeByQueue = requireRestaurantScope(async (req) => {
    const queue = await restaurants.findQueueById(String(req.params.id));
    return queue?.restaurantId ?? null;
  });

  router.get('/restaurants', async (_req, res, next) => {
    try {
      const restaurantsList = await list.execute();
      const response: ListRestaurantsResponse = { restaurants: restaurantsList };
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get('/restaurants/:code', async (req, res, next) => {
    try {
      const found = await restaurants.findByCode(req.params.code);
      if (!found) throw new NotFoundError('Restaurant not found');
      res.json(found);
    } catch (error) {
      next(error);
    }
  });

  router.get('/restaurants/:code/metrics', requireStaff, scopeByCode, async (req, res, next) => {
    try {
      const code = req.params.code;
      if (!code) throw new ValidationError('Missing restaurant code');

      const parsed = metricsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError('Invalid range', { issues: parsed.error.issues });
      }

      const result = await metrics.execute(code, parsed.data);
      const asIso = (range: { from: Date; to: Date }) => ({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      });

      const response: GetMetricsResponse = {
        metrics: result.metrics,
        range: asIso(result.range),
        previous: result.previous,
        previousRange: asIso(result.previousRange),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/restaurants/:code/metrics/timeseries',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const code = req.params.code;
        if (!code) throw new ValidationError('Missing restaurant code');

        const parsed = metricsSeriesQuerySchema.safeParse(req.query);
        if (!parsed.success) {
          throw new ValidationError('Invalid series query', { issues: parsed.error.issues });
        }

        const result = await metricsSeries.execute(code, parsed.data);
        const response: GetMetricsSeriesResponse = {
          points: result.points,
          bucket: result.bucket,
          range: {
            from: result.range.from.toISOString(),
            to: result.range.to.toISOString(),
          },
          timezone: result.timezone,
        };
        res.json(response);
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch('/restaurants/:code', requireStaff, scopeByCode, async (req, res, next) => {
    try {
      const parsed = updateConfigSchema.safeParse(req.body);
      if (!parsed.success)
        throw new ValidationError('Invalid config', { issues: parsed.error.issues });
      const code = req.params.code;
      if (!code) throw new ValidationError('Missing restaurant code');
      const updated = await config.updateConfig(code, parsed.data);
      const response: GetRestaurantResponse = updated;
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/restaurants/:code/queues', requireStaff, scopeByCode, async (req, res, next) => {
    try {
      const parsed = addQueueSchema.safeParse(req.body);
      if (!parsed.success)
        throw new ValidationError('Invalid queue', { issues: parsed.error.issues });
      const code = req.params.code;
      if (!code) throw new ValidationError('Missing restaurant code');
      const updated = await config.addQueue(code, parsed.data.name, parsed.data.priority ?? 0);
      const response: GetRestaurantResponse = updated;
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/queues/:id', requireStaff, scopeByQueue, async (req, res, next) => {
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
