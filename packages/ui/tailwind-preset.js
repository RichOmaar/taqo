import forms from '@tailwindcss/forms';

/**
 * Shared Tailwind preset for Nexa. Mirrors the tokens in src/tokens.ts.
 *
 * Apps: add this to `presets` and include @nexa/ui source in `content`, e.g.
 *   presets: [nexaPreset],
 *   content: ['./src/**\/*.{ts,tsx}', '../../packages/ui/src/**\/*.{ts,tsx}']
 *
 * @type {import('tailwindcss').Config}
 */
const preset = {
  content: [],
  theme: {
    extend: {
      colors: {
        background: '#FBF7F2',
        surface: '#FFFFFF',
        primary: { DEFAULT: '#F2755C', dark: '#A43C27', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#4FB0A5', dark: '#006A62', foreground: '#FFFFFF' },
        foreground: '#2E2A28',
        muted: '#8C837E',
        border: '#E1D8D5',
        error: '#BA1A1A',
      },
      fontFamily: {
        display: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1.5rem',
        '2xl': '1.75rem',
      },
      boxShadow: {
        soft: '0px 10px 30px rgba(46, 42, 40, 0.04)',
      },
    },
  },
  plugins: [forms],
};

export default preset;
