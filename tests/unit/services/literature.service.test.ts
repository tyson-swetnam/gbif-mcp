import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { LiteratureService } from '../../../src/services/literature/literature.service.js';

describe('LiteratureService', () => {
  let client: GBIFClient;
  let service: LiteratureService;

  beforeEach(() => {
    client = new GBIFClient();
    service = new LiteratureService(client);
  });

  describe('search', () => {
    it('should search for literature', async () => {
      const mockResponse = {
        offset: 0,
        limit: 20,
        endOfRecords: false,
        count: 50,
        results: [
          {
            id: 123,
            title: 'Biodiversity Study',
            year: 2023,
            doi: '10.1234/test',
            topics: ['BIODIVERSITY'],
          },
        ],
      };

      server.use(
        http.get('http://localhost:3000/literature/search', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await service.search({ year: '2023' });

      expect(result.results).toHaveLength(1);
      expect(result.results?.[0].title).toBe('Biodiversity Study');
    });

    it('should handle errors', async () => {
      server.use(
        http.get('http://localhost:3000/literature/search', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      await expect(service.search({})).rejects.toThrow();
    }, 15000);
  });

  describe('get', () => {
    it('should get literature by ID', async () => {
      const mockLiterature = {
        id: 123,
        title: 'Biodiversity Study',
        year: 2023,
        doi: '10.1234/test',
      };

      server.use(
        http.get('http://localhost:3000/literature/123', () => {
          return HttpResponse.json(mockLiterature);
        })
      );

      const result = await service.get(123);
      expect(result.title).toBe('Biodiversity Study');
    });
  });
});
