/**
 * Day boundaries in a restaurant's own timezone.
 *
 * "Hoy" is a local notion: a restaurant in Mexico City rolls over five or six
 * hours after the server does if the server runs in UTC, so bucketing on the
 * process timezone silently misattributes an evening service.
 */

/** Half-open interval [from, to): `to` is excluded, so days tile without overlap. */
export interface TimeRange {
  from: Date;
  to: Date;
}

/**
 * Offset of `timeZone` from UTC at a given instant, in milliseconds.
 *
 * Derived by formatting the instant in the zone and reading the result back as
 * if it were UTC. Doing it per instant rather than per zone is what keeps this
 * correct across a DST transition, where the offset differs within one day.
 */
function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const at = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  // `hour` comes back as 24 at midnight under hour12:false; 24 is out of range
  // for Date.UTC's hour slot in the sense we want, so normalize it to 0.
  const hour = at('hour') % 24;

  const asUtc = Date.UTC(at('year'), at('month') - 1, at('day'), hour, at('minute'), at('second'));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The instant at which the local day containing `instant` began. */
export function startOfLocalDay(instant: Date, timeZone: string): Date {
  const offset = offsetMs(instant, timeZone);
  const local = new Date(instant.getTime() + offset);

  const localMidnight = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
    0,
    0,
    0,
  );

  // Convert back with the offset in effect at that midnight, not at `instant`:
  // on a DST changeover day the two differ by an hour.
  const approximate = new Date(localMidnight - offset);
  return new Date(localMidnight - offsetMs(approximate, timeZone));
}

/** Adds whole days to an instant. */
export function addDays(instant: Date, days: number): Date {
  return new Date(instant.getTime() + days * 86_400_000);
}

/** The local day containing `instant`, as a half-open range. */
export function localDayRange(instant: Date, timeZone: string): TimeRange {
  const from = startOfLocalDay(instant, timeZone);
  const to = startOfLocalDay(addDays(from, 1), timeZone);
  return { from, to };
}

/**
 * The equally long window ending where `range` begins, for period-over-period
 * comparison: yesterday for a day, the prior week for a week.
 */
export function previousRange(range: TimeRange): TimeRange {
  const span = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - span), to: range.from };
}
