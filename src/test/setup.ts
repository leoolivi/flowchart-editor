import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup dopo ogni test
afterEach(() => {
  cleanup();
});