import tablenowPreset from '@tablenow/ui/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [tablenowPreset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};
