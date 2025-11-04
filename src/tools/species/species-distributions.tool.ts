import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';
import type { GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for getting geographic distribution information for a species
 */
export class SpeciesDistributionsTool extends BaseTool<
  { key: number; limit?: number; offset?: number },
  GBIFResponse<any>
> {
  protected readonly name = 'gbif_species_distributions';
  protected readonly description = 'Get known geographic distribution records for a species. Includes information about occurrence status, establishment means, and locality details.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe('GBIF species key. The unique identifier of the species whose geographic distribution you want to retrieve. Example: 5219404 (Panthera leo) returns distribution records showing where lions occur (e.g., sub-Saharan Africa), their establishment status (native/introduced), and occurrence status (present/absent/extinct). Includes both native and introduced ranges.'),
    limit: z.number().min(1).max(1000).default(20).describe('Maximum number of distribution records to return per page. A species may have distribution records for multiple regions/countries. Range: 1-1000, default: 20.'),
    offset: z.number().min(0).default(0).describe('Pagination offset. Determines the starting point for results. A limit of 20 and offset of 40 will get the third page of 20 results. Default: 0.'),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: {
    key: number;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const response = await this.speciesService.getDistributions(input.key, {
      limit: input.limit,
      offset: input.offset,
    });

    return this.formatResponse(response, {
      key: input.key,
      count: response.results?.length || 0,
      totalCount: response.count,
    });
  }
}
