import { PORT_ENV_VARS, devTrustedOrigins, resolvePort } from '@nexa/ports';
import { z } from 'zod';

/** The subset of `process.env` this module reads. */
type EnvSource = Record<string, string | undefined>;

/**
 * Variables that can set the port, most specific first.
 *
 * `NEXA_API_PORT` is the monorepo-wide name set in the root `.env`, so a local
 * override is never silently ignored. `API_PORT` is kept for compatibility with
 * existing per-app `.env` files, and `PORT` is what most hosting platforms
 * inject, covering deploys where no `.env` exists at all.
 */
const PORT_SOURCES = [PORT_ENV_VARS.api, 'API_PORT', 'PORT'] as const;

/** Resolve the port to bind, reporting errors against the variable actually used. */
function resolveApiPort(env: EnvSource): number {
  for (const name of PORT_SOURCES) {
    const raw = env[name]?.trim();
    if (!raw) continue;
    try {
      return resolvePort('api', { [PORT_ENV_VARS.api]: raw });
    } catch (error) {
      throw new Error((error as Error).message.replace(PORT_ENV_VARS.api, name));
    }
  }
  return resolvePort('api', {});
}

/**
 * Build the schema against a concrete environment.
 *
 * Defaults are derived at call time rather than at module load so they pick up
 * whatever `dotenv` put in `process.env`, no matter the import order.
 */
function buildSchema(env: EnvSource, apiPort: number) {
  return z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(16),
    BETTER_AUTH_URL: z.string().url().default(`http://localhost:${apiPort}`),
    /**
     * Comma-separated origins allowed to authenticate. Defaults to the local dev
     * ports of client/reception/admin; e2e and deployed environments run on
     * different ports and must pass their own.
     */
    TRUSTED_ORIGINS: z
      .string()
      .default(devTrustedOrigins(env).join(','))
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    /** How often to sweep expired (notified but not seated) entries, in ms. */
    EXPIRATION_SWEEP_MS: z.coerce.number().int().positive().default(30000),
    // Web push (VAPID). Optional: push is a no-op when unset.
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().default('mailto:dev@nexa.local'),
  });
}

/**
 * Validated configuration.
 *
 * `API_PORT` is resolved outside the schema because it accepts several variable
 * names; everything else maps one-to-one onto its own variable.
 */
export type Env = z.infer<ReturnType<typeof buildSchema>> & { API_PORT: number };

let cached: Env | null = null;

/** Parse and validate process.env once. Throws on invalid configuration. */
export function loadEnv(): Env {
  if (cached) return cached;

  const source: EnvSource = process.env;
  const apiPort = resolveApiPort(source);

  const parsed = buildSchema(source, apiPort).safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cached = { ...parsed.data, API_PORT: apiPort };
  return cached;
}
