import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
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
        http.get('http://localhost:3000/species/search', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await service.search({ q: 'Puma', limit: 20 });

      expect(result).toEqual(mockResponse);
      expect(result.results).toHaveLength(1);
      expect(result.results?.[0].scientificName).toBe('Puma concolor');
    });

    it('should handle empty search results', async () => {
      server.use(
        http.get('http://localhost:3000/species/search', () => {
          return HttpResponse.json({
            offset: 0,
            limit: 20,
            endOfRecords: true,
            count: 0,
            results: [],
          });
        })
      );

      const result = await service.search({ q: 'NonexistentSpecies' });

      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should handle API errors', async () => {
      server.use(
        http.get('http://localhost:3000/species/search', () => {
          return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        })
      );

      await expect(service.search({ q: 'test' })).rejects.toThrow();
    }, 15000);
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
        http.get('http://localhost:3000/species/5231190', () => {
          return HttpResponse.json(mockSpecies);
        })
      );

      const result = await service.getByKey(5231190);

      expect(result).toEqual(mockSpecies);
      expect(result.scientificName).toBe('Panthera leo');
    });

    it('should handle not found error', async () => {
      server.use(
        http.get('http://localhost:3000/species/999999999', () => {
          return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
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
        http.get('http://localhost:3000/species/suggest', ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('q');
          if (q === 'Puma') {
            return HttpResponse.json(mockSuggestions);
          }
          return HttpResponse.json([]);
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
        http.get('http://localhost:3000/species/match', () => {
          return HttpResponse.json(mockMatch);
        })
      );

      const result = await service.match({ name: 'Panthera leo', strict: true });

      expect(result.matchType).toBe('EXACT');
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
        http.get('http://localhost:3000/species/match', () => {
          return HttpResponse.json(mockMatch);
        })
      );

      const result = await service.match({ name: 'Panthera', strict: false });

      expect(result.matchType).toBe('FUZZY');
    });
  });
});
