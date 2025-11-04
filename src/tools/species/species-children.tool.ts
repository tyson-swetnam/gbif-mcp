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
    key: z.number().int().positive().describe('Parent taxon GBIF key'),
    limit: z.number().min(1).max(1000).default(20).describe('Maximum number of children to return'),
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
