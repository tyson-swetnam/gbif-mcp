import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';
import type { SpeciesSynonym, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for getting taxonomic synonyms for a species
 */
export class SpeciesSynonymsTool extends BaseTool<
  { key: number; limit?: number; offset?: number },
  GBIFResponse<SpeciesSynonym>
> {
  protected readonly name = 'gbif_species_synonyms';
  protected readonly description = 'Get all synonyms and alternative scientific names for a species. Useful for name resolution and historical name tracking.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe('GBIF species key. The unique identifier of the accepted species whose synonyms you want to retrieve. Example: 2435099 (Felis leo) shows that this is a synonym of Panthera leo, along with other historical names. Synonyms include both homotypic (same type specimen) and heterotypic (different type specimen) synonyms.'),
    limit: z.number().min(1).max(1000).default(20).describe('Maximum number of synonyms to return per page. Controls pagination. A species can have many historical synonyms. Range: 1-1000, default: 20.'),
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
    const response = await this.speciesService.getSynonyms(input.key, {
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
