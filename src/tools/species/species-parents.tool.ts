import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';
import type { TaxonParent } from '../../types/gbif.types.js';

/**
 * Tool for getting complete taxonomic classification path
 */
export class SpeciesParentsTool extends BaseTool<{ key: number }, TaxonParent[]> {
  protected readonly name = 'gbif_species_parents';
  protected readonly description = 'Get the complete taxonomic classification path from kingdom down to the specified taxon. Returns the full hierarchy including all parent taxa. Useful for breadcrumb navigation and understanding taxonomic position.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe('GBIF species/taxon key'),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: { key: number }): Promise<any> {
    const parents = await this.speciesService.getParents(input.key);

    return this.formatResponse(parents, {
      key: input.key,
      hierarchyLevels: parents.length,
      topLevel: parents.length > 0 ? parents[0].rank : undefined,
    });
  }
}
