import { config } from 'dotenv';

/**
 * Load the same configuration the dev stack uses.
 *
 * Vitest only auto-loads this app's own `.env`, which since the ports refactor
 * holds nothing: the real values live in the monorepo root. The per-app file is
 * loaded first because `dotenv` never overwrites an already-set variable, which
 * is what makes it an override rather than a fallback.
 */
config({ path: new URL('.env', import.meta.url) });
config({ path: new URL('../../.env', import.meta.url) });
