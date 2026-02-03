import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryGetCollectionTool } from '../../../../src/tools/registry/registry-get-collection.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistryGetCollectionTool', () => {
  let tool: RegistryGetCollectionTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistryGetCollectionTool(registryService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_get_collection');
  });

  it('should get collection by UUID', async () => {
    const collKey = '1193638d-60b4-4d9f-9b9a-2a0e16f9e7d8';
    const mockColl = {
      key: collKey,
      code: 'HERB',
      name: 'Herbarium Collection',
    };

    vi.spyOn(registryService, 'getCollection').mockResolvedValue(mockColl);

    const result: any = await tool.execute({ key: collKey });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Herbarium Collection');
  });

  it('should reject invalid UUID', async () => {
    await expect(tool.execute({ key: 'invalid' })).rejects.toThrow();
  });
});
