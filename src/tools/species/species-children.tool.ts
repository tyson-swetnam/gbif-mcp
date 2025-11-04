import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';
import type { Species, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for getting direct taxonomic children of a taxon
 */
export class SpeciesChildrenTool extends BaseTool<
  { key: number; limit?: number; offset?: number },
  GBIFResponse<Species>
> {
  protected readonly name = 'gbif_species_children';
  protected readonly description = 'Get direct taxonomic children of a taxon (e.g., species under a genus, subspecies under a species). Useful for exploring taxonomy hierarchically.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe('Parent taxon GBIF key. The unique identifier of the parent taxon whose direct children you want to retrieve. Example: 5219173 (genus Panthera) returns species like P. leo, P. tigris, P. pardus, etc.'),
    limit: z.number().min(1).max(1000).default(20).describe('Maximum number of children to return per page. Controls pagination. Range: 1-1000, default: 20.'),
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
    const response = await this.speciesService.getChildren(input.key, {
      limit: input.limit,
      offset: input.offset,
    });

    return this.formatResponse(response, {
      parentKey: input.key,
      childCount: response.results?.length || 0,
      totalCount: response.count,
    });
  }
}
