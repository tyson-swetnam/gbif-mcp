import { describe, it, expect } from 'vitest';
import { ResponseTruncator } from '../../../src/utils/response-truncator.js';
import type { GBIFResponse } from '../../../src/types/gbif.types.js';

describe('ResponseTruncator', () => {
  const truncator = new ResponseTruncator(250 * 1024); // 250KB

  describe('calculateSize', () => {
    it('should calculate size in bytes', () => {
      const data = { test: 'data', number: 123 };
      const size = truncator.calculateSize(data);
      expect(size).toBeGreaterThan(0);
      expect(size).toBe(JSON.stringify(data).length);
    });
  });

  describe('needsTruncation', () => {
    it('should return false for small data', () => {
      const smallData = { results: [{ id: 1 }], count: 1 };
      expect(truncator.needsTruncation(smallData)).toBe(false);
    });

    it('should return true for large data', () => {
      // Create data > 250KB
      const largeData = {
        results: Array(5000).fill({
          id: 1,
          scientificName: 'Very long name'.repeat(100)
        }),
        count: 5000
      };
      expect(truncator.needsTruncation(largeData)).toBe(true);
    });
  });

  describe('truncatePaginatedResponse', () => {
    it('should keep metadata and truncate results', () => {
      const largeData: GBIFResponse<any> = {
        results: Array(5000).fill({
          id: 1,
          data: 'x'.repeat(100)
        }),
        count: 5000,
        offset: 0,
        limit: 300,
        endOfRecords: false
      };

      const result = truncator.truncatePaginatedResponse(largeData, {});

      expect(result.truncated).toBe(true);
      expect(result.metadata.totalCount).toBe(5000);
      expect(result.metadata.returnedCount).toBeLessThan(5000);
      expect(result.data.results.length).toBeLessThan(5000);
      expect(result.message).toContain('truncated');
      expect(result.pagination).toBeDefined();
    });

    it('should include pagination suggestion', () => {
      const largeData: GBIFResponse<any> = {
        results: Array(1000).fill({ id: 1, data: 'x'.repeat(500) }),
        count: 1000,
        offset: 0,
        limit: 300
      };

      const result = truncator.truncatePaginatedResponse(largeData, { taxonKey: 212 });

      expect(result.pagination?.suggestion).toContain('limit');
      expect(result.pagination?.example).toHaveProperty('limit');
      expect(result.pagination?.example).toHaveProperty('offset');
    });
  });

  describe('formatSize', () => {
    it('should format bytes to KB', () => {
      expect(ResponseTruncator.formatSize(1024)).toBe('1KB');
      expect(ResponseTruncator.formatSize(1536)).toBe('1.5KB');
      expect(ResponseTruncator.formatSize(250 * 1024)).toBe('250KB');
    });

    it('should format bytes to MB', () => {
      expect(ResponseTruncator.formatSize(1024 * 1024)).toBe('1.0MB');
      expect(ResponseTruncator.formatSize(2.5 * 1024 * 1024)).toBe('2.5MB');
    });
  });
});
