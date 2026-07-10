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

httpServer.listen(env.API_PORT, () => {
  console.log(`[nexa-api] listening on http://localhost:${env.API_PORT} (${env.NODE_ENV})`);
});
