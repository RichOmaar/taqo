import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import type { AuthenticatedStaff } from './require-staff';
import { requireRestaurantScope } from './restaurant-scope';

const OWNER: AuthenticatedStaff = { userId: 'u1', role: 'admin', restaurantId: 'r1' };

/** Runs the middleware and resolves with whatever it passed to `next`. */
async function run(
  staff: AuthenticatedStaff | undefined,
  resolved: string | null,
): Promise<unknown> {
  const middleware = requireRestaurantScope(() => Promise.resolve(resolved));
  const req = { staff, params: { code: 'DEMO' } } as unknown as Request;

  return new Promise((resolve) => {
    middleware(req, {} as Response, (error?: unknown) => resolve(error));
  });
}

describe('requireRestaurantScope', () => {
  it('passes when the target is the staff user own restaurant', async () => {
    await expect(run(OWNER, 'r1')).resolves.toBeUndefined();
  });

  it('rejects a target belonging to another restaurant', async () => {
    await expect(run(OWNER, 'r2')).resolves.toBeInstanceOf(NotFoundError);
  });

  it('reports a cross-restaurant target as 404, not 403', async () => {
    // A 403 would confirm the resource exists to someone with no right to know.
    const error = (await run(OWNER, 'r2')) as NotFoundError;

    expect(error.status).toBe(404);
  });

  it('rejects when the target does not exist', async () => {
    await expect(run(OWNER, null)).resolves.toBeInstanceOf(NotFoundError);
  });

  it('rejects when requireStaff did not run', async () => {
    await expect(run(undefined, 'r1')).resolves.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects staff with no restaurant assigned', async () => {
    const unassigned: AuthenticatedStaff = { ...OWNER, restaurantId: null };

    await expect(run(unassigned, 'r1')).resolves.toBeInstanceOf(ForbiddenError);
  });

  it('does not resolve the target when the caller is not staff', async () => {
    const resolve = vi.fn().mockResolvedValue('r1');
    const middleware = requireRestaurantScope(resolve);
    const req = { params: {} } as unknown as Request;

    await new Promise((done) => middleware(req, {} as Response, done));

    expect(resolve).not.toHaveBeenCalled();
  });
});
