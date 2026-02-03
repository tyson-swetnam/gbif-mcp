import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { config } from '../src/config/config.js';

// Mock server for API responses
export const server = setupServer();

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });

  // Override config for testing
  (config as any).gbif.baseUrl = 'http://localhost:3000';
  (config as any).features.enableCaching = false;
  (config as any).logging.level = 'error';
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});