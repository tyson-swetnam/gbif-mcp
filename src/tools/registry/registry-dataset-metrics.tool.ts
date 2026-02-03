import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';

/**
 * Tool for getting dataset occurrence statistics and metrics
 */
export class RegistryDatasetMetricsTool extends BaseTool<{ key: string }, any> {
  protected readonly name = 'gbif_registry_dataset_metrics';
  protected readonly description = 'Get occurrence statistics and quality metrics for a dataset. Returns counts by basis of record, country, year, and data quality indicators. Useful for understanding dataset composition and coverage.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Dataset UUID. The unique identifier of the dataset whose metrics you want to retrieve. Example: "50c9509d-22c7-4a22-a47d-8c48425ef4a7". Get from gbif_registry_search_datasets or gbif_registry_get_dataset.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const metrics = await this.registryService.getDatasetMetrics(input.key);

    return this.formatResponse(metrics, {
      datasetKey: input.key,
      metricsAvailable: !!metrics,
    });
  }
}
