import 'dotenv/config';

import { loadEnv } from './config/env';
import { createServer } from './server';

const env = loadEnv();
const app = createServer();

app.listen(env.API_PORT, () => {
  console.log(`[nexa-api] listening on http://localhost:${env.API_PORT} (${env.NODE_ENV})`);
});
