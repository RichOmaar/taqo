import { defineConfig, devices } from '@playwright/test';

const API_PORT = 4790;
const CLIENT_PORT = 3102;
const RECEPTION_PORT = 3103;
const TEST_DB_URL = 'postgresql://nexa:nexa@localhost:5433/nexa_e2e';
const apiBase = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: './e2e-web',
  globalSetup: './e2e-web/global-setup.ts',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @nexa/api start',
      port: API_PORT,
      env: {
        DATABASE_URL: TEST_DB_URL,
        API_PORT: String(API_PORT),
        // The apps run on e2e-specific ports, which BetterAuth rejects as
        // untrusted origins unless they are declared here.
        TRUSTED_ORIGINS: `http://localhost:${CLIENT_PORT},http://localhost:${RECEPTION_PORT}`,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `pnpm --filter @nexa/client exec next dev -p ${CLIENT_PORT}`,
      port: CLIENT_PORT,
      env: { NEXT_PUBLIC_API_URL: apiBase },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm --filter @nexa/reception exec next dev -p ${RECEPTION_PORT}`,
      port: RECEPTION_PORT,
      env: { NEXT_PUBLIC_API_URL: apiBase },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
