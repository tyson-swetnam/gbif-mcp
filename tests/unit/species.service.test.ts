import { describe, it, expect, beforeEach } from 'vitest';
import { rest } from 'msw';
import { server } from '../setup.js';
import { GBIFClient } from '../../src/core/gbif-client.js';
import { SpeciesService } from '../../src/services/species/species.service.js';

describe('SpeciesService', () => {
  let client: GBIFClient;
  let service: SpeciesService;

  beforeEach(() => {
    client = new GBIFClient();
    service = new SpeciesService(client);
  });

  describe('search', () => {
    it('should search for species', async () => {
      const mockResponse = {
        offset: 0,
        limit: 20,
        endOfRecords: false,
        count: 100,
        results: [
          {
            key: 1,
            scientificName: 'Puma concolor',
            rank: 'SPECIES',
            kingdom: 'Animalia',
            phylum: 'Chordata',
            class: 'Mammalia',
            order: 'Carnivora',
            family: 'Felidae',
            genus: 'Puma',
          },
        ],
      };

      server.use(
        rest.get('http://localhost:3000/species/search', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const result = await service.search({ q: 'Puma', limit: 20 });

      expect(result).toEqual(mockResponse);
      expect(result.results).toHaveLength(1);
      expect(result.results?.[0].scientificName).toBe('Puma concolor');
    });

    it('should handle empty search results', async () => {
      server.use(
        rest.get('http://localhost:3000/species/search', (req, res, ctx) => {
          return res(
            ctx.json({
              offset: 0,
              limit: 20,
              endOfRecords: true,
              count: 0,
              results: [],
            })
          );
        })
      );

      const result = await service.search({ q: 'NonexistentSpecies' });

      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should handle API errors', async () => {
      server.use(
        rest.get('http://localhost:3000/species/search', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Internal Server Error' })
          );
        })
      );

      await expect(service.search({ q: 'test' })).rejects.toThrow();
    });
  });

  describe('getByKey', () => {
    it('should get species by key', async () => {
      const mockSpecies = {
        key: 5231190,
        scientificName: 'Panthera leo',
        rank: 'SPECIES',
        kingdom: 'Animalia',
        phylum: 'Chordata',
        class: 'Mammalia',
        order: 'Carnivora',
        family: 'Felidae',
        genus: 'Panthera',
      };

      server.use(
        rest.get('http://localhost:3000/species/5231190', (req, res, ctx) => {
          return res(ctx.json(mockSpecies));
        })
      );

      const result = await service.getByKey(5231190);

      expect(result).toEqual(mockSpecies);
      expect(result.scientificName).toBe('Panthera leo');
    });

    it('should handle not found error', async () => {
      server.use(
        rest.get('http://localhost:3000/species/999999999', (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({ error: 'Not Found' })
          );
        })
      );

      await expect(service.getByKey(999999999)).rejects.toThrow();
    });
  });

  describe('suggest', () => {
    it('should return species suggestions', async () => {
      const mockSuggestions = [
        {
          key: 1,
          scientificName: 'Puma concolor',
          rank: 'SPECIES',
        },
        {
          key: 2,
          scientificName: 'Puma yagouaroundi',
          rank: 'SPECIES',
        },
      ];

      server.use(
        rest.get('http://localhost:3000/species/suggest', (req, res, ctx) => {
          const q = req.url.searchParams.get('q');
          if (q === 'Puma') {
            return res(ctx.json(mockSuggestions));
          }
          return res(ctx.json([]));
        })
      );

      const result = await service.suggest('Puma', 10);

      expect(result).toHaveLength(2);
      expect(result[0].scientificName).toBe('Puma concolor');
    });
  });

  describe('match', () => {
    it('should match species name exactly', async () => {
      const mockMatch = {
        usageKey: 5231190,
        scientificName: 'Panthera leo',
        canonicalName: 'Panthera leo',
        rank: 'SPECIES',
        status: 'ACCEPTED',
        confidence: 100,
        matchType: 'EXACT',
        kingdom: 'Animalia',
        phylum: 'Chordata',
        class: 'Mammalia',
        order: 'Carnivora',
        family: 'Felidae',
        genus: 'Panthera',
        species: 'Panthera leo',
      };

      server.use(
        rest.get('http://localhost:3000/species/match', (req, res, ctx) => {
          return res(ctx.json(mockMatch));
        })
      );

      const result = await service.match('Panthera leo', true);

      expect(result).toHaveLength(1);
      expect(result[0].matchType).toBe('EXACT');
    });

    it('should return fuzzy matches', async () => {
      const mockMatch = {
        usageKey: 5231190,
        scientificName: 'Panthera leo',
        canonicalName: 'Panthera leo',
        rank: 'SPECIES',
        status: 'ACCEPTED',
        confidence: 80,
        matchType: 'FUZZY',
        alternatives: [
          {
            usageKey: 123456,
            scientificName: 'Panthera pardus',
            confidence: 70,
          },
        ],
      };

      server.use(
        rest.get('http://localhost:3000/species/match', (req, res, ctx) => {
          return res(ctx.json(mockMatch));
        })
      );

      const result = await service.match('Panthera', false);

      expect(result).toHaveLength(1);
      expect(result[0].matchType).toBe('FUZZY');
    });
  });
});