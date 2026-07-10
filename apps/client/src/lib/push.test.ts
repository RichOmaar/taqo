import { describe, expect, it } from 'vitest';

import { urlBase64ToUint8Array } from './push';

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string to bytes', () => {
    // "hello" -> base64url "aGVsbG8"
    const bytes = urlBase64ToUint8Array('aGVsbG8');
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
  });

  it('handles keys needing padding', () => {
    // "hi" -> base64url "aGk"
    expect(Array.from(urlBase64ToUint8Array('aGk'))).toEqual([104, 105]);
  });
});
