/**
 * Codes a hostess reads off a phone and types into a tablet.
 *
 * The alphabet omits characters that are read wrongly under pressure: O and 0,
 * I, L and 1, S and 5. Losing them costs a little entropy and saves the
 * argument at the counter about whether the code was mistyped.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRTUVWXYZ2346789';
const LENGTH = 6;

export type RandomSource = () => number;

/** Formatted as `NX-XXXXXX`, so it is recognisable out of context. */
export function generateRedemptionCode(random: RandomSource = Math.random): string {
  let code = '';
  for (let index = 0; index < LENGTH; index += 1) {
    code += ALPHABET.charAt(Math.floor(random() * ALPHABET.length));
  }
  return `NX-${code}`;
}

/** Accepts what a hostess typed, however they capitalised or spaced it. */
export function normalizeRedemptionCode(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[\s-]/g, '');
  const body = cleaned.startsWith('NX') ? cleaned.slice(2) : cleaned;
  return `NX-${body}`;
}
