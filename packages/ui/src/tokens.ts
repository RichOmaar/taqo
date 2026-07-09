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

export type ColorToken = keyof typeof colors;
