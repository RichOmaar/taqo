import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express, { type Express } from 'express';

import { auth } from './auth';
import type { Container } from './composition';
import { restaurantRouter } from './contexts/restaurant/interfaces/restaurant-router';
import { waitlistRouter } from './contexts/waitlist/interfaces/waitlist-router';
import { errorHandler, notFoundHandler } from './http/middleware/error-handler';
import { healthRouter } from './http/routes/health';

/** Build and configure the Express application. */
export function createServer(container: Container): Express {
  const app = express();

  app.use(cors());

  // BetterAuth must be mounted before the JSON parser (it reads the raw body).
  app.all('/api/auth/*', toNodeHandler(auth));

  app.use(express.json());

  app.use('/health', healthRouter);
  app.use(restaurantRouter(container.restaurants, container.restaurantConfig));
  app.use(
    waitlistRouter(
      container.joinWaitlist,
      container.listQueueEntries,
      container.getEntry,
      container.entryActions,
    ),
  );

  // 404 + centralized error handling — must be registered last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
