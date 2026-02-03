import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { Organization, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching GBIF data publishers and organizations
 */
export class RegistrySearchOrganizationsTool extends BaseTool<any, GBIFResponse<Organization>> {
  protected readonly name = 'gbif_registry_search_organizations';
  protected readonly description = 'Search for data-publishing organizations in the GBIF network. Find museums, herbaria, research institutions, and other biodiversity data publishers. Use to discover data providers and understand institutional participation.';

  protected readonly inputSchema = z.object({
    q: z.string().optional().describe(
      'Free text search across organization names and descriptions. Searches in organization title, description, and abbreviations. Example: "Natural History Museum", "Smithsonian", "herbarium".'
    ),
    country: z.string().length(2).optional().describe(
      'Filter by organization country. 2-letter ISO country code where the organization is based. Example: "US" (United States), "GB" (United Kingdom), "AU" (Australia).'
    ),
    isEndorsed: z.boolean().optional().describe(
      'Filter by GBIF endorsement status. Set to true for GBIF-endorsed organizations (officially recognized data publishers), false for non-endorsed. Most data publishers are endorsed. Default: no filter (both endorsed and non-endorsed).'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum number of organizations to return per page. Range: 1-1000, default: 20.'
    ),
    offset: z.number().min(0).default(0).describe(
      'Pagination offset. Number of results to skip before returning results. Default: 0.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: any): Promise<any> {
    const response = await this.registryService.searchOrganizations(input);

    return this.formatResponse(response, {
      query: input.q,
      country: input.country,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
