import type { LedgerEntry, LedgerKind } from '@nexa/types';

/**
 * The ledger.
 *
 * Every movement is an immutable entry and the balance is their sum. Storing a
 * mutable total instead would be smaller and faster and would cost the one
 * thing a loyalty scheme cannot do without: the ability to explain how a member
 * arrived at their balance, and to correct it without rewriting history.
 *
 * These are pure functions over entries — no repository, no clock — because
 * they are the rules that must never be wrong.
 */

/** A movement about to be recorded; the store assigns id and timestamps. */
export interface NewLedgerEntry {
  membershipId: string;
  kind: LedgerKind;
  points: number;
  visits: number;
  sourceRef: string;
  note?: string | null;
  occurredAt: Date;
}

export interface LedgerTotals {
  points: number;
  visits: number;
}

/** Sums a member's movements. Points may not fall below zero. */
export function totals(entries: LedgerEntry[]): LedgerTotals {
  const summed = entries.reduce(
    (running, entry) => ({
      points: running.points + entry.points,
      visits: running.visits + entry.visits,
    }),
    { points: 0, visits: 0 },
  );

  // A negative balance would mean more was spent than earned, which the
  // redemption rules prevent; clamp rather than surface an impossible figure.
  return { points: Math.max(0, summed.points), visits: Math.max(0, summed.visits) };
}

/**
 * Totals from entries inside a window, for a rolling tier period.
 *
 * Redemptions are excluded: spending points must not cost a member their tier.
 * Tier standing reflects what they earned, not what they still hold.
 */
export function earnedWithin(entries: LedgerEntry[], since: Date): LedgerTotals {
  const cutoff = since.getTime();
  return totals(
    entries.filter((entry) => entry.kind === 'accrual' && Date.parse(entry.occurredAt) >= cutoff),
  );
}

/** Lifetime earnings, ignoring what has been spent. */
export function earnedEver(entries: LedgerEntry[]): LedgerTotals {
  return totals(entries.filter((entry) => entry.kind === 'accrual'));
}

/**
 * Whether this cause has already been recorded.
 *
 * The guard against double-crediting: a seating re-delivered, a retried
 * request, or a replayed event must all resolve to the same single accrual.
 */
export function alreadyRecorded(entries: LedgerEntry[], sourceRef: string): boolean {
  return entries.some((entry) => entry.sourceRef === sourceRef);
}

/**
 * How many points a member may still spend.
 *
 * Distinct from tier progress: spending lowers this and leaves standing alone.
 */
export function spendablePoints(entries: LedgerEntry[]): number {
  return totals(entries).points;
}
