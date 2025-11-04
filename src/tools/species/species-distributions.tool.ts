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
    key: z.number().int().positive().describe('GBIF species key'),
    limit: z.number().min(1).max(1000).default(20).describe('Maximum number of distribution records to return'),
    offset: z.number().min(0).default(0).describe('Pagination offset'),
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
