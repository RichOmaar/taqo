import type {
  LedgerEntry,
  MembershipBalance,
  MembershipProgram,
  MembershipTier,
} from '@nexa/types';

import { earnedEver, earnedWithin, totals } from './ledger';

/**
 * Tier evaluation.
 *
 * Three things have to be explicit or this rots: which quantity counts, over
 * what period, and what happens when a member falls below their level. Leaving
 * any of them implicit is how loyalty schemes end up with members who cannot be
 * told why they were demoted.
 */

const DAY_MS = 86_400_000;

/** Tiers ordered from entry level upward. */
function ascending(tiers: MembershipTier[]): MembershipTier[] {
  return [...tiers].sort((a, b) => a.position - b.position);
}

/** The quantity a program measures tier progress in. */
export function tierProgressFor(
  program: MembershipProgram,
  entries: LedgerEntry[],
  now: Date,
): number {
  const earned =
    program.tierPeriod === 'rolling' && program.tierWindowDays
      ? earnedWithin(entries, new Date(now.getTime() - program.tierWindowDays * DAY_MS))
      : earnedEver(entries);

  return program.tierMetric === 'points' ? earned.points : earned.visits;
}

/** The highest tier whose threshold the progress meets. */
export function tierFor(program: MembershipProgram, progress: number): MembershipTier | null {
  const reached = ascending(program.tiers).filter((tier) => progress >= tier.threshold);
  return reached[reached.length - 1] ?? null;
}

/**
 * The tier a member holds, honouring the downgrade policy.
 *
 * Under `never`, a tier once earned is kept even if the rolling window moves
 * past the visits that earned it — so `heldPosition` is carried in rather than
 * recomputed, since the ledger alone cannot say what someone was awarded.
 */
export function effectiveTier(
  program: MembershipProgram,
  progress: number,
  heldPosition: number | null,
): MembershipTier | null {
  const earnedNow = tierFor(program, progress);

  if (program.downgradePolicy === 'on_period_exit' || heldPosition === null) return earnedNow;

  const held = ascending(program.tiers).find((tier) => tier.position === heldPosition) ?? null;
  if (!held) return earnedNow;
  if (!earnedNow) return held;

  return earnedNow.position >= held.position ? earnedNow : held;
}

/** The next tier up and how much more is needed, or null at the top. */
export function nextTier(
  program: MembershipProgram,
  progress: number,
): { name: string; remaining: number } | null {
  const upcoming = ascending(program.tiers).find((tier) => progress < tier.threshold);
  return upcoming ? { name: upcoming.name, remaining: upcoming.threshold - progress } : null;
}

/** The member's full standing: spendable balance plus tier and progress. */
export function balanceFor(
  program: MembershipProgram,
  entries: LedgerEntry[],
  now: Date,
  heldPosition: number | null = null,
): MembershipBalance {
  const spendable = totals(entries);
  const progress = tierProgressFor(program, entries, now);
  const tier = effectiveTier(program, progress, heldPosition);

  return {
    points: spendable.points,
    visits: spendable.visits,
    tierId: tier?.id ?? null,
    tierName: tier?.name ?? null,
    nextTier: nextTier(program, progress),
  };
}
