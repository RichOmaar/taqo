// Extends Vitest's expect with jest-dom matchers (both at runtime and for tsc),
// and unmounts rendered components between tests.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
