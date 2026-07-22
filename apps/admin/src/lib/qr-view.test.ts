import { describe, expect, it } from 'vitest';

import { joinUrl, qrFilename } from './qr-view';

describe('joinUrl', () => {
  it('points at the diner app with the restaurant code', () => {
    expect(joinUrl('DEMO', 'https://app.nexa.mx')).toBe('https://app.nexa.mx/?code=DEMO');
  });

  it('upper-cases the code, which is how the diner app reads it', () => {
    expect(joinUrl('demo', 'https://app.nexa.mx')).toContain('code=DEMO');
  });

  it('survives a base with a trailing slash', () => {
    expect(joinUrl('DEMO', 'https://app.nexa.mx/')).toBe('https://app.nexa.mx/?code=DEMO');
  });

  it('survives a base with a path', () => {
    expect(joinUrl('DEMO', 'https://nexa.mx/app')).toBe('https://nexa.mx/app?code=DEMO');
  });

  it('replaces an existing code rather than appending a second one', () => {
    // Two `code` params and the diner app reads whichever comes first.
    expect(joinUrl('DEMO', 'https://app.nexa.mx/?code=OTRO')).toBe(
      'https://app.nexa.mx/?code=DEMO',
    );
  });

  it('keeps other query parameters', () => {
    expect(joinUrl('DEMO', 'https://app.nexa.mx/?utm=qr')).toContain('utm=qr');
  });

  it('encodes a code that would otherwise break the query', () => {
    expect(joinUrl('A&B', 'https://app.nexa.mx')).toContain('code=A%26B');
  });
});

describe('qrFilename', () => {
  it('names the file after the restaurant', () => {
    expect(qrFilename('DEMO')).toBe('nexa-qr-demo.svg');
  });
});
