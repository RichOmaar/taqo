import type { Membership } from '@nexa/types';

import { ForbiddenError, NotFoundError } from '../../../shared/errors';
import type { MembershipRepository, ProgramRepository } from '../domain/repositories';

/**
 * Enrols a diner in a restaurant's programme.
 *
 * Idempotent: joining twice returns the existing membership rather than
 * failing, since a diner tapping the button again means "I want to be a
 * member", not "create me a second account".
 */
export class EnrollMember {
  constructor(
    private readonly programs: ProgramRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(ownerRef: string, userId: string): Promise<Membership> {
    const program = await this.programs.findByOwner(ownerRef);
    if (!program) throw new NotFoundError('This restaurant has no membership programme');

    // A draft programme is the owner still designing it; a paused one has been
    // deliberately closed to new members.
    if (program.status !== 'active') {
      throw new ForbiddenError('This membership programme is not open right now');
    }

    const existing = await this.memberships.findByProgramAndUser(program.id, userId);
    if (existing) return existing;

    return this.memberships.create(program.id, userId);
  }
}
