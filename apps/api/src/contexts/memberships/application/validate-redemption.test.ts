import type { Redemption, RedemptionStatus } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import { generateRedemptionCode, normalizeRedemptionCode } from '../domain/redemption-code';
import type { RedemptionRepository } from '../domain/repositories';
import { ValidateRedemption } from './validate-redemption';

const NOW = new Date('2026-07-21T20:00:00Z');

function redemption(overrides: Partial<Redemption> = {}): Redemption {
  return {
    id: 'red1',
    rewardId: 'rw1',
    membershipId: 'm1',
    code: 'NX-ABC234',
    status: 'issued',
    issuedAt: '2026-07-01T12:00:00.000Z',
    redeemedAt: null,
    expiresAt: '2026-08-01T12:00:00.000Z',
    ...overrides,
  };
}

function build(found: Redemption | null) {
  const findByCode = vi.fn<RedemptionRepository['findByCode']>().mockResolvedValue(found);
  const markRedeemed = vi
    .fn<RedemptionRepository['markRedeemed']>()
    .mockResolvedValue(redemption({ status: 'redeemed', redeemedAt: NOW.toISOString() }));

  return {
    findByCode,
    markRedeemed,
    useCase: new ValidateRedemption(
      { findByCode, markRedeemed } as unknown as RedemptionRepository,
      () => NOW,
    ),
  };
}

describe('generateRedemptionCode', () => {
  it('omits characters that are misread at a counter', () => {
    // No O/0, I/L/1, S/5 — the argument about a mistyped code is not worth
    // the entropy they would add.
    const codes = Array.from({ length: 50 }, () => generateRedemptionCode());

    expect(codes.every((code) => !/[OIL01S5]/.test(code.slice(3)))).toBe(true);
  });

  it('is recognisable out of context', () => {
    expect(generateRedemptionCode()).toMatch(/^NX-[A-Z2-9]{6}$/);
  });
});

describe('normalizeRedemptionCode', () => {
  it.each([
    ['nx-abc234', 'NX-ABC234'],
    ['NX ABC 234', 'NX-ABC234'],
    ['abc234', 'NX-ABC234'],
    ['  NX-ABC234  ', 'NX-ABC234'],
  ])('accepts %s as typed', (input, expected) => {
    // The hostess is copying what a diner is holding up on a phone.
    expect(normalizeRedemptionCode(input)).toBe(expected);
  });
});

describe('ValidateRedemption', () => {
  it('marks a valid code as used', async () => {
    const { markRedeemed, useCase } = build(redemption());

    const result = await useCase.execute('NX-ABC234');

    expect(markRedeemed).toHaveBeenCalledWith('red1', NOW);
    expect(result.status).toBe('redeemed');
  });

  it('accepts a loosely typed code', async () => {
    const { findByCode, useCase } = build(redemption());

    await useCase.execute('nx abc234');

    expect(findByCode).toHaveBeenCalledWith('NX-ABC234');
  });

  it('rejects a code it never issued', async () => {
    const { useCase } = build(null);

    await expect(useCase.execute('NX-ZZZZZZ')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a code already used, so one reward is not given twice', async () => {
    const used = redemption({ status: 'redeemed', redeemedAt: '2026-07-20T12:00:00.000Z' });
    const { markRedeemed, useCase } = build(used);

    await expect(useCase.execute('NX-ABC234')).rejects.toBeInstanceOf(ValidationError);
    expect(markRedeemed).not.toHaveBeenCalled();
  });

  it('rejects a lapsed code', async () => {
    const stale = redemption({ expiresAt: '2026-07-01T12:00:00.000Z' });
    const { useCase } = build(stale);

    await expect(useCase.execute('NX-ABC234')).rejects.toBeInstanceOf(ValidationError);
  });

  it('accepts a code with no expiry at all', async () => {
    const { useCase } = build(redemption({ expiresAt: null }));

    await expect(useCase.execute('NX-ABC234')).resolves.toMatchObject({ status: 'redeemed' });
  });

  it.each<RedemptionStatus>(['cancelled'])('rejects a %s code', async (status) => {
    const { useCase } = build(redemption({ status }));

    await expect(useCase.execute('NX-ABC234')).rejects.toBeInstanceOf(ValidationError);
  });
});
