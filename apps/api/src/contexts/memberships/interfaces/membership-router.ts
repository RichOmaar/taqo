import { ACCRUAL_MODES, DOWNGRADE_POLICIES, TIER_METRICS, TIER_PERIODS } from '@nexa/types';
import { Router } from 'express';
import { z } from 'zod';

import { requireDiner } from '../../../http/middleware/require-diner';
import { requireStaff } from '../../../http/middleware/require-staff';
import { requireRestaurantScope } from '../../../http/middleware/restaurant-scope';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/errors';
import { localDayRange, addDays, startOfLocalDay } from '../../../shared/time-range';
import type { RestaurantRepository } from '../../restaurant/domain/restaurant-repository';
import type { EnrollMember } from '../application/enroll-member';
import type { ManageProgram } from '../application/manage-program';
import type { RedeemReward } from '../application/redeem-reward';
import type { ValidateRedemption } from '../application/validate-redemption';
import { balanceFor } from '../domain/tier-policy';
import type {
  LedgerRepository,
  MembershipRepository,
  ProgramRepository,
  RewardRepository,
} from '../domain/repositories';
import type { StatsRepository } from '../infrastructure/prisma-stats-repository';

const programSchema = z.object({
  name: z.string().min(1).max(80),
  accrualMode: z.enum(ACCRUAL_MODES),
  pointsPerVisit: z.number().int().min(0).max(1000),
  tierMetric: z.enum(TIER_METRICS),
  tierPeriod: z.enum(TIER_PERIODS),
  tierWindowDays: z.number().int().min(1).max(3650).nullable(),
  downgradePolicy: z.enum(DOWNGRADE_POLICIES),
});

const tiersSchema = z.object({
  tiers: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        threshold: z.number().int().min(0),
        benefits: z.array(z.string().max(120)).max(10),
        position: z.number().int().min(0).max(20),
      }),
    )
    .max(10),
});

const rewardSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).nullable().default(null),
  costPoints: z.number().int().min(0).max(100_000),
  minTierPosition: z.number().int().min(0).max(20).nullable().default(null),
  limitPerMember: z.number().int().min(1).max(1000).nullable().default(null),
  isActive: z.boolean().default(true),
});

const codeSchema = z.object({ code: z.string().min(3).max(20) });

/** How far back programme statistics look by default. */
const STATS_LOOKBACK_DAYS = 90;

/**
 * Owner routes are scoped by restaurant code; diner routes act on the caller's
 * own membership. Nothing here lets one member read another's ledger.
 */
