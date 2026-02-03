import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { VocabulariesService } from '../../../src/services/vocabularies/vocabularies.service.js';

describe('VocabulariesService', () => {
  let client: GBIFClient;
  let service: VocabulariesService;

  beforeEach(() => {
    client = new GBIFClient();
    service = new VocabulariesService(client);
  });

  describe('list', () => {
    it('should list all vocabularies', async () => {
      const mockResponse = {
        offset: 0,
        limit: 20,
        endOfRecords: true,
        count: 2,
        results: [
          { name: 'BasisOfRecord', concepts: [] },
          { name: 'DegreeOfEstablishment', concepts: [] },
        ],
      };

      server.use(
        http.get('http://localhost:3000/vocabularies', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await service.list();

      expect(result.results).toHaveLength(2);
      expect(result.results?.[0].name).toBe('BasisOfRecord');
    });

    it('should handle errors', async () => {
      server.use(
        http.get('http://localhost:3000/vocabularies', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      await expect(service.list()).rejects.toThrow();
    }, 15000);
  });

  describe('getByName', () => {
    it('should get vocabulary by name', async () => {
      const mockVocabulary = {
        name: 'BasisOfRecord',
        concepts: [
          { name: 'HUMAN_OBSERVATION' },
          { name: 'PRESERVED_SPECIMEN' },
        ],
      };

      server.use(
        http.get('http://localhost:3000/vocabularies/BasisOfRecord', () => {
          return HttpResponse.json(mockVocabulary);
        })
      );

      const result = await service.getByName('BasisOfRecord');
      expect(result.name).toBe('BasisOfRecord');
      expect(result.concepts).toHaveLength(2);
    });
  });

  describe('getConcept', () => {
    it('should get concept from vocabulary', async () => {
      const mockConcept = {
        name: 'HUMAN_OBSERVATION',
        label: 'Human Observation',
      };

      server.use(
        http.get('http://localhost:3000/vocabularies/BasisOfRecord/concepts/HUMAN_OBSERVATION', () => {
          return HttpResponse.json(mockConcept);
        })
      );

      const result = await service.getConcept('BasisOfRecord', 'HUMAN_OBSERVATION');
      expect(result.name).toBe('HUMAN_OBSERVATION');
    });
  });
});
