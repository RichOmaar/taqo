import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PORTS,
  PORT_BLOCK,
  PORT_ENV_VARS,
  SERVICE_NAMES,
  devTrustedOrigins,
  e2eTrustedOrigins,
  isInReservedBlock,
  localUrl,
  postgresUrl,
  resolvePort,
  resolvePorts,
} from './index';

/** Read a repo file relative to the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../../../${relativePath}`, import.meta.url), 'utf8');
}

describe('resolvePort', () => {
  it('falls back to the default when the variable is unset', () => {
    expect(resolvePort('client', {})).toBe(DEFAULT_PORTS.client);
  });

  it('prefers the environment override', () => {
    expect(resolvePort('client', { NEXA_CLIENT_PORT: '9500' })).toBe(9500);
  });

  it('ignores an empty or whitespace-only override', () => {
    expect(resolvePort('api', { NEXA_API_PORT: '' })).toBe(DEFAULT_PORTS.api);
    expect(resolvePort('api', { NEXA_API_PORT: '   ' })).toBe(DEFAULT_PORTS.api);
  });

  it('trims surrounding whitespace', () => {
    expect(resolvePort('api', { NEXA_API_PORT: ' 9400 ' })).toBe(9400);
  });

  it('throws on a non-numeric override rather than silently defaulting', () => {
    expect(() => resolvePort('api', { NEXA_API_PORT: 'nope' })).toThrow(/NEXA_API_PORT/);
    expect(() => resolvePort('api', { NEXA_API_PORT: '90a0' })).toThrow(/positive integer/);
  });

  it('throws on a port outside the TCP range', () => {
    expect(() => resolvePort('api', { NEXA_API_PORT: '0' })).toThrow(/between 1 and 65535/);
    expect(() => resolvePort('api', { NEXA_API_PORT: '70000' })).toThrow(/between 1 and 65535/);
  });
});

describe('resolvePorts', () => {
  it('resolves every service', () => {
    expect(resolvePorts({})).toEqual(DEFAULT_PORTS);
  });

  it('applies overrides per service, leaving the rest at their defaults', () => {
    const ports = resolvePorts({ NEXA_ADMIN_PORT: '9777' });
    expect(ports.admin).toBe(9777);
    expect(ports.client).toBe(DEFAULT_PORTS.client);
  });
});

describe('url helpers', () => {
  it('builds a localhost url from the resolved port', () => {
    expect(localUrl('api', {})).toBe(`http://localhost:${DEFAULT_PORTS.api}`);
    expect(localUrl('api', { NEXA_API_PORT: '9999' })).toBe('http://localhost:9999');
  });

  it('trusts the three browser-facing apps in dev, but not landing', () => {
    const origins = devTrustedOrigins({});
    expect(origins).toEqual([
      `http://localhost:${DEFAULT_PORTS.client}`,
      `http://localhost:${DEFAULT_PORTS.reception}`,
      `http://localhost:${DEFAULT_PORTS.admin}`,
    ]);
    expect(origins).not.toContain(`http://localhost:${DEFAULT_PORTS.landing}`);
  });

  it('trusts the e2e app ports during test runs', () => {
    expect(e2eTrustedOrigins({})).toEqual([
      `http://localhost:${DEFAULT_PORTS.e2eClient}`,
      `http://localhost:${DEFAULT_PORTS.e2eReception}`,
    ]);
  });

  it('builds a postgres url on the resolved port', () => {
    expect(postgresUrl('nexa', {})).toBe(
      `postgresql://nexa:nexa@localhost:${DEFAULT_PORTS.postgres}/nexa`,
    );
    expect(postgresUrl('nexa_e2e', { NEXA_POSTGRES_PORT: '5433' })).toBe(
      'postgresql://nexa:nexa@localhost:5433/nexa_e2e',
    );
  });
});

describe('the reserved block', () => {
  it('contains every default port', () => {
    for (const service of SERVICE_NAMES) {
      expect(isInReservedBlock(DEFAULT_PORTS[service])).toBe(true);
    }
  });

  it('rejects ports outside the block', () => {
    expect(isInReservedBlock(PORT_BLOCK.start - 1)).toBe(false);
    expect(isInReservedBlock(PORT_BLOCK.end + 1)).toBe(false);
    expect(isInReservedBlock(3000)).toBe(false);
  });

  it('assigns a distinct port to every service', () => {
    const ports = Object.values(DEFAULT_PORTS);
    expect(new Set(ports).size).toBe(ports.length);
  });

  it("leaves Node's --inspect default (9229) free", () => {
    expect(Object.values(DEFAULT_PORTS)).not.toContain(9229);
  });
});

/**
 * The shell fallbacks in package.json and the documented values in
 * `.env.example` restate these numbers where TypeScript cannot reach. These
 * tests are what keep the restatements honest.
 */
describe('the rest of the repo agrees with this map', () => {
  // The Next apps take their port from a shell fallback; the API resolves its
  // own through `resolvePort`, so it has no literal to check.
  const nextApps = [
    ['landing', 'apps/landing/package.json'],
    ['client', 'apps/client/package.json'],
    ['reception', 'apps/reception/package.json'],
    ['admin', 'apps/admin/package.json'],
  ] as const;

  it.each(nextApps)('%s dev script falls back to the default port', (service, manifest) => {
    const scripts = (JSON.parse(readRepoFile(manifest)) as { scripts: Record<string, string> })
      .scripts;
    const pattern = new RegExp(`\\$\\{${PORT_ENV_VARS[service]}:-(\\d+)\\}`);
    const match = pattern.exec(scripts.dev ?? '');
    expect(match, `${manifest} dev script must fall back to a literal port`).not.toBeNull();
    expect(Number(match?.[1])).toBe(DEFAULT_PORTS[service]);
  });

  it.each(nextApps)('%s dev script loads the root .env', (_service, manifest) => {
    const scripts = (JSON.parse(readRepoFile(manifest)) as { scripts: Record<string, string> })
      .scripts;
    expect(scripts.dev).toContain('dotenv -e ../../.env');
  });

  it('.env.example documents every service at its default port', () => {
    const example = readRepoFile('.env.example');
    for (const service of SERVICE_NAMES) {
      const variable = PORT_ENV_VARS[service];
      const match = new RegExp(`^${variable}=(\\d+)$`, 'm').exec(example);
      expect(match, `.env.example is missing ${variable}`).not.toBeNull();
      expect(Number(match?.[1]), `${variable} disagrees with DEFAULT_PORTS`).toBe(
        DEFAULT_PORTS[service],
      );
    }
  });

  it('docker-compose maps postgres through its environment variable', () => {
    const compose = readRepoFile('docker-compose.yml');
    expect(compose).toContain(`\${${PORT_ENV_VARS.postgres}:-${DEFAULT_PORTS.postgres}}:5432`);
  });
});
