import { describe, expect, it } from 'vitest';

import { formatPercent, formatRating, formatWaitMinutes } from './format';

describe('dashboard formatters', () => {
  it('formats a ratio as a rounded percent', () => {
    expect(formatPercent(0.6666)).toBe('67%');
    expect(formatPercent(0)).toBe('0%');
  });

  it('formats wait minutes with a fallback', () => {
    expect(formatWaitMinutes(18)).toBe('18 min');
    expect(formatWaitMinutes(null)).toBe('—');
  });

  it('formats rating with a fallback', () => {
    expect(formatRating(4.5)).toBe('4.5 ⭐');
    expect(formatRating(null)).toBe('—');
  });
});
