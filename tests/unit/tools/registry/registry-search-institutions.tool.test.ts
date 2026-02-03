import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrySearchInstitutionsTool } from '../../../../src/tools/registry/registry-search-institutions.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistrySearchInstitutionsTool', () => {
  let tool: RegistrySearchInstitutionsTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistrySearchInstitutionsTool(registryService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_search_institutions');
  });

  it('should search institutions', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: false,
      count: 30,
      results: [{ key: 'inst-uuid', name: 'Museum', code: 'NMNH' }],
    };

    vi.spyOn(registryService, 'searchInstitutions').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ country: 'US' });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
  });

  it('should reject invalid country code', async () => {
    await expect(tool.execute({ country: 'USA' } as any)).rejects.toThrow();
  });
});
