import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryGetNetworkTool } from '../../../../src/tools/registry/registry-get-network.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistryGetNetworkTool', () => {
  let tool: RegistryGetNetworkTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistryGetNetworkTool(registryService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_get_network');
  });

  it('should get network by UUID', async () => {
    const netKey = '029f9226-0d8a-4f99-80b7-3f714a0f1b93';
    const mockNetwork = {
      key: netKey,
      title: 'Test Network',
      numConstituents: 100,
    };

    vi.spyOn(registryService, 'getNetwork').mockResolvedValue(mockNetwork);

    const result: any = await tool.execute({ key: netKey });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Test Network');
  });

  it('should reject invalid UUID', async () => {
    await expect(tool.execute({ key: 'invalid' })).rejects.toThrow();
  });
});
