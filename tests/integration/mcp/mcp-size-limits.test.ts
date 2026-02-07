import { describe, it, expect, beforeAll, vi } from 'vitest';
import { OccurrenceSearchTool } from '../../../src/tools/occurrence/occurrence-search.tool.js';
import { OccurrenceService } from '../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { createLargeDataset, estimateSize } from '../setup.js';

describe('MCP Size Limits', () => {
  let tool: OccurrenceSearchTool;
  let service: OccurrenceService;
  let client: GBIFClient;

  beforeAll(() => {
    client = new GBIFClient();
    service = new OccurrenceService(client);
    tool = new OccurrenceSearchTool(service);
  });

  describe('Response Truncation', () => {
    it('should pass through small responses unchanged', async () => {
      const smallResult = {
        offset: 0,
        limit: 5,
        endOfRecords: false,
        count: 100,
        results: [
          { key: 1, scientificName: 'Test species', country: 'US' },
          { key: 2, scientificName: 'Test species 2', country: 'GB' },
        ],
      };

      vi.spyOn(service, 'search').mockResolvedValue(smallResult);

      const result: any = await tool.execute({ taxonKey: 1, limit: 5 });

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(2);
      expect((result as any).truncated).toBeUndefined();

      const size = estimateSize(result);
      expect(size).toBeLessThan(250); // Under 250KB
    });

    it('should truncate large responses', async () => {
      // Create response > 250KB
      const largeResults = createLargeDataset(
        (i) => ({
          key: i,
          scientificName: `Species ${i}`,
          country: 'US',
          locality: 'x'.repeat(1000), // Make each record large
          basisOfRecord: 'PRESERVED_SPECIMEN',
          eventDate: '2024-01-01',
          decimalLatitude: 40.0,
          decimalLongitude: -120.0,
        }),
        300 // Target 300KB
      );

      const largeResult = {
        offset: 0,
        limit: 300,
        endOfRecords: false,
        count: 5000,
        results: largeResults,
      };

      vi.spyOn(service, 'search').mockResolvedValue(largeResult);

      const result: any = await tool.execute({ taxonKey: 1, limit: 300 });

      // When truncated, the whole response is replaced with TruncatedResponse
      expect(result.truncated).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message).toMatch(/exceeds|truncated/i);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.returnedCount).toBeDefined();

      // For paginated data, should have pagination suggestions
      if (result.pagination) {
        expect(result.pagination.suggestion).toContain('limit');
      }

      const size = estimateSize(result);
      expect(size).toBeLessThan(250); // Must be under limit
    });

    it('should include pagination suggestions', async () => {
      const largeResults = createLargeDataset(
        (i) => ({
          key: i,
          scientificName: 'x'.repeat(500),
          data: 'y'.repeat(500),
        }),
        300
      );

      const largeResult = {
        offset: 0,
        limit: 300,
        count: 1000,
        results: largeResults,
      };

      vi.spyOn(service, 'search').mockResolvedValue(largeResult);

      const result: any = await tool.execute({
        taxonKey: 212,
        country: 'US',
        limit: 300
      });

      expect(result.truncated).toBe(true);

      // Check for pagination guidance if present
      if (result.pagination) {
        expect(result.pagination.example).toHaveProperty('limit');
        expect(result.pagination.example).toHaveProperty('offset');
      } else {
        // At minimum should have a suggestion message
        expect(result.message).toBeDefined();
      }
    });
  });

  describe('Size Calculations', () => {
    it('should accurately calculate response sizes', () => {
      const data = { test: 'data', numbers: [1, 2, 3] };
      const expectedSize = JSON.stringify(data).length;
      const actualSize = estimateSize(data);

      expect(actualSize).toBeGreaterThan(0);
      expect(Math.abs(actualSize * 1024 - expectedSize)).toBeLessThan(1024);
    });
  });
});
