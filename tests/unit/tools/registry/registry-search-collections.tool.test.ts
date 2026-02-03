import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrySearchCollectionsTool } from '../../../../src/tools/registry/registry-search-collections.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistrySearchCollectionsTool', () => {
  let tool: RegistrySearchCollectionsTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistrySearchCollectionsTool(registryService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_search_collections');
  });

  it('should search collections', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: false,
      count: 50,
      results: [{ key: 'coll-uuid', name: 'Herbarium', code: 'HERB' }],
    };

    vi.spyOn(registryService, 'searchCollections').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ country: 'US' });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
  });

  it('should reject invalid country code', async () => {
    await expect(tool.execute({ country: 'USA' } as any)).rejects.toThrow();
  });
});
