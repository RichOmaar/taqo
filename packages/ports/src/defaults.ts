/**
 * Canonical port map for Nexa.
 *
 * Every port the monorepo binds lives inside a single reserved block so that
 * running Nexa never collides with another project on the same machine. Change
 * a number here and it propagates to the API, the Next apps, docker-compose and
 * both e2e suites; local overrides go in the root `.env` instead (see
 * `PORT_ENV_VARS`), which is git-ignored and never affects deploys.
 */

/** Inclusive bounds of the block reserved for Nexa. Nothing may bind outside it. */
export const PORT_BLOCK = { start: 9000, end: 9999 } as const;

/**
 * Default port per service.
 *
 * Dev services sit in 9000–9099 and their e2e counterparts in 9100–9199, so a
 * dev stack and a test run can be up at the same time without fighting. 9229 is
 * deliberately left alone: it is Node's `--inspect` default.
 */
export const DEFAULT_PORTS = {
  // Dev stack
  landing: 9000,
  client: 9001,
  reception: 9002,
  admin: 9003,
  api: 9010,
  postgres: 9020,
  // E2E stack (dev port + 100 for the apps, so the two never overlap)
  e2eClient: 9101,
  e2eReception: 9102,
  e2eApi: 9110,
} as const;

/** A service whose port Nexa controls. */
export type ServiceName = keyof typeof DEFAULT_PORTS;

/**
 * Environment variable that overrides each service's port.
 *
 * These are read from the root `.env`. They are the only supported way to move
 * a port locally: no port is hardcoded anywhere else in the repo.
 */
export const PORT_ENV_VARS = {
  landing: 'NEXA_LANDING_PORT',
  client: 'NEXA_CLIENT_PORT',
  reception: 'NEXA_RECEPTION_PORT',
  admin: 'NEXA_ADMIN_PORT',
  api: 'NEXA_API_PORT',
  postgres: 'NEXA_POSTGRES_PORT',
  e2eClient: 'NEXA_E2E_CLIENT_PORT',
  e2eReception: 'NEXA_E2E_RECEPTION_PORT',
  e2eApi: 'NEXA_E2E_API_PORT',
} as const satisfies Record<ServiceName, string>;

/** The services a browser talks to, i.e. the ones that need a trusted origin. */
export const BROWSER_SERVICES = ['client', 'reception', 'admin'] as const;

/** Every service name, useful for iterating the whole map. */
export const SERVICE_NAMES = Object.keys(DEFAULT_PORTS) as ServiceName[];
