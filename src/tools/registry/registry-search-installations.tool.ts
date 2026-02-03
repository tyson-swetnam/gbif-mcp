import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching IPT installations
 */
export class RegistrySearchInstallationsTool extends BaseTool<any, GBIFResponse<any>> {
  protected readonly name = 'gbif_registry_search_installations';
  protected readonly description = 'Search for IPT (Integrated Publishing Toolkit) installations in the GBIF network. IPTs are servers that host and publish biodiversity datasets. Use to find technical infrastructure and data hosting platforms.';

  protected readonly inputSchema = z.object({
    q: z.string().optional().describe(
      'Free text search query. Searches installation names and descriptions. Example: "herbarium IPT", "museum server".'
    ),
    type: z.string().optional().describe(
      'Installation type filter. Common values: IPT_INSTALLATION, DIGIR_INSTALLATION, TAPIR_INSTALLATION, BIOCASE_INSTALLATION. Most common: IPT_INSTALLATION.'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum installations to return per page. Range: 1-1000, default: 20.'
    ),
    offset: z.number().min(0).default(0).describe(
      'Pagination offset. Default: 0.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: any): Promise<any> {
    const response = await this.registryService.searchInstallations(input);

    return this.formatResponse(response, {
      query: input.q,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
