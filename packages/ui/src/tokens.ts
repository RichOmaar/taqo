// Nexa design tokens, transcribed from the design system
// (Documentation/Mocks/nexa_design_system/DESIGN.md) and the shared Stitch
// style block. Curated, semantic palette. Kept in sync with tailwind-preset.js.

export const colors = {
  /** Warm off-white app background. */
  background: '#FBF7F2',
  /** Card / elevated surface. */
  surface: '#FFFFFF',
  /** Coral / terracotta — primary CTA. */
  primary: '#F2755C',
  primaryDark: '#A43C27',
  onPrimary: '#FFFFFF',
  /** Soft teal — success and secondary accents. */
  secondary: '#4FB0A5',
  secondaryDark: '#006A62',
  onSecondary: '#FFFFFF',
  /** Warm charcoal — high-contrast text. */
  foreground: '#2E2A28',
  /** Warm gray — secondary text. */
  muted: '#8C837E',
  border: '#E1D8D5',
  error: '#BA1A1A',
} as const;

export const fontFamily = {
  display: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  body: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
} as const;

export const borderRadius = {
  sm: '0.25rem',
  DEFAULT: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
} as const;

export const boxShadow = {
  /** Ambient "lift" used on cards and pressable surfaces. */
  soft: '0px 10px 30px rgba(46, 42, 40, 0.04)',
} as const;

/**
 * Chart palette.
 *
 * Deliberately not `colors.primary` / `colors.secondary`. Those are tuned for
 * large areas and pill buttons; as chart marks they fail two objective checks —
 * the brand teal sits below the OKLCH chroma floor (0.093 < 0.10), where a hue
 * stops carrying identity and reads as gray, and both fall under 3:1 against a
 * white surface. These are the nearest steps that pass, so a chart stays legible
 * while still reading as Nexa.
 *
 * Verified for lightness band, chroma floor, contrast, and separation under
 * protanopia and deuteranopia. Re-validate before changing any value.
 */
export const chart = {
  /**
   * Categorical series, in fixed order. Assign by position and never cycle:
   * colour follows the series, so filtering one out must not repaint the rest.
   */
  series: ['#E8674C', '#2E9E90'],
  /**
   * Sequential ramp for magnitude, light → dark, single hue.
   *
   * Starts at the first non-zero level: an empty cell is a different state from
   * a quiet one and is drawn as bare surface, not as the palest step.
   */
  sequential: ['#F4A18A', '#E9744F', '#C74A2E', '#93351F'],
  /** Recessive chrome — gridlines and axis rules sit one step off the surface. */
  grid: '#E9E1DD',
} as const;

export type ColorToken = keyof typeof colors;
