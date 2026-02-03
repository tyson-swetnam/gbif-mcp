import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrySearchNetworksTool } from '../../../../src/tools/registry/registry-search-networks.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistrySearchNetworksTool', () => {
  let tool: RegistrySearchNetworksTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistrySearchNetworksTool(registryService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_search_networks');
    expect(definition.description).toContain('network');
  });

  it('should execute search', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 5,
      results: [{ key: 'net-uuid', title: 'Test Network' }],
    };

    vi.spyOn(registryService, 'listNetworks').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ q: 'eBird' });
    expect(result.success).toBe(true);
    expect(registryService.listNetworks).toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    vi.spyOn(registryService, 'listNetworks').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({})).rejects.toThrow();
  });
});
