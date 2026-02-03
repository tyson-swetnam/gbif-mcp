import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeciesVernacularNamesTool } from '../../../../src/tools/species/species-vernacular.tool.js';
import { SpeciesService } from '../../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('SpeciesVernacularNamesTool', () => {
  let tool: SpeciesVernacularNamesTool;
  let speciesService: SpeciesService;

  beforeEach(() => {
    const client = new GBIFClient();
    speciesService = new SpeciesService(client);
    tool = new SpeciesVernacularNamesTool(speciesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_species_vernacular');
    expect(definition.description).toContain('vernacular');
  });

  it('should execute with valid key', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 2,
      results: [
        { vernacularName: 'Lion', language: 'en' },
        { vernacularName: 'León', language: 'es' },
      ],
    };

    vi.spyOn(speciesService, 'getVernacularNames').mockResolvedValue(mockResult);

    const result = await tool.execute({ key: 5 });
    expect(result.results).toHaveLength(2);
  });

  it('should handle pagination', async () => {
    const mockResult = {
      offset: 0,
      limit: 100,
      endOfRecords: true,
      count: 50,
      results: [],
    };

    vi.spyOn(speciesService, 'getVernacularNames').mockResolvedValue(mockResult);

    await tool.execute({ key: 5, limit: 100 });
    expect(speciesService.getVernacularNames).toHaveBeenCalledWith(5, 100, 0);
  });

  it('should handle service errors', async () => {
    vi.spyOn(speciesService, 'getVernacularNames').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ key: 1 })).rejects.toThrow();
  });
});
