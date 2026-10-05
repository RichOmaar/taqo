import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';

import { loadEnv } from './config/env';
import { prisma } from './db/prisma';

const env = loadEnv();

/**
 * BetterAuth instance. Email/password identity with a `role` field
 * (diner by default; staff are hostess/admin). The bearer plugin lets the
 * frontends authenticate cross-origin with a token instead of cookies.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  // Rate limiting is a production concern; disabling it in dev avoids noisy 403s.
  rateLimit: { enabled: env.NODE_ENV === 'production' },
  trustedOrigins: env.TRUSTED_ORIGINS,
  user: {
    additionalFields: {
      // Not settable at sign-up (input: false); staff roles are assigned by seed/admin.
      role: { type: 'string', required: false, defaultValue: 'diner', input: false },
      // Restaurant a staff user is scoped to; null for diners. Carried on the
      // session so authorization does not need a database round trip.
      restaurantId: { type: 'string', required: false, input: false },
    },
  },
  plugins: [bearer()],
});

export type Auth = typeof auth;
