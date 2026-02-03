import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeciesDistributionsTool } from '../../../../src/tools/species/species-distributions.tool.js';
import { SpeciesService } from '../../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('SpeciesDistributionsTool', () => {
  let tool: SpeciesDistributionsTool;
  let speciesService: SpeciesService;

  beforeEach(() => {
    const client = new GBIFClient();
    speciesService = new SpeciesService(client);
    tool = new SpeciesDistributionsTool(speciesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_species_distributions');
    expect(definition.description).toContain('distribution');
  });

  it('should execute with valid key', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 1,
      results: [{ locality: 'Africa', country: 'KE' }],
    };

    vi.spyOn(speciesService, 'getDistributions').mockResolvedValue(mockResult);

    const result = await tool.execute({ key: 5 });
    expect(result.results).toHaveLength(1);
  });

  it('should handle pagination', async () => {
    const mockResult = {
      offset: 5,
      limit: 25,
      endOfRecords: false,
      count: 50,
      results: [],
    };

    vi.spyOn(speciesService, 'getDistributions').mockResolvedValue(mockResult);

    await tool.execute({ key: 5, limit: 25, offset: 5 });
    expect(speciesService.getDistributions).toHaveBeenCalledWith(5, 25, 5);
  });

  it('should handle service errors', async () => {
    vi.spyOn(speciesService, 'getDistributions').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ key: 1 })).rejects.toThrow();
  });
});
