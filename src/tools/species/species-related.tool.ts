import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';
import type { Species, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for getting related species (siblings and other related taxa)
 */
export class SpeciesRelatedTool extends BaseTool<{ key: number; limit?: number; offset?: number }, GBIFResponse<Species>> {
  protected readonly name = 'gbif_species_related';
  protected readonly description = 'Get related species including siblings (same parent taxon), variants, and associated taxa. Useful for taxonomic exploration, "see also" functionality, discovering similar species, and understanding taxonomic relationships. Returns species at the same taxonomic level with shared higher classification.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe(
      'GBIF species key. The species whose related taxa you want to find. Example: 5231190 (Panthera leo) returns other Panthera species like P. tigris, P. pardus, P. onca.'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum related species to return per page. Range: 1-1000, default: 20.'
    ),
    offset: z.number().min(0).default(0).describe(
      'Pagination offset for related species. Default: 0.'
    ),
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
    const response = await this.speciesService.getRelated(input.key, {
      limit: input.limit,
      offset: input.offset,
    });

    return this.formatResponse(response, {
      speciesKey: input.key,
      relatedCount: response.results?.length || 0,
      totalRelated: response.count,
    });
  }
}
