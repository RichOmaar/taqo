import 'dotenv/config';

import { type ChildProcess, execSync, spawn } from 'node:child_process';

import pg from 'pg';
import type { GlobalSetupContext } from 'vitest/node';

const TEST_DB = 'nexa_e2e';
const PORT = 4790;
const BASE = `http://127.0.0.1:${PORT}`;

function testDatabaseUrl(adminUrl: string): string {
  return adminUrl.replace(/\/[^/]+$/, `/${TEST_DB}`);
}

async function dropAndCreate(adminUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await client.query(`CREATE DATABASE ${TEST_DB}`);
  await client.end();
}

async function dropDatabase(adminUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await client.end();
}

async function waitForHealth(): Promise<void> {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('E2E server did not become healthy');
}

export default async function ({ provide }: GlobalSetupContext) {
  const adminUrl = process.env.DATABASE_URL ?? 'postgresql://nexa:nexa@localhost:5433/nexa';
  const dbUrl = testDatabaseUrl(adminUrl);

  await dropAndCreate(adminUrl);

  // Prisma blocks migrate/push under Claude Code; unset the marker for the child.
  const childEnv = {
    ...process.env,
    DATABASE_URL: dbUrl,
    CLAUDECODE: '',
    CLAUDE_CODE: '',
    CLAUDE_CODE_ENTRYPOINT: '',
  };
  execSync('pnpm exec prisma db push --force-reset --skip-generate', {
    env: childEnv,
    stdio: 'ignore',
  });
  execSync('pnpm exec tsx prisma/seed.ts', { env: childEnv, stdio: 'ignore' });

  const server: ChildProcess = spawn('pnpm', ['exec', 'tsx', 'src/index.ts'], {
    env: { ...childEnv, API_PORT: String(PORT) },
    stdio: 'ignore',
  });

  await waitForHealth();
  provide('baseUrl', BASE);

  return async () => {
    server.kill('SIGKILL');
    await dropDatabase(adminUrl);
  };
}
