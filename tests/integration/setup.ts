import { beforeAll, afterAll } from 'vitest';
import { config } from '../../src/config/config.js';
import { logger } from '../../src/utils/logger.js';

// Silence logs during tests
logger.silent = true;

// Setup for integration tests
beforeAll(() => {
  // Ensure we're using test configuration
  if (config.logging.level === 'debug') {
    console.warn('Warning: Running integration tests with debug logging enabled');
  }
});

afterAll(() => {
  // Cleanup if needed
});

/**
 * Helper to create mock large data for testing truncation
 */
export function createLargeDataset<T>(
  itemFactory: (index: number) => T,
  targetSizeKB: number
): T[] {
  const items: T[] = [];
  let currentSize = 0;
  let index = 0;

  while (currentSize < targetSizeKB * 1024) {
    const item = itemFactory(index++);
    items.push(item);
    currentSize += JSON.stringify(item).length;
  }

  return items;
}

/**
 * Helper to estimate size of data in KB
 */
export function estimateSize(data: any): number {
  const bytes = JSON.stringify(data).length;
  return Math.ceil(bytes / 1024);
}
