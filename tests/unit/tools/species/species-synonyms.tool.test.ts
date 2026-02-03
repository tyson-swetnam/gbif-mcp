import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeciesSynonymsTool } from '../../../../src/tools/species/species-synonyms.tool.js';
import { SpeciesService } from '../../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('SpeciesSynonymsTool', () => {
  let tool: SpeciesSynonymsTool;
  let speciesService: SpeciesService;

  beforeEach(() => {
    const client = new GBIFClient();
    speciesService = new SpeciesService(client);
    tool = new SpeciesSynonymsTool(speciesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_species_synonyms');
    expect(definition.description).toContain('synonym');
  });

  it('should execute with valid key', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 2,
      results: [
        { key: 10, scientificName: 'Synonym 1' },
        { key: 11, scientificName: 'Synonym 2' },
      ],
    };

    vi.spyOn(speciesService, 'getSynonyms').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ key: 5 });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(2);
    expect(speciesService.getSynonyms).toHaveBeenCalled();
  });

  it('should handle limit and offset', async () => {
    const mockResult = {
      offset: 10,
      limit: 50,
      endOfRecords: false,
      count: 100,
      results: [],
    };

    vi.spyOn(speciesService, 'getSynonyms').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ key: 5, limit: 50, offset: 10 });
    expect(result.success).toBe(true);
    expect(speciesService.getSynonyms).toHaveBeenCalledWith(5, { limit: 50, offset: 10 });
  });

  it('should reject invalid input', async () => {
    await expect(tool.execute({ key: 'invalid' } as any)).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(speciesService, 'getSynonyms').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ key: 1 })).rejects.toThrow();
  });
});
