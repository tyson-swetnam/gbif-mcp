import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeciesChildrenTool } from '../../../../src/tools/species/species-children.tool.js';
import { SpeciesService } from '../../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('SpeciesChildrenTool', () => {
  let tool: SpeciesChildrenTool;
  let speciesService: SpeciesService;

  beforeEach(() => {
    const client = new GBIFClient();
    speciesService = new SpeciesService(client);
    tool = new SpeciesChildrenTool(speciesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_species_children');
    expect(definition.description).toContain('children');
  });

  it('should execute with valid key', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 2,
      results: [
        { key: 10, scientificName: 'Child 1' },
        { key: 11, scientificName: 'Child 2' },
      ],
    };

    vi.spyOn(speciesService, 'getChildren').mockResolvedValue(mockResult);

    const result = await tool.execute({ key: 5 });
    expect(result.results).toHaveLength(2);
    expect(speciesService.getChildren).toHaveBeenCalledWith(5, 20, 0);
  });

  it('should handle limit and offset', async () => {
    const mockResult = {
      offset: 10,
      limit: 50,
      endOfRecords: false,
      count: 100,
      results: [],
    };

    vi.spyOn(speciesService, 'getChildren').mockResolvedValue(mockResult);

    await tool.execute({ key: 5, limit: 50, offset: 10 });
    expect(speciesService.getChildren).toHaveBeenCalledWith(5, 50, 10);
  });

  it('should reject invalid key type', async () => {
    await expect(tool.execute({ key: 'invalid' } as any)).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(speciesService, 'getChildren').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ key: 1 })).rejects.toThrow();
  });
});
