import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrySearchOrganizationsTool } from '../../../../src/tools/registry/registry-search-organizations.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistrySearchOrganizationsTool', () => {
  let tool: RegistrySearchOrganizationsTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistrySearchOrganizationsTool(registryService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_search_organizations');
    expect(definition.description).toContain('organization');
  });

  it('should execute with filters', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: false,
      count: 50,
      results: [{ key: 'org-uuid', title: 'Test Org', country: 'US' }],
    };

    vi.spyOn(registryService, 'searchOrganizations').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ country: 'US' });
    expect(result.success).toBe(true);
    expect(registryService.searchOrganizations).toHaveBeenCalled();
  });

  it('should reject invalid country code', async () => {
    await expect(tool.execute({ country: 'USA' } as any)).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(registryService, 'searchOrganizations').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ q: 'test' })).rejects.toThrow();
  });
});
