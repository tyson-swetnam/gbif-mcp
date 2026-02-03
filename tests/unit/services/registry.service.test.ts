import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { RegistryService } from '../../../src/services/registry/registry.service.js';

describe('RegistryService', () => {
  let client: GBIFClient;
  let service: RegistryService;

  beforeEach(() => {
    client = new GBIFClient();
    service = new RegistryService(client);
  });

  describe('searchDatasets', () => {
    it('should search for datasets', async () => {
      const mockResponse = {
        offset: 0,
        limit: 20,
        endOfRecords: false,
        count: 100,
        results: [
          {
            key: 'dataset-123',
            title: 'Test Dataset',
            type: 'OCCURRENCE',
            publishingOrganizationKey: 'org-456',
          },
        ],
      };

      server.use(
        http.get('http://localhost:3000/dataset', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await service.searchDatasets({ type: 'OCCURRENCE' });

      expect(result.results).toHaveLength(1);
      expect(result.results?.[0].title).toBe('Test Dataset');
    });

    it('should handle errors', async () => {
      server.use(
        http.get('http://localhost:3000/dataset', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      await expect(service.searchDatasets()).rejects.toThrow();
    }, 15000);
  });

  describe('getDataset', () => {
    it('should get dataset by key', async () => {
      const mockDataset = {
        key: 'dataset-123',
        title: 'Test Dataset',
        description: 'A test dataset',
        type: 'OCCURRENCE',
      };

      server.use(
        http.get('http://localhost:3000/dataset/dataset-123', () => {
          return HttpResponse.json(mockDataset);
        })
      );

      const result = await service.getDataset('dataset-123');
      expect(result.title).toBe('Test Dataset');
    });
  });

  describe('searchOrganizations', () => {
    it('should search for organizations', async () => {
      const mockResponse = {
        offset: 0,
        limit: 20,
        endOfRecords: false,
        count: 50,
        results: [
          {
            key: 'org-123',
            title: 'Test Organization',
            country: 'US',
          },
        ],
      };

      server.use(
        http.get('http://localhost:3000/organization', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await service.searchOrganizations({ country: 'US' });
      expect(result.results).toHaveLength(1);
    });
  });

  describe('listNetworks', () => {
    it('should list networks', async () => {
      const mockResponse = {
        offset: 0,
        limit: 20,
        endOfRecords: false,
        count: 10,
        results: [
          {
            key: 'network-123',
            title: 'Test Network',
          },
        ],
      };

      server.use(
        http.get('http://localhost:3000/network', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await service.listNetworks();
      expect(result.results).toHaveLength(1);
    });
  });
});
