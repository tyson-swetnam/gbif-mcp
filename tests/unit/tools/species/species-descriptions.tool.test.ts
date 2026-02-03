import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeciesDescriptionsTool } from '../../../../src/tools/species/species-descriptions.tool.js';
import { SpeciesService } from '../../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('SpeciesDescriptionsTool', () => {
  let tool: SpeciesDescriptionsTool;
  let speciesService: SpeciesService;

  beforeEach(() => {
    const client = new GBIFClient();
    speciesService = new SpeciesService(client);
    tool = new SpeciesDescriptionsTool(speciesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_species_descriptions');
    expect(definition.description).toContain('description');
  });

  it('should execute with valid key', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 1,
      results: [{ description: 'Test description', language: 'en' }],
    };

    vi.spyOn(speciesService, 'getDescriptions').mockResolvedValue(mockResult);

    const result = await tool.execute({ key: 5 });
    expect(result.results).toHaveLength(1);
  });

  it('should handle pagination', async () => {
    const mockResult = {
      offset: 10,
      limit: 50,
      endOfRecords: false,
      count: 100,
      results: [],
    };

    vi.spyOn(speciesService, 'getDescriptions').mockResolvedValue(mockResult);

    await tool.execute({ key: 5, limit: 50, offset: 10 });
    expect(speciesService.getDescriptions).toHaveBeenCalledWith(5, 50, 10);
  });

  it('should handle service errors', async () => {
    vi.spyOn(speciesService, 'getDescriptions').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ key: 1 })).rejects.toThrow();
  });
});
