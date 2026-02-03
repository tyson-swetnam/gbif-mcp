import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryGetOrganizationTool } from '../../../../src/tools/registry/registry-get-organization.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistryGetOrganizationTool', () => {
  let tool: RegistryGetOrganizationTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistryGetOrganizationTool(registryService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_get_organization');
  });

  it('should execute with valid UUID', async () => {
    const orgKey = '07f617d0-c688-11d8-bf62-b8a03c50a862';
    const mockOrg = {
      key: orgKey,
      title: 'Test Organization',
      country: 'US',
      numPublishedDatasets: 10,
    };

    vi.spyOn(registryService, 'getOrganization').mockResolvedValue(mockOrg);

    const result: any = await tool.execute({ key: orgKey });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Test Organization');
  });

  it('should reject invalid UUID', async () => {
    await expect(tool.execute({ key: 'invalid' })).rejects.toThrow();
  });
});
