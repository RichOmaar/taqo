import type { WaitlistEntry } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import { makeEntry } from '../../../testing/fixtures';
import type { ReviewRepository } from '../domain/review-repository';
import type { WaitlistRepository } from '../domain/waitlist-repository';
import { SubmitReview } from './submit-review';

function setup(entry: WaitlistEntry | null, exists = false) {
  const waitlist = {
    findById: vi.fn().mockResolvedValue(entry),
  } as unknown as WaitlistRepository;
  const reviews = {
    existsForEntry: vi.fn().mockResolvedValue(exists),
    create: vi.fn(async (r) => ({ id: 'rev1', createdAt: '2026-01-01T00:00:00.000Z', ...r })),
  } as unknown as ReviewRepository;
  return { waitlist, reviews, submit: new SubmitReview(waitlist, reviews) };
}

describe('SubmitReview', () => {
  it('creates a review for a seated diner', async () => {
    const { reviews, submit } = setup(makeEntry({ status: 'seated' }));
    const review = await submit.execute({ entryId: 'e1', rating: 5, feedback: 'Bien' });
    expect(reviews.create).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 5, entryId: 'e1' }),
    );
    expect(review.id).toBe('rev1');
  });

  it('rejects a review before the diner is seated', async () => {
    const { submit } = setup(makeEntry({ status: 'waiting' }));
    await expect(submit.execute({ entryId: 'e1', rating: 5 })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('rejects a duplicate review', async () => {
    const { submit } = setup(makeEntry({ status: 'seated' }), true);
    await expect(submit.execute({ entryId: 'e1', rating: 5 })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('throws NotFound for a missing entry', async () => {
    const { submit } = setup(null);
    await expect(submit.execute({ entryId: 'e1', rating: 5 })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
