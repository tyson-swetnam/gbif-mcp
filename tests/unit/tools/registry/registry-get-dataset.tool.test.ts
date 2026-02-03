import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryGetDatasetTool } from '../../../../src/tools/registry/registry-get-dataset.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistryGetDatasetTool', () => {
  let tool: RegistryGetDatasetTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistryGetDatasetTool(registryService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_get_dataset');
    expect(definition.description).toContain('dataset');
  });

  it('should execute with valid UUID', async () => {
    const datasetKey = '50c9509d-22c7-4a22-a47d-8c48425ef4a7';
    const mockDataset = {
      key: datasetKey,
      title: 'Test Dataset',
      type: 'OCCURRENCE',
      recordCount: 1000,
    };

    vi.spyOn(registryService, 'getDataset').mockResolvedValue(mockDataset);

    const result: any = await tool.execute({ key: datasetKey });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Test Dataset');
    expect(registryService.getDataset).toHaveBeenCalledWith(datasetKey);
  });

  it('should reject invalid UUID', async () => {
    await expect(tool.execute({ key: 'not-a-uuid' })).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    const validUuid = '50c9509d-22c7-4a22-a47d-8c48425ef4a7';
    vi.spyOn(registryService, 'getDataset').mockRejectedValue(
      new Error('Not found')
    );

    await expect(tool.execute({ key: validUuid })).rejects.toThrow();
  });
});
