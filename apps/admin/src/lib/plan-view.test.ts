import { describe, expect, it } from 'vitest';

import { PLANS, actionLabel, isCurrent, periodLabel } from './plan-view';

const free = PLANS[0]!;
const pro = PLANS[1]!;

describe('PLANS', () => {
  it('offers exactly the two plans the product has', () => {
    expect(PLANS.map((card) => card.plan)).toEqual(['free', 'paid']);
  });

  it('recommends the paid one, as the mock does', () => {
    expect(pro.recommended).toBe(true);
    expect(free.recommended).toBeUndefined();
  });

  it('lists what each plan includes', () => {
    expect(free.features.length).toBeGreaterThan(0);
    expect(pro.features).toContain('Notificaciones SMS y WhatsApp');
  });
});

describe('isCurrent', () => {
  it('marks the plan the restaurant is on', () => {
    expect(isCurrent(free, 'free')).toBe(true);
  });

  it('does not mark the other one', () => {
    expect(isCurrent(pro, 'free')).toBe(false);
  });

  it('marks nothing while the plan is unknown', () => {
    // Before the session resolves, claiming either would be a guess.
    expect(isCurrent(free, undefined)).toBe(false);
    expect(isCurrent(pro, undefined)).toBe(false);
  });
});

describe('actionLabel', () => {
  it('says the current plan is current', () => {
    expect(actionLabel(free, 'free')).toBe('Tu plan actual');
  });

  it('offers the upgrade from free', () => {
    expect(actionLabel(pro, 'free')).toBe('Mejorar a Pro');
  });

  it('offers the downgrade from paid', () => {
    expect(actionLabel(free, 'paid')).toBe('Cambiar a Gratis');
  });

  it('does not call the paid plan an upgrade when it is already current', () => {
    expect(actionLabel(pro, 'paid')).toBe('Tu plan actual');
  });
});

describe('periodLabel', () => {
  it('names the month and year in Spanish', () => {
    expect(periodLabel(new Date('2026-07-15T12:00:00Z'))).toBe('Julio de 2026');
  });

  it('capitalises the month, which es-MX lower-cases', () => {
    expect(periodLabel(new Date('2026-01-15T12:00:00Z')).charAt(0)).toBe('E');
  });

  it('reads the month in the restaurant zone, not the browser one', () => {
    // 01:00 UTC on the 1st is still the previous month in Mexico City.
    const justAfterUtcMidnight = new Date('2026-08-01T01:00:00Z');

    expect(periodLabel(justAfterUtcMidnight, 'America/Mexico_City')).toContain('Julio');
  });
});
