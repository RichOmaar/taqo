import { execSync } from 'node:child_process';

import pg from 'pg';

const ADMIN_URL = 'postgresql://nexa:nexa@localhost:5433/nexa';
const TEST_DB = 'nexa_e2e';
const TEST_URL = `postgresql://nexa:nexa@localhost:5433/${TEST_DB}`;

/** Provision a fresh isolated database (schema + seed) before the web servers use it. */
export default async function globalSetup() {
  const client = new pg.Client({ connectionString: ADMIN_URL });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await client.query(`CREATE DATABASE ${TEST_DB}`);
  await client.end();

  // Prisma blocks migrate/push under Claude Code; unset the marker for the child.
  const env = {
    ...process.env,
    DATABASE_URL: TEST_URL,
    CLAUDECODE: '',
    CLAUDE_CODE: '',
    CLAUDE_CODE_ENTRYPOINT: '',
  };
  execSync('pnpm exec prisma db push --force-reset --skip-generate', {
    cwd: 'apps/api',
    env,
    stdio: 'ignore',
  });
  execSync('pnpm exec tsx prisma/seed.ts', { cwd: 'apps/api', env, stdio: 'ignore' });
}
