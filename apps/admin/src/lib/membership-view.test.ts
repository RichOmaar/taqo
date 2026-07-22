import type { TierInput } from '@nexa/api-client';
import { describe, expect, it } from 'vitest';

import { metricUnit, repositioned, tierSchemeProblem } from './membership-view';

const TIERS: TierInput[] = [
  { name: 'Bronce', threshold: 0, benefits: [], position: 0 },
  { name: 'Plata', threshold: 5, benefits: [], position: 1 },
  { name: 'Oro', threshold: 15, benefits: [], position: 2 },
];

describe('tierSchemeProblem', () => {
  it('accepts a scheme that rises', () => {
    expect(tierSchemeProblem(TIERS)).toBeNull();
  });

  it('accepts an empty scheme, which simply cannot be published', () => {
    expect(tierSchemeProblem([])).toBeNull();
  });

  it('names both levels when a threshold does not rise', () => {
    // The owner needs to know which pair to fix, not just that one is wrong.
    const broken = [TIERS[0]!, { ...TIERS[1]!, threshold: 20 }, { ...TIERS[2]!, threshold: 10 }];

    expect(tierSchemeProblem(broken)).toContain('"Oro"');
    expect(tierSchemeProblem(broken)).toContain('"Plata"');
  });

  it('rejects equal thresholds, which are not a step up', () => {
    const flat = [TIERS[0]!, { ...TIERS[1]!, threshold: 0 }];

    expect(tierSchemeProblem(flat)).not.toBeNull();
  });

  it('rejects a level with no name', () => {
    const unnamed = [{ ...TIERS[0]!, name: '   ' }];

    expect(tierSchemeProblem(unnamed)).toBe('Cada nivel necesita un nombre.');
  });

  it('reads positions rather than array order', () => {
    const shuffled = [TIERS[2]!, TIERS[0]!, TIERS[1]!];

    expect(tierSchemeProblem(shuffled)).toBeNull();
  });
});

describe('repositioned', () => {
  it('renumbers from zero after a removal', () => {
    const remaining = [TIERS[0]!, TIERS[2]!];

    expect(repositioned(remaining).map((tier) => tier.position)).toEqual([0, 1]);
  });

  it('leaves everything else untouched', () => {
    expect(repositioned(TIERS)[1]).toMatchObject({ name: 'Plata', threshold: 5 });
  });
});

describe('metricUnit', () => {
  it('labels the threshold in the unit being counted', () => {
    expect(metricUnit('visits')).toBe('visitas');
    expect(metricUnit('points')).toBe('puntos');
  });
});
