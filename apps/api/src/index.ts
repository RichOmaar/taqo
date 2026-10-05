import 'dotenv/config';

import { createServer as createHttpServer } from 'node:http';

import { Server as IOServer } from 'socket.io';

import { loadEnv } from './config/env';
import { buildContainer } from './composition';
import { createWaitlistPublisher, setupWaitlistGateway } from './realtime/waitlist-gateway';
import { createServer } from './server';

const env = loadEnv();

const httpServer = createHttpServer();
const io = new IOServer(httpServer, { cors: { origin: '*' } });

const publisher = createWaitlistPublisher(io);
setupWaitlistGateway(io);

const container = buildContainer(publisher);
const app = createServer(container);
httpServer.on('request', app);

httpServer.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `[nexa-api] port ${env.API_PORT} is already in use. Set API_PORT in apps/api/.env to a free port.`,
    );
    process.exit(1);
  }
  throw error;
});

httpServer.listen(env.API_PORT, () => {
  console.log(`[nexa-api] listening on http://localhost:${env.API_PORT} (${env.NODE_ENV})`);
});
