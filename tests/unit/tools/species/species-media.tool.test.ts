import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeciesMediaTool } from '../../../../src/tools/species/species-media.tool.js';
import { SpeciesService } from '../../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('SpeciesMediaTool', () => {
  let tool: SpeciesMediaTool;
  let speciesService: SpeciesService;

  beforeEach(() => {
    const client = new GBIFClient();
    speciesService = new SpeciesService(client);
    tool = new SpeciesMediaTool(speciesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_species_media');
    expect(definition.description).toContain('media');
  });

  it('should execute with valid key', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 1,
      results: [{ identifier: 'http://example.com/image.jpg', type: 'StillImage' }],
    };

    vi.spyOn(speciesService, 'getMedia').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ key: 5 });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
    expect(speciesService.getMedia).toHaveBeenCalled();
  });

  it('should handle pagination', async () => {
    const mockResult = {
      offset: 20,
      limit: 100,
      endOfRecords: false,
      count: 500,
      results: [],
    };

    vi.spyOn(speciesService, 'getMedia').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ key: 5, limit: 100, offset: 20 });
    expect(result.success).toBe(true);
    expect(speciesService.getMedia).toHaveBeenCalledWith(5, { limit: 100, offset: 20 });
  });

  it('should reject invalid input', async () => {
    await expect(tool.execute({ key: -1 })).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(speciesService, 'getMedia').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ key: 1 })).rejects.toThrow();
  });
});