export function membershipRouter(
  restaurants: RestaurantRepository,
  programs: ProgramRepository,
  memberships: MembershipRepository,
  ledger: LedgerRepository,
  rewards: RewardRepository,
  manage: ManageProgram,
  enroll: EnrollMember,
  redeem: RedeemReward,
  validate: ValidateRedemption,
  stats: StatsRepository,
): Router {
  const router = Router();

  const scopeByCode = requireRestaurantScope((req) =>
    restaurants.findIdByCode(String(req.params.code)),
  );

  /** The owner's restaurant id, which is what a programme is keyed by. */
  async function ownerRefFor(code: string): Promise<string> {
    const id = await restaurants.findIdByCode(code);
    if (!id) throw new NotFoundError('Restaurant not found');
    return id;
  }

  // ---- Owner: programme configuration -------------------------------------

  router.get('/restaurants/:code/membership', requireStaff, scopeByCode, async (req, res, next) => {
    try {
      const ownerRef = await ownerRefFor(String(req.params.code));
      const program = await programs.findByOwner(ownerRef);
      res.json({ program, rewards: program ? await rewards.listByProgram(program.id) : [] });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/restaurants/:code/membership',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const parsed = programSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Invalid programme', { issues: parsed.error.issues });
        }
        const ownerRef = await ownerRefFor(String(req.params.code));
        res.status(201).json({ program: await manage.create(ownerRef, parsed.data) });
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    '/restaurants/:code/membership',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const parsed = programSchema.partial().safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Invalid programme', { issues: parsed.error.issues });
        }
        const ownerRef = await ownerRefFor(String(req.params.code));
        res.json({ program: await manage.update(ownerRef, parsed.data) });
      } catch (error) {
        next(error);
      }
    },
  );

  router.put(
    '/restaurants/:code/membership/tiers',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const parsed = tiersSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Invalid levels', { issues: parsed.error.issues });
        }
        const ownerRef = await ownerRefFor(String(req.params.code));
        res.json({ program: await manage.replaceTiers(ownerRef, parsed.data.tiers) });
      } catch (error) {
        next(error);
      }
    },
  );

  for (const action of ['publish', 'pause'] as const) {
    router.post(
      `/restaurants/:code/membership/${action}`,
      requireStaff,
      scopeByCode,
      async (req, res, next) => {
        try {
          const ownerRef = await ownerRefFor(String(req.params.code));
          const program =
            action === 'publish' ? await manage.publish(ownerRef) : await manage.pause(ownerRef);
          res.json({ program });
        } catch (error) {
          next(error);
        }
      },
    );
  }

  router.post(
    '/restaurants/:code/membership/rewards',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const parsed = rewardSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Invalid reward', { issues: parsed.error.issues });
        }
        const ownerRef = await ownerRefFor(String(req.params.code));
        res.status(201).json({ reward: await manage.createReward(ownerRef, parsed.data) });
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    '/restaurants/:code/membership/rewards/:rewardId',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const parsed = rewardSchema.partial().safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Invalid reward', { issues: parsed.error.issues });
        }
        const ownerRef = await ownerRefFor(String(req.params.code));
        const reward = await manage.updateReward(
          ownerRef,
          String(req.params.rewardId),
          parsed.data,
        );
        res.json({ reward });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/restaurants/:code/membership/stats',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const ownerRef = await ownerRefFor(String(req.params.code));
        const program = await programs.findByOwner(ownerRef);
        if (!program) throw new NotFoundError('This restaurant has no membership programme');

        const found = await restaurants.findByCode(String(req.params.code));
        const timezone = found?.restaurant.timezone ?? 'UTC';
        const today = localDayRange(new Date(), timezone);
        const range = {
          from: startOfLocalDay(addDays(today.from, -(STATS_LOOKBACK_DAYS - 1)), timezone),
          to: today.to,
        };

        res.json({ stats: await stats.compute(program.id, range) });
      } catch (error) {
        next(error);
      }
    },
  );

  // ---- Reception: validating a code at the counter -------------------------

  router.post('/memberships/redemptions/validate', requireStaff, async (req, res, next) => {
    try {
      const parsed = codeSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid code');
      res.json({ redemption: await validate.execute(parsed.data.code) });
    } catch (error) {
      next(error);
    }
  });

  // ---- Diner: their own membership ----------------------------------------

  router.post('/restaurants/:code/membership/join', requireDiner, async (req, res, next) => {
    try {
      const ownerRef = await ownerRefFor(String(req.params.code));
      const membership = await enroll.execute(ownerRef, req.diner!.userId);
      res.status(201).json({ membership });
    } catch (error) {
      next(error);
    }
  });

  router.get('/restaurants/:code/membership/me', requireDiner, async (req, res, next) => {
    try {
      const ownerRef = await ownerRefFor(String(req.params.code));
      const program = await programs.findByOwner(ownerRef);
      if (!program) throw new NotFoundError('This restaurant has no membership programme');

      const membership = await memberships.findByProgramAndUser(program.id, req.diner!.userId);
      if (!membership) {
        res.json({ membership: null, balance: null, program, rewards: [] });
        return;
      }

      const entries = await ledger.listByMembership(membership.id);
      res.json({
        membership,
        balance: balanceFor(program, entries, new Date(), membership.heldTierPosition),
        program,
        rewards: await rewards.listByProgram(program.id, true),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/memberships/:membershipId/redeem', requireDiner, async (req, res, next) => {
    try {
      const membershipId = String(req.params.membershipId);
      const membership = await memberships.findById(membershipId);
      if (!membership) throw new NotFoundError('Membership not found');

      // A membership id is not a capability: only its owner may spend it.
      if (membership.userId !== req.diner!.userId) {
        throw new ForbiddenError('That membership is not yours');
      }

      const parsed = z.object({ rewardId: z.string().uuid() }).safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid reward');

      res
        .status(201)
        .json({ redemption: await redeem.execute(membershipId, parsed.data.rewardId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
