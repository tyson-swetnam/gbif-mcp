import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { Dataset } from '../../types/gbif.types.js';

/**
 * Tool for getting detailed dataset information by UUID
 */
export class RegistryGetDatasetTool extends BaseTool<{ key: string }, Dataset> {
  protected readonly name = 'gbif_registry_get_dataset';
  protected readonly description = 'Get complete metadata for a specific GBIF dataset by its UUID. Returns full dataset details including title, description, contacts, endpoints, geographic/taxonomic coverage, and citation information.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Dataset UUID (universally unique identifier). A unique identifier for the dataset in GBIF registry. Example: "50c9509d-22c7-4a22-a47d-8c48425ef4a7" (GBIF Backbone Taxonomy). Get UUIDs from gbif_registry_search_datasets.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const dataset = await this.registryService.getDataset(input.key);

    return this.formatResponse(dataset, {
      datasetKey: input.key,
      title: dataset.title,
      type: dataset.type,
      recordCount: dataset.recordCount,
    });
  }
}
