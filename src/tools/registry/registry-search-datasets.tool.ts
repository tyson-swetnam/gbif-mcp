import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { Dataset, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching GBIF datasets
 */
export class RegistrySearchDatasetsTool extends BaseTool<any, GBIFResponse<Dataset>> {
  protected readonly name = 'gbif_registry_search_datasets';
  protected readonly description = 'Search for datasets in the GBIF registry. Find published datasets by type, keyword, publisher, geographic coverage, and taxonomic scope. Essential for discovering data sources and understanding dataset metadata.';

  protected readonly inputSchema = z.object({
    q: z.string().optional().describe(
      'Free text search query across dataset title, description, and metadata. Searches in dataset titles, descriptions, keywords, and publishing organization names. Example: "birds", "reef fish", "herbarium specimens".'
    ),
    type: z.enum(['OCCURRENCE', 'CHECKLIST', 'SAMPLING_EVENT', 'METADATA'])
      .optional()
      .describe(
        'Dataset type filter. OCCURRENCE (observation/specimen records with coordinates and dates), CHECKLIST (species lists without occurrences), SAMPLING_EVENT (structured surveys with effort data), METADATA (dataset descriptions only). Most common: OCCURRENCE.'
      ),
    keyword: z.string().optional().describe(
      'Filter by dataset keyword. Keywords are controlled vocabulary terms assigned to datasets. Example: "bird", "invasive species", "endangered species". Case-insensitive.'
    ),
    publishingOrg: z.string().optional().describe(
      'Filter by publishing organization UUID. Returns datasets published by a specific organization. Get organization UUIDs from gbif_registry_search_organizations. Example: "07f617d0-c688-11d8-bf62-b8a03c50a862" (GBIF Secretariat).'
    ),
    publishingCountry: z.string().length(2).optional().describe(
      'Filter by publishing organization country. 2-letter ISO country code. Example: "US" (United States), "GB" (United Kingdom), "BR" (Brazil). Returns datasets published by organizations in that country.'
    ),
    hostingOrg: z.string().optional().describe(
      'Filter by hosting organization UUID. The organization that hosts the data infrastructure (may differ from publisher). Example: UUID of a data center or aggregator.'
    ),
    decade: z.string().optional().describe(
      'Filter by decade of temporal coverage. Format: "1980,1990" for data from the 1980s and 1990s. Filters datasets by the decade their occurrence records cover, not publication date.'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum number of datasets to return per page. Range: 1-1000, default: 20. Use with offset for pagination through large result sets.'
    ),
    offset: z.number().min(0).default(0).describe(
      'Pagination offset. Number of results to skip. A limit of 20 and offset of 40 will get the third page. Default: 0. Maximum offset varies by endpoint.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: any): Promise<any> {
    const response = await this.registryService.searchDatasets(input);

    return this.formatResponse(response, {
      query: input.q,
      type: input.type,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
