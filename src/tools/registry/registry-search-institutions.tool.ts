import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching institutions in GRSciColl
 */
export class RegistrySearchInstitutionsTool extends BaseTool<any, GBIFResponse<any>> {
  protected readonly name = 'gbif_registry_search_institutions';
  protected readonly description = 'Search for scientific institutions in the Global Registry of Scientific Collections (GRSciColl). Find museums, herbaria, universities, and research institutions that house natural history collections worldwide.';

  protected readonly inputSchema = z.object({
    q: z.string().optional().describe(
      'Free text search across institution names and descriptions. Searches in institution name, alternative names, and descriptions. Example: "Natural History Museum", "Smithsonian", "Botanischer Garten", "herbarium".'
    ),
    code: z.string().optional().describe(
      'Institution code filter. The institutional code or acronym. Example: "NMNH" (National Museum of Natural History), "NYBG" (New York Botanical Garden), "AMNH".'
    ),
    country: z.string().length(2).optional().describe(
      'Filter by institution country. 2-letter ISO country code where the institution is located. Example: "US" (United States), "GB" (United Kingdom), "BR" (Brazil), "AU" (Australia).'
    ),
    city: z.string().optional().describe(
      'Filter by city name where the institution is based. Example: "Washington", "London", "Paris", "Berlin", "Tokyo".'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum institutions to return per page. Range: 1-1000, default: 20.'
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
    const response = await this.registryService.searchInstitutions(input);

    return this.formatResponse(response, {
      query: input.q,
      country: input.country,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
