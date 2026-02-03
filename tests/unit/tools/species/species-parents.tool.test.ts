import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeciesParentsTool } from '../../../../src/tools/species/species-parents.tool.js';
import { SpeciesService } from '../../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('SpeciesParentsTool', () => {
  let tool: SpeciesParentsTool;
  let speciesService: SpeciesService;

  beforeEach(() => {
    const client = new GBIFClient();
    speciesService = new SpeciesService(client);
    tool = new SpeciesParentsTool(speciesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_species_parents');
    expect(definition.description).toContain('parent');
  });

  it('should execute with valid key', async () => {
    const mockResult = [
      { key: 1, scientificName: 'Animalia', rank: 'KINGDOM' },
      { key: 2, scientificName: 'Chordata', rank: 'PHYLUM' },
    ];

    vi.spyOn(speciesService, 'getParents').mockResolvedValue(mockResult);

    const result = await tool.execute({ key: 5 });
    expect(result).toHaveLength(2);
    expect(speciesService.getParents).toHaveBeenCalledWith(5);
  });

  it('should reject invalid key type', async () => {
    await expect(tool.execute({ key: 'invalid' } as any)).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(speciesService, 'getParents').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ key: 1 })).rejects.toThrow();
  });
});
