import nexaPreset from '@nexa/ui/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [nexaPreset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};
