import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OccurrenceSearchTool } from '../../../../src/tools/occurrence/occurrence-search.tool.js';
import { OccurrenceService } from '../../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('OccurrenceSearchTool', () => {
  let tool: OccurrenceSearchTool;
  let occurrenceService: OccurrenceService;

  beforeEach(() => {
    const client = new GBIFClient();
    occurrenceService = new OccurrenceService(client);
    tool = new OccurrenceSearchTool(occurrenceService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_occurrence_search');
    expect(definition.description).toContain('occurrence');
  });

  it('should execute with valid filters', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: false,
      count: 1000,
      results: [
        { key: 123, scientificName: 'Panthera leo', country: 'KE' },
      ],
    };

    vi.spyOn(occurrenceService, 'search').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ taxonKey: 5231190, country: 'KE' });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
    expect(occurrenceService.search).toHaveBeenCalled();
  });

  it('should handle coordinate filters', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 10,
      results: [],
    };

    vi.spyOn(occurrenceService, 'search').mockResolvedValue(mockResult);

    const result: any = await tool.execute({
      hasCoordinate: true,
      decimalLatitude: '-1.5,1.5',
      decimalLongitude: '35,37',
    });

    expect(result.success).toBe(true);
    expect(occurrenceService.search).toHaveBeenCalled();
  });

  it('should handle pagination', async () => {
    const mockResult = {
      offset: 100,
      limit: 50,
      endOfRecords: false,
      count: 5000,
      results: [],
    };

    vi.spyOn(occurrenceService, 'search').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ taxonKey: 1, limit: 50, offset: 100 });
    expect(result.success).toBe(true);
    expect(occurrenceService.search).toHaveBeenCalled();
  });

  it('should reject invalid input', async () => {
    await expect(
      tool.execute({ limit: -1 } as any)
    ).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(occurrenceService, 'search').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ taxonKey: 1 })).rejects.toThrow();
  });
});
