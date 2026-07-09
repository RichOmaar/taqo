import { createServer } from './server';

const port = Number(process.env.API_PORT ?? 4000);

const app = createServer();

app.listen(port, () => {
  console.log(`[nexa-api] listening on http://localhost:${port}`);
});
