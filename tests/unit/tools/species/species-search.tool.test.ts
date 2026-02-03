import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeciesSearchTool } from '../../../../src/tools/species/species-search.tool.js';
import { SpeciesService } from '../../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('SpeciesSearchTool', () => {
  let tool: SpeciesSearchTool;
  let speciesService: SpeciesService;
  let client: GBIFClient;

  beforeEach(() => {
    client = new GBIFClient();
    speciesService = new SpeciesService(client);
    tool = new SpeciesSearchTool(speciesService);
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      const definition = tool.getDefinition();
      expect(definition.name).toBe('gbif_species_search');
    });

    it('should have description', () => {
      const definition = tool.getDefinition();
      expect(definition.description).toContain('Search for species');
    });

    it('should have input schema', () => {
      const definition = tool.getDefinition();
      expect(definition.inputSchema).toBeDefined();
      expect(definition.inputSchema.type).toBe('object');
    });
  });

  describe('input validation', () => {
    it('should accept valid search query', async () => {
      const mockResult = {
        offset: 0,
        limit: 20,
        endOfRecords: false,
        count: 100,
        results: [{ key: 1, scientificName: 'Panthera leo' }],
      };

      vi.spyOn(speciesService, 'search').mockResolvedValue(mockResult);

      const result: any = await tool.execute({ q: 'Panthera' });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(speciesService.search).toHaveBeenCalled();
    });

    it('should accept rank filter', async () => {
      const mockResult = {
        offset: 0,
        limit: 20,
        endOfRecords: true,
        count: 0,
        results: [],
      };

      vi.spyOn(speciesService, 'search').mockResolvedValue(mockResult);

      const result: any = await tool.execute({ rank: 'SPECIES' });
      expect(result.success).toBe(true);
      expect(speciesService.search).toHaveBeenCalled();
    });

    it('should accept multiple filters', async () => {
      const mockResult = {
        offset: 0,
        limit: 20,
        endOfRecords: true,
        count: 0,
        results: [],
      };

      vi.spyOn(speciesService, 'search').mockResolvedValue(mockResult);

      const params = {
        q: 'lion',
        rank: 'SPECIES' as const,
        habitat: ['TERRESTRIAL' as const],
        limit: 50,
      };

      const result: any = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(speciesService.search).toHaveBeenCalled();
    });

    it('should reject invalid rank', async () => {
      await expect(
        tool.execute({ rank: 'INVALID' } as any)
      ).rejects.toThrow();
    });

    it('should accept offset and limit', async () => {
      const mockResult = {
        offset: 100,
        limit: 50,
        endOfRecords: false,
        count: 1000,
        results: [],
      };

      vi.spyOn(speciesService, 'search').mockResolvedValue(mockResult);

      await tool.execute({ offset: 100, limit: 50 });
      expect(speciesService.search).toHaveBeenCalledWith({ offset: 100, limit: 50 });
    });

    it('should reject limit over 1000', async () => {
      await expect(
        tool.execute({ limit: 1500 })
      ).rejects.toThrow();
    });

    it('should reject negative offset', async () => {
      await expect(
        tool.execute({ offset: -1 })
      ).rejects.toThrow();
    });
  });

  describe('response formatting', () => {
    it('should format successful response', async () => {
      const mockResult = {
        offset: 0,
        limit: 20,
        endOfRecords: false,
        count: 100,
        results: [
          { key: 1, scientificName: 'Panthera leo', rank: 'SPECIES' },
          { key: 2, scientificName: 'Panthera tigris', rank: 'SPECIES' },
        ],
      };

      vi.spyOn(speciesService, 'search').mockResolvedValue(mockResult);

      const result: any = await tool.execute({ q: 'Panthera' });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('offset', 0);
      expect(result.data).toHaveProperty('limit', 20);
      expect(result.data).toHaveProperty('count', 100);
      expect(result.data.results).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      const mockResult = {
        offset: 0,
        limit: 20,
        endOfRecords: true,
        count: 0,
        results: [],
      };

      vi.spyOn(speciesService, 'search').mockResolvedValue(mockResult);

      const result: any = await tool.execute({ q: 'NonexistentSpecies' });

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(0);
      expect(result.data.results).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle service errors', async () => {
      vi.spyOn(speciesService, 'search').mockRejectedValue(
        new Error('Service error')
      );

      await expect(tool.execute({ q: 'test' })).rejects.toThrow('Service error');
    });

    it('should handle network errors', async () => {
      vi.spyOn(speciesService, 'search').mockRejectedValue(
        new Error('Network error')
      );

      await expect(tool.execute({ q: 'test' })).rejects.toThrow();
    });
  });
});
