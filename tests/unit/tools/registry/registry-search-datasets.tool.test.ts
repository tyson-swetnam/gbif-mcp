import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrySearchDatasetsTool } from '../../../../src/tools/registry/registry-search-datasets.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistrySearchDatasetsTool', () => {
  let tool: RegistrySearchDatasetsTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistrySearchDatasetsTool(registryService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_search_datasets');
    expect(definition.description).toContain('dataset');
  });

  it('should execute with query', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: false,
      count: 100,
      results: [
        { key: 'uuid-123', title: 'Test Dataset', type: 'OCCURRENCE' },
      ],
    };

    vi.spyOn(registryService, 'searchDatasets').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ q: 'birds' });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
    expect(registryService.searchDatasets).toHaveBeenCalled();
  });

  it('should handle type filter', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: true,
      count: 10,
      results: [],
    };

    vi.spyOn(registryService, 'searchDatasets').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ type: 'CHECKLIST' });
    expect(result.success).toBe(true);
    expect(registryService.searchDatasets).toHaveBeenCalled();
  });

  it('should reject invalid type', async () => {
    await expect(tool.execute({ type: 'INVALID' } as any)).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(registryService, 'searchDatasets').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ q: 'test' })).rejects.toThrow();
  });
});
