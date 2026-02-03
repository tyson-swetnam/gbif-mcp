import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrySearchInstallationsTool } from '../../../../src/tools/registry/registry-search-installations.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistrySearchInstallationsTool', () => {
  let tool: RegistrySearchInstallationsTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistrySearchInstallationsTool(registryService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_search_installations');
  });

  it('should search installations', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 10,
      results: [{ key: 'inst-uuid', type: 'IPT_INSTALLATION' }],
    };

    vi.spyOn(registryService, 'searchInstallations').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ type: 'IPT_INSTALLATION' });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
  });

  it('should handle service errors', async () => {
    vi.spyOn(registryService, 'searchInstallations').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({})).rejects.toThrow();
  });
});
