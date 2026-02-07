import { describe, it, expect, beforeAll } from 'vitest';
import { SpeciesService } from '../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';

describe('GBIF Species API Integration', () => {
  let service: SpeciesService;

  beforeAll(() => {
    service = new SpeciesService(new GBIFClient());
  });

  describe('Species Search', () => {
    it('should search for Panthera leo', async () => {
      const results = await service.search({
        q: 'Panthera leo',
        limit: 5
      });

      expect(results.count).toBeGreaterThan(0);
      expect(results.results).toBeDefined();
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].scientificName).toContain('Panthera');
    }, 10000);

    it('should filter by rank', async () => {
      const results = await service.search({
        q: 'Panthera',
        rank: 'GENUS',
        limit: 5
      });

      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].rank).toBe('GENUS');
    }, 10000);

    it('should search with habitat filter', async () => {
      const results = await service.search({
        habitat: ['MARINE'],
        limit: 10
      });

      expect(results.count).toBeGreaterThan(0);
      expect(results.results.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Species Lookup', () => {
    it('should get species by key', async () => {
      // Panthera leo key
      const species = await service.getByKey(5219404);

      expect(species.key).toBe(5219404);
      expect(species.scientificName).toContain('Panthera leo');
      expect(species.rank).toBe('SPECIES');
    }, 10000);

    it('should get species with full taxonomy', async () => {
      const species = await service.getByKey(5219404);

      expect(species.kingdom).toBeDefined();
      expect(species.phylum).toBeDefined();
      expect(species.class).toBeDefined();
      expect(species.order).toBeDefined();
      expect(species.family).toBeDefined();
      expect(species.genus).toBeDefined();
    }, 10000);
  });

  describe('Species Names', () => {
    it('should get vernacular names', async () => {
      const names = await service.getVernacularNames(5219404, { limit: 10 });

      expect(names.results.length).toBeGreaterThan(0);
      expect(names.results.some(n => n.language === 'eng')).toBe(true);
    }, 10000);

    it('should get synonyms', async () => {
      const synonyms = await service.getSynonyms(5219404, { limit: 5 });

      expect(synonyms.results).toBeDefined();
    }, 10000);
  });
});
