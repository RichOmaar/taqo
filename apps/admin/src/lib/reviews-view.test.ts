import { describe, expect, it } from 'vitest';

import {
  averageLabel,
  distributionBars,
  percentLabel,
  reviewCountLabel,
  satisfactionRate,
} from './reviews-view';

describe('distributionBars', () => {
  it('returns all five ratings, highest first', () => {
    expect(distributionBars([], 0).map((bar) => bar.rating)).toEqual([5, 4, 3, 2, 1]);
  });

  it('fills in a rating nobody gave with zero', () => {
    // A missing bar reads as a rating that cannot be given.
    const bars = distributionBars([{ rating: 5, count: 3 }], 3);

    expect(bars.find((bar) => bar.rating === 2)).toEqual({ rating: 2, count: 0, share: 0 });
  });

  it('computes each share of the total', () => {
    const bars = distributionBars(
      [
        { rating: 5, count: 3 },
        { rating: 4, count: 1 },
      ],
      4,
    );

    expect(bars[0]).toMatchObject({ rating: 5, count: 3, share: 0.75 });
    expect(bars[1]).toMatchObject({ rating: 4, count: 1, share: 0.25 });
  });

  it('does not divide by zero when there are no reviews', () => {
    expect(distributionBars([], 0).every((bar) => bar.share === 0)).toBe(true);
  });

  it('ignores a rating outside the scale', () => {
    // Defensive: a bar for 0★ or 6★ would break the layout silently.
    const bars = distributionBars([{ rating: 9, count: 5 }], 5);

    expect(bars).toHaveLength(5);
    expect(bars.every((bar) => bar.count === 0)).toBe(true);
  });
});

describe('averageLabel', () => {
  it('shows one decimal', () => {
    expect(averageLabel(4.25)).toBe('4.3');
  });

  it('keeps the decimal on a whole number, so the scale is obvious', () => {
    expect(averageLabel(4)).toBe('4.0');
  });

  it('shows a dash when there is nothing to average', () => {
    expect(averageLabel(null)).toBe('—');
  });
});

describe('reviewCountLabel', () => {
  it('agrees in the singular', () => {
    expect(reviewCountLabel(1)).toBe('1 reseña');
  });

  it('agrees in the plural', () => {
    expect(reviewCountLabel(2)).toBe('2 reseñas');
  });

  it('treats none as plural, as Spanish does', () => {
    expect(reviewCountLabel(0)).toBe('0 reseñas');
  });
});

describe('satisfactionRate', () => {
  it('counts four and five stars as happy', () => {
    const distribution = [
      { rating: 5, count: 2 },
      { rating: 4, count: 2 },
      { rating: 1, count: 4 },
    ];

    expect(satisfactionRate(distribution, 8)).toBe(0.5);
  });

  it('does not count three stars as happy', () => {
    expect(satisfactionRate([{ rating: 3, count: 4 }], 4)).toBe(0);
  });

  it('is null with no reviews, rather than zero', () => {
    // "0% satisfied" is a claim about diners we have not heard from.
    expect(satisfactionRate([], 0)).toBeNull();
  });
});

describe('percentLabel', () => {
  it('rounds to a whole percent', () => {
    expect(percentLabel(0.666)).toBe('67%');
  });

  it('shows a dash for an unknown share', () => {
    expect(percentLabel(null)).toBe('—');
  });
});
