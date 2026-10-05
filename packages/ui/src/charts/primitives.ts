/** Shapes and helpers shared by the chart components. */

/**
 * Path for a column with a rounded cap and a square base.
 *
 * `rx` on a `<rect>` would round all four corners, detaching the mark from its
 * baseline; a column should look anchored to the axis and rounded only where
 * the data ends.
 */
export function columnPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 4,
): string {
  if (height <= 0) return '';
  const r = Math.min(radius, width / 2, height);
  const right = x + width;
  const bottom = y + height;

  return [
    `M${x},${bottom}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${right - r},${y}`,
    `Q${right},${y} ${right},${y + r}`,
    `L${right},${bottom}`,
    'Z',
  ].join(' ');
}

/**
 * Which ramp step a value belongs to.
 *
 * Zero returns -1, meaning "draw nothing": no traffic is a different state from
 * a little traffic, and giving it the palest step would imply activity. Any
 * non-zero value gets at least the first step, so a single cover is visible.
 */
export function rampIndex(value: number, highest: number, steps: number): number {
  if (value <= 0 || highest <= 0 || steps <= 0) return -1;
  const position = Math.ceil((value / highest) * steps);
  return Math.min(steps - 1, Math.max(0, position - 1));
}

/**
 * Every `stride`-th index, so dense axes do not collide.
 *
 * Always keeps the first tick; the caller decides the stride from the space it
 * actually has.
 */
export function tickIndices(count: number, stride: number): number[] {
  const step = Math.max(1, Math.floor(stride));
  return Array.from({ length: count }, (_, index) => index).filter((index) => index % step === 0);
}

/**
 * Axis values from 0 to at or above `highest`, on a 1/2/5/10 step.
 *
 * The top tick must cover the data: the plot is scaled to it, so a top below the
 * largest value draws that bar past the top of the chart.
 */
export function niceTicks(highest: number, desired = 4): number[] {
  if (highest <= 0) return [0];

  const raw = highest / desired;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const rounded = [1, 2, 5, 10].find((candidate) => normalized <= candidate) ?? 10;
  const step = Math.max(1, Math.round(rounded * magnitude));

  const count = Math.ceil(highest / step);
  return Array.from({ length: count + 1 }, (_, index) => index * step);
}
