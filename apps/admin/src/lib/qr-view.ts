/** Where the diner app lives, so the QR points at something real. */
export const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? 'http://localhost:3002';

/**
 * The link a diner lands on after scanning.
 *
 * Built with URL rather than string concatenation so a base with a path, a
 * trailing slash or an existing query still produces a valid link.
 */
export function joinUrl(code: string, base: string = CLIENT_URL): string {
  const url = new URL(base);
  url.searchParams.set('code', code.toUpperCase());
  return url.toString();
}

/** Filename for the printable QR. */
export function qrFilename(code: string): string {
  return `nexa-qr-${code.toLowerCase()}.svg`;
}
