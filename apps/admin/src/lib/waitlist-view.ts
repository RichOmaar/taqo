import type { WaitlistEntry, WaitlistHistoryEntry, WaitlistStatus } from '@nexa/types';
// One source for the wording: packages/ui owns it, everything else borrows.
import { WAITLIST_STATUS_LABELS as STATUS_LABELS } from '@nexa/ui';

export { STATUS_LABELS };

/** Statuses a diner can still be waiting under, for the live board. */
export const LIVE_STATUSES: WaitlistStatus[] = ['waiting', 'notified'];

export function isLive(entry: Pick<WaitlistEntry, 'status'>): boolean {
  return LIVE_STATUSES.includes(entry.status);
}

/** Live entries only, in queue order — the board the hostess sees. */
export function liveEntries(entries: WaitlistEntry[]): WaitlistEntry[] {
  return entries.filter(isLive).sort((a, b) => a.position - b.position);
}

export function waitLabel(minutes: number | null): string {
  return minutes === null ? '—' : `${minutes} min`;
}

export function partyLabel(size: number): string {
  return size === 1 ? '1 persona' : `${size} personas`;
}

const CSV_COLUMNS = [
  'Nombre',
  'Personas',
  'Cola',
  'Estado',
  'Se anotó',
  'Avisado',
  'Se sentó',
  'Espera (min)',
] as const;

/**
 * Quotes a CSV field.
 *
 * Every field is quoted rather than only the ones that need it: a name with a
 * comma, a quote or a newline in it would otherwise shift every later column
 * of that row, and diners type all three.
 *
 * The leading-character guard is against formula injection — a spreadsheet
 * treats a leading `=`, `+`, `-` or `@` as a formula, so a diner could name
 * themselves `=cmd|...` and have it execute when staff open the export.
 */
export function csvField(value: string | number | null): string {
  if (value === null) return '""';
  const text = String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/** ISO instant as a plain local-ish stamp, or blank. */
function stamp(iso: string | null): string {
  return iso ? iso.replace('T', ' ').slice(0, 19) : '';
}

/** The history as a CSV document, header included. */
export function toCsv(entries: WaitlistHistoryEntry[]): string {
  const header = CSV_COLUMNS.map(csvField).join(',');
  const rows = entries.map((entry) =>
    [
      csvField(entry.displayName),
      csvField(entry.partySize),
      csvField(entry.queueName),
      csvField(STATUS_LABELS[entry.status]),
      csvField(stamp(entry.joinedAt)),
      csvField(stamp(entry.notifiedAt)),
      csvField(stamp(entry.seatedAt)),
      csvField(entry.waitMinutes),
    ].join(','),
  );

  // Trailing newline: POSIX tools treat a file without one as truncated.
  return [header, ...rows].join('\n') + '\n';
}

/** Filename for the export, stamped so successive downloads do not collide. */
export function csvFilename(now: Date): string {
  return `lista-de-espera-${now.toISOString().slice(0, 10)}.csv`;
}
