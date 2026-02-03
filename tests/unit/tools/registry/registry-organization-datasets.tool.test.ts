import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryOrganizationDatasetsTool } from '../../../../src/tools/registry/registry-organization-datasets.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistryOrganizationDatasetsTool', () => {
  let tool: RegistryOrganizationDatasetsTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistryOrganizationDatasetsTool(registryService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_organization_datasets');
  });

  it('should execute with valid organization UUID', async () => {
    const orgKey = '07f617d0-c688-11d8-bf62-b8a03c50a862';
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: false,
      count: 50,
      results: [{ key: 'ds-uuid', title: 'Dataset 1', type: 'OCCURRENCE' }],
    };

    vi.spyOn(registryService, 'getOrganizationDatasets').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ organizationKey: orgKey });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
  });

  it('should reject invalid UUID', async () => {
    await expect(tool.execute({ organizationKey: 'invalid' })).rejects.toThrow();
  });
});
