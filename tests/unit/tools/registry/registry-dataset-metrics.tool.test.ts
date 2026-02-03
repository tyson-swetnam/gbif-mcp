import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryDatasetMetricsTool } from '../../../../src/tools/registry/registry-dataset-metrics.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistryDatasetMetricsTool', () => {
  let tool: RegistryDatasetMetricsTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistryDatasetMetricsTool(registryService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_dataset_metrics');
    expect(definition.description).toContain('metrics');
  });

  it('should execute with valid UUID', async () => {
    const datasetKey = '50c9509d-22c7-4a22-a47d-8c48425ef4a7';
    const mockMetrics = {
      occurrenceCount: 1000,
      countByCountry: { US: 500, CA: 300 },
      countByYear: { 2023: 600, 2024: 400 },
    };

    vi.spyOn(registryService, 'getDatasetMetrics').mockResolvedValue(mockMetrics);

    const result: any = await tool.execute({ key: datasetKey });
    expect(result.success).toBe(true);
    expect(result.data.occurrenceCount).toBe(1000);
  });

  it('should reject invalid UUID', async () => {
    await expect(tool.execute({ key: 'invalid' })).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    const validUuid = '50c9509d-22c7-4a22-a47d-8c48425ef4a7';
    vi.spyOn(registryService, 'getDatasetMetrics').mockRejectedValue(
      new Error('Not found')
    );

    await expect(tool.execute({ key: validUuid })).rejects.toThrow();
  });
});
