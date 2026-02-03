import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { Network, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching GBIF dataset networks
 */
export class RegistrySearchNetworksTool extends BaseTool<any, GBIFResponse<Network>> {
  protected readonly name = 'gbif_registry_search_networks';
  protected readonly description = 'Search for dataset networks in GBIF. Networks are collaborative groups that organize related datasets (e.g., eBird, iNaturalist, Ocean Biodiversity Information System). Use to discover thematic data collections and partnerships.';

  protected readonly inputSchema = z.object({
    q: z.string().optional().describe(
      'Free text search query across network names and descriptions. Example: "eBird", "iNaturalist", "ocean", "herbarium network".'
    ),
    identifier: z.string().optional().describe(
      'Filter by network identifier. A unique identifier for the network. Example: network DOI or other persistent identifier.'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum number of networks to return per page. Range: 1-1000, default: 20.'
    ),
    offset: z.number().min(0).default(0).describe(
      'Pagination offset. Number of results to skip. Default: 0.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: any): Promise<any> {
    const response = await this.registryService.listNetworks(input);

    return this.formatResponse(response, {
      query: input.q,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
