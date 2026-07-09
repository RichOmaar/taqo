import 'dotenv/config';

import { loadEnv } from './config/env';
import { buildContainer } from './composition';
import type { WaitlistEventPublisher } from './contexts/waitlist/application/ports';
import { createServer } from './server';

const env = loadEnv();

// No-op publisher until the WebSocket layer lands (NEXA-010).
const publisher: WaitlistEventPublisher = { entryAdded: () => {} };

const container = buildContainer(publisher);
const app = createServer(container);

app.listen(env.API_PORT, () => {
  console.log(`[nexa-api] listening on http://localhost:${env.API_PORT} (${env.NODE_ENV})`);
});
