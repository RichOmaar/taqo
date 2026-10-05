import type { RatingCount } from '@nexa/types';

export const RATINGS = [5, 4, 3, 2, 1] as const;

export interface DistributionBar {
  rating: number;
  count: number;
  /** 0–1 of the total, for the bar width. */
  share: number;
}

/**
 * The five bars of the ratings breakdown, highest first.
 *
 * Always five, even when a rating has no reviews: a missing bar reads as a
 * rating nobody could give rather than one nobody gave.
 */
export function distributionBars(distribution: RatingCount[], total: number): DistributionBar[] {
  return RATINGS.map((rating) => {
    const count = distribution.find((entry) => entry.rating === rating)?.count ?? 0;
    return { rating, count, share: total > 0 ? count / total : 0 };
  });
}

/** One decimal, or a dash when there is nothing to average. */
export function averageLabel(average: number | null): string {
  return average === null ? '—' : average.toFixed(1);
}

/**
 * Plural-aware count.
 *
 * Spanish agreement, so "1 reseña" never reads as "1 reseñas".
 */
export function reviewCountLabel(total: number): string {
  return total === 1 ? '1 reseña' : `${total} reseñas`;
}

/**
 * What share of reviews are 4★ or better.
 *
 * Null rather than 0 when there are no reviews: "0% satisfied" is a claim
 * about diners, and with no reviews we have not heard from any.
 */
export function satisfactionRate(distribution: RatingCount[], total: number): number | null {
  if (total === 0) return null;
  const happy = distribution
    .filter((entry) => entry.rating >= 4)
    .reduce((sum, entry) => sum + entry.count, 0);
  return happy / total;
}

/** Whole-percent label for a 0–1 share. */
export function percentLabel(share: number | null): string {
  return share === null ? '—' : `${Math.round(share * 100)}%`;
}
