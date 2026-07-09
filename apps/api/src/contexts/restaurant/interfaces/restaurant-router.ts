import { Router } from 'express';

import { NotFoundError } from '../../../shared/errors';
import type { RestaurantRepository } from '../domain/restaurant-repository';

/** Routes: GET /restaurants/:code -> restaurant with its active queues. */
export function restaurantRouter(restaurants: RestaurantRepository): Router {
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

  return router;
}
