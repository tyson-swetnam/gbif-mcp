import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { Dataset, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for listing datasets in a network
 */
export class RegistryNetworkDatasetsTool extends BaseTool<any, GBIFResponse<Dataset>> {
  protected readonly name = 'gbif_registry_network_datasets';
  protected readonly description = 'List all constituent datasets within a specific network. Shows which datasets are part of a collaborative network. Useful for exploring thematic data collections like eBird observations or marine biodiversity networks.';

  protected readonly inputSchema = z.object({
    networkKey: z.string().uuid().describe(
      'Network UUID. The unique identifier of the network whose constituent datasets you want to list. Get from gbif_registry_search_networks or gbif_registry_get_network.'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum number of datasets to return per page. Range: 1-1000, default: 20.'
    ),
    offset: z.number().min(0).default(0).describe(
      'Pagination offset. Number of datasets to skip. Default: 0.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: any): Promise<any> {
    const response = await this.registryService.getNetworkDatasets(
      input.networkKey,
      { limit: input.limit, offset: input.offset }
    );

    return this.formatResponse(response, {
      networkKey: input.networkKey,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
