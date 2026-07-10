import { describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../../../shared/errors';
import { makeEntry } from '../../../testing/fixtures';
import type { WaitlistRepository } from '../domain/waitlist-repository';
import { GetEntry } from './get-entry';

describe('GetEntry', () => {
  it('returns the entry when found', async () => {
    const waitlist = {
      findById: vi.fn().mockResolvedValue(makeEntry()),
    } as unknown as WaitlistRepository;
    const entry = await new GetEntry(waitlist).execute('e1');
    expect(entry.id).toBe('e1');
  });

  it('throws NotFound when missing', async () => {
    const waitlist = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as WaitlistRepository;
    await expect(new GetEntry(waitlist).execute('e1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
