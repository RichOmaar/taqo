/**
 * Single source of truth for every port Nexa binds.
 *
 * Consumers (API config, docker-compose, Playwright, both e2e suites, the Next
 * dev scripts) resolve ports through here instead of hardcoding numbers, so a
 * port move is a one-line change in the root `.env`.
 */

import {
  BROWSER_SERVICES,
  DEFAULT_PORTS,
  PORT_BLOCK,
  PORT_ENV_VARS,
  SERVICE_NAMES,
  type ServiceName,
} from './defaults';

export {
  BROWSER_SERVICES,
  DEFAULT_PORTS,
  PORT_BLOCK,
  PORT_ENV_VARS,
  SERVICE_NAMES,
  type ServiceName,
};

/** The subset of `process.env` this module needs. */
export type EnvSource = Record<string, string | undefined>;

/** Highest port number TCP allows. */
const MAX_PORT = 65535;

/**
 * Resolve one service's port, preferring its environment override.
 *
 * A malformed override throws rather than silently falling back: a typo in
 * `.env` that quietly starts the app on an unexpected port is far harder to
 * diagnose than a startup error naming the variable.
 */
export function resolvePort(service: ServiceName, env: EnvSource = process.env): number {
  const variable = PORT_ENV_VARS[service];
  const raw = env[variable]?.trim();
  if (!raw) return DEFAULT_PORTS[service];

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${variable} must be a positive integer, got "${raw}"`);
  }

  const port = Number(raw);
  if (port < 1 || port > MAX_PORT) {
    throw new Error(`${variable} must be between 1 and ${MAX_PORT}, got ${port}`);
  }

  return port;
}

/** Resolve every service's port in one pass. */
export function resolvePorts(env: EnvSource = process.env): Record<ServiceName, number> {
  const resolved = {} as Record<ServiceName, number>;
  for (const service of SERVICE_NAMES) {
    resolved[service] = resolvePort(service, env);
  }
  return resolved;
}

/** `http://localhost:<port>` for a service. */
export function localUrl(service: ServiceName, env: EnvSource = process.env): string {
  return `http://localhost:${resolvePort(service, env)}`;
}

/**
 * `http://localhost:<default port>` for a service, ignoring the environment.
 *
 * Use this for fallbacks that get bundled into browser code: it reads no
 * `process.env`, so it survives being inlined by Next. Dev servers pass the
 * resolved URL explicitly, so the fallback only shows up when nothing else did.
 */
export function defaultLocalUrl(service: ServiceName): string {
  return `http://localhost:${DEFAULT_PORTS[service]}`;
}

/**
 * Origins BetterAuth accepts during local development.
 *
 * Only the apps a diner or staff member signs in from: `landing` is static
 * marketing and never authenticates.
 */
export function devTrustedOrigins(env: EnvSource = process.env): string[] {
  return BROWSER_SERVICES.map((service) => localUrl(service, env));
}

/** Origins BetterAuth accepts while the e2e suites run. */
export function e2eTrustedOrigins(env: EnvSource = process.env): string[] {
  return [localUrl('e2eClient', env), localUrl('e2eReception', env)];
}

/** Postgres connection string for a database on the local instance. */
export function postgresUrl(database: string, env: EnvSource = process.env): string {
  return `postgresql://nexa:nexa@localhost:${resolvePort('postgres', env)}/${database}`;
}

/** True when `port` falls inside the block reserved for Nexa. */
export function isInReservedBlock(port: number): boolean {
  return port >= PORT_BLOCK.start && port <= PORT_BLOCK.end;
}
