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

  describe('getByDoi', () => {
    it('should get literature by DOI', async () => {
      const mockLiterature = {
        id: 123,
        title: 'Biodiversity Study',
        year: 2023,
        doi: '10.1234/test',
      };

      let requestedDoi: string | null = null;
      server.use(
        http.get('http://localhost:3000/literature/search', ({ request }) => {
          requestedDoi = new URL(request.url).searchParams.get('doi');
          return HttpResponse.json({ offset: 0, limit: 1, endOfRecords: true, count: 1, results: [mockLiterature] });
        })
      );

      const result = await service.getByDoi('https://doi.org/10.1234/test');
      expect(requestedDoi).toBe('10.1234/test');
      expect(result.title).toBe('Biodiversity Study');
    });

    it('should raise a 404-style error when the DOI is unknown', async () => {
      server.use(
        http.get('http://localhost:3000/literature/search', () => {
          return HttpResponse.json({ offset: 0, limit: 1, endOfRecords: true, count: 0, results: [] });
        })
      );

      await expect(service.getByDoi('10.9999/nope')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
