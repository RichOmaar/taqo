import type { Redemption } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import { normalizeRedemptionCode } from '../domain/redemption-code';
import type { RedemptionRepository } from '../domain/repositories';

/**
 * Marks a code as used, at the counter.
 *
 * Deliberately unforgiving about reuse and lapse, and deliberately forgiving
 * about formatting: the hostess is typing what a diner is holding up on a
 * phone screen.
 */
export class ValidateRedemption {
  constructor(
    private readonly redemptions: RedemptionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(rawCode: string): Promise<Redemption> {
    const code = normalizeRedemptionCode(rawCode);
    const redemption = await this.redemptions.findByCode(code);
    if (!redemption) throw new NotFoundError('No encontramos ese código');

    if (redemption.status === 'redeemed') {
      throw new ValidationError('Ese código ya se usó', {
        redeemedAt: redemption.redeemedAt,
      });
    }
    if (redemption.status === 'cancelled') {
      throw new ValidationError('Ese código fue cancelado');
    }

    const at = this.now();
    if (redemption.expiresAt && Date.parse(redemption.expiresAt) <= at.getTime()) {
      throw new ValidationError('Ese código ya venció', { expiresAt: redemption.expiresAt });
    }

    return this.redemptions.markRedeemed(redemption.id, at);
  }
}
