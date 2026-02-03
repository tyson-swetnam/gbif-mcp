import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { config } from '../../../src/config/config.js';

describe('GBIFClient', () => {
  let client: GBIFClient;

  beforeEach(() => {
    client = new GBIFClient();
    // Reset circuit breaker state between tests
    client.resetCircuitBreaker();
    client.clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Circuit Breaker', () => {
    it('should be CLOSED initially', () => {
      expect(client.getCircuitState()).toBe('CLOSED');
    });

    it('should transition to OPEN after 5 consecutive failures', async () => {
      // Mock 5 consecutive failures
      server.use(
        http.get('http://localhost:3000/test', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      // Trigger 5 failures
      for (let i = 0; i < 5; i++) {
        try {
          await client.get('/test');
        } catch (error) {
          // Expected to fail
        }
      }

      expect(client.getCircuitState()).toBe('OPEN');
    }, 60000);

    it('should reject requests when circuit is OPEN', async () => {
      // Force circuit to OPEN
      server.use(
        http.get('http://localhost:3000/test', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      for (let i = 0; i < 5; i++) {
        try {
          await client.get('/test');
        } catch (error) {
          // Expected
        }
      }

      expect(client.getCircuitState()).toBe('OPEN');

      // Next request should be rejected immediately
      await expect(client.get('/test')).rejects.toThrow('Circuit breaker is OPEN');
    }, 60000);

    it('should reset circuit breaker', () => {
      client.resetCircuitBreaker();
      expect(client.getCircuitState()).toBe('CLOSED');
    });
  });

  describe('LRU Cache', () => {
    beforeEach(() => {
      // Enable caching for these tests
      (config as any).features.enableCaching = true;
    });

    it('should cache successful GET requests', async () => {
      let callCount = 0;
      server.use(
        http.get('http://localhost:3000/species/search', () => {
          callCount++;
          return HttpResponse.json({ results: [], count: 0 });
        })
      );

      // First request - cache miss
      await client.get('/species/search', { q: 'test' });
      expect(callCount).toBe(1);

      // Second request - cache hit
      await client.get('/species/search', { q: 'test' });
      expect(callCount).toBe(1); // Still 1, not called again

      // Different params - cache miss
      await client.get('/species/search', { q: 'different' });
      expect(callCount).toBe(2);
    });

    it('should return cached data on cache hit', async () => {
      const mockData = { results: [{ key: 1, name: 'Test' }], count: 1 };
      server.use(
        http.get('http://localhost:3000/species/123', () => {
          return HttpResponse.json(mockData);
        })
      );

      const result1 = await client.get('/species/123');
      expect(result1).toEqual(mockData);

      // Change mock response
      server.use(
        http.get('http://localhost:3000/species/123', () => {
          return HttpResponse.json({ results: [], count: 0 });
        })
      );

      // Should still return cached data
      const result2 = await client.get('/species/123');
      expect(result2).toEqual(mockData);
    });

    it('should not cache when caching is disabled', async () => {
      (config as any).features.enableCaching = false;
      let callCount = 0;

      server.use(
        http.get('http://localhost:3000/test', () => {
          callCount++;
          return HttpResponse.json({ data: 'test' });
        })
      );

      await client.get('/test');
      await client.get('/test');

      expect(callCount).toBe(2); // Called twice, not cached
    });

    it('should clear cache', async () => {
      server.use(
        http.get('http://localhost:3000/test', () => {
          return HttpResponse.json({ data: 'test' });
        })
      );

      await client.get('/test');
      client.clearCache();

      // After clearing, should make new request
      let callCount = 0;
      server.use(
        http.get('http://localhost:3000/test', () => {
          callCount++;
          return HttpResponse.json({ data: 'test' });
        })
      );

      await client.get('/test');
      expect(callCount).toBe(1);
    });

    it('should provide cache statistics', () => {
      const stats = client.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('itemCount');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
    });
  });

  describe('Request Queue & Concurrency', () => {
    it('should queue requests and respect concurrency limits', async () => {
      let activeRequests = 0;
      let maxConcurrent = 0;

      server.use(
        http.get('http://localhost:3000/concurrent', async () => {
          activeRequests++;
          maxConcurrent = Math.max(maxConcurrent, activeRequests);

          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 50));

          activeRequests--;
          return HttpResponse.json({ success: true });
        })
      );

      // Make 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        client.get('/concurrent')
      );

      await Promise.all(promises);

      // Max concurrent should not exceed configured limit
      expect(maxConcurrent).toBeLessThanOrEqual(config.rateLimit.maxConcurrentRequests);
    });
  });

  describe('Exponential Backoff & Retry', () => {
    it('should retry 5xx errors with exponential backoff', async () => {
      let attemptCount = 0;

      server.use(
        http.get('http://localhost:3000/retry-test', () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.json({ error: 'Server error' }, { status: 500 });
          }
          return HttpResponse.json({ success: true });
        })
      );

      const result = await client.get('/retry-test');
      expect(result).toEqual({ success: true });
      expect(attemptCount).toBe(3); // Initial + 2 retries
    });

    it('should handle 429 rate limit with retry-after', async () => {
      let attemptCount = 0;

      server.use(
        http.get('http://localhost:3000/rate-limit-test', () => {
          attemptCount++;
          if (attemptCount === 1) {
            return HttpResponse.json(
              { error: 'Rate limited' },
              { status: 429, headers: { 'Retry-After': '1' } }
            );
          }
          return HttpResponse.json({ success: true });
        })
      );

      const result = await client.get('/rate-limit-test');
      expect(result).toEqual({ success: true });
      expect(attemptCount).toBe(2); // Initial + 1 retry
    });

    it('should give up after max retry attempts', async () => {
      server.use(
        http.get('http://localhost:3000/always-fail', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      await expect(client.get('/always-fail')).rejects.toThrow();
    }, 15000);
  });

  describe('HTTP Methods', () => {
    it('should make GET requests', async () => {
      server.use(
        http.get('http://localhost:3000/test', () => {
          return HttpResponse.json({ method: 'GET' });
        })
      );

      const result = await client.get('/test');
      expect(result).toEqual({ method: 'GET' });
    });

    it('should make POST requests', async () => {
      server.use(
        http.post('http://localhost:3000/test', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ method: 'POST', body });
        })
      );

      const result = await client.post('/test', { data: 'test' });
      expect(result).toHaveProperty('method', 'POST');
    });

    it('should make DELETE requests', async () => {
      server.use(
        http.delete('http://localhost:3000/test', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(client.delete('/test')).resolves.toBeUndefined();
    });
  });

  describe('Pagination', () => {
    it('should paginate through results', async () => {
      server.use(
        http.get('http://localhost:3000/paginated', ({ request }) => {
          const url = new URL(request.url);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);

          if (offset === 0) {
            return HttpResponse.json({
              results: [{ id: 1 }, { id: 2 }],
              offset: 0,
              limit: 2,
              endOfRecords: false
            });
          } else {
            return HttpResponse.json({
              results: [{ id: 3 }],
              offset: 2,
              limit: 2,
              endOfRecords: true
            });
          }
        })
      );

      const pages: any[] = [];
      for await (const page of client.paginate('/paginated', {}, 2)) {
        pages.push(page);
      }

      expect(pages).toHaveLength(2);
      expect(pages[0]).toEqual([{ id: 1 }, { id: 2 }]);
      expect(pages[1]).toEqual([{ id: 3 }]);
    });

    it('should stop pagination when no results', async () => {
      server.use(
        http.get('http://localhost:3000/empty-paginated', () => {
          return HttpResponse.json({
            results: [],
            offset: 0,
            limit: 20,
            endOfRecords: true
          });
        })
      );

      const pages: any[] = [];
      for await (const page of client.paginate('/empty-paginated')) {
        pages.push(page);
      }

      expect(pages).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should transform GBIF errors', async () => {
      server.use(
        http.get('http://localhost:3000/error', () => {
          return HttpResponse.json({ message: 'Bad request' }, { status: 400 });
        })
      );

      await expect(client.get('/error')).rejects.toMatchObject({
        message: 'Bad request',
        statusCode: 400
      });
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('http://localhost:3000/network-error', () => {
          return HttpResponse.error();
        })
      );

      await expect(client.get('/network-error')).rejects.toThrow();
    });
  });

  describe('Download', () => {
    it('should download files as buffer', async () => {
      // Note: This is simplified for testing
      server.use(
        http.get('http://example.com/file.zip', () => {
          return HttpResponse.arrayBuffer(new ArrayBuffer(100));
        })
      );

      const buffer = await client.download('http://example.com/file.zip');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should include authentication when credentials are provided', async () => {
      const originalUsername = config.gbif.username;
      const originalPassword = config.gbif.password;

      (config as any).gbif.username = 'testuser';
      (config as any).gbif.password = 'testpass';

      let authHeader = '';
      server.use(
        http.get('http://localhost:3000/auth-test', ({ request }) => {
          authHeader = request.headers.get('authorization') || '';
          return HttpResponse.json({ authenticated: true });
        })
      );

      const newClient = new GBIFClient();
      await newClient.get('/auth-test');

      expect(authHeader).toContain('Basic');

      // Restore original values
      (config as any).gbif.username = originalUsername;
      (config as any).gbif.password = originalPassword;
    });
  });
});
