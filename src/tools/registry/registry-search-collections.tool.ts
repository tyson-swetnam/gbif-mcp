import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching scientific collections in GRSciColl
 */
export class RegistrySearchCollectionsTool extends BaseTool<any, GBIFResponse<any>> {
  protected readonly name = 'gbif_registry_search_collections';
  protected readonly description = 'Search the Global Registry of Scientific Collections (GRSciColl) for natural history collections. Find museum collections, herbaria, tissue collections, and other scientific collections worldwide. Use to discover physical specimen holdings and their metadata.';

  protected readonly inputSchema = z.object({
    q: z.string().optional().describe(
      'Free text search across collection names, codes, and descriptions. Example: "herbarium", "mammal collection", "Smithsonian", "entomology".'
    ),
    code: z.string().optional().describe(
      'Collection code filter. The institutional code or acronym for the collection. Example: "USNM" (US National Museum), "K" (Kew Herbarium), "AMNH" (American Museum of Natural History).'
    ),
    institution: z.string().uuid().optional().describe(
      'Filter by parent institution UUID. Returns all collections belonging to a specific institution. Get institution UUIDs from gbif_registry_search_institutions.'
    ),
    country: z.string().length(2).optional().describe(
      'Filter by collection country. 2-letter ISO country code where the collection is physically located. Example: "US", "GB", "FR", "AU".'
    ),
    city: z.string().optional().describe(
      'Filter by city name where the collection is located. Example: "London", "Washington", "Paris", "Sydney".'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum collections to return per page. Range: 1-1000, default: 20.'
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
    const response = await this.registryService.searchCollections(input);

    return this.formatResponse(response, {
      query: input.q,
      country: input.country,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
