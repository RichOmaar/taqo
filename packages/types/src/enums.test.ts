import { describe, expect, it } from 'vitest';

import { STAFF_ROLES, WAITLIST_STATUSES } from './enums';

describe('domain enums', () => {
  it('lists every waitlist status', () => {
    expect([...WAITLIST_STATUSES]).toEqual([
      'waiting',
      'notified',
      'seated',
      'no_show',
      'cancelled',
    ]);
  });

  it('lists the staff roles', () => {
    expect([...STAFF_ROLES]).toEqual(['admin', 'hostess']);
  });
});
