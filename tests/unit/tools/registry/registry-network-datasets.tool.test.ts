import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryNetworkDatasetsTool } from '../../../../src/tools/registry/registry-network-datasets.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistryNetworkDatasetsTool', () => {
  let tool: RegistryNetworkDatasetsTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistryNetworkDatasetsTool(registryService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_network_datasets');
  });

  it('should list network datasets', async () => {
    const netKey = '029f9226-0d8a-4f99-80b7-3f714a0f1b93';
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: false,
      count: 100,
      results: [{ key: 'ds-uuid', title: 'Dataset 1' }],
    };

    vi.spyOn(registryService, 'getNetworkDatasets').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ networkKey: netKey });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
  });

  it('should reject invalid UUID', async () => {
    await expect(tool.execute({ networkKey: 'invalid' })).rejects.toThrow();
  });
});
