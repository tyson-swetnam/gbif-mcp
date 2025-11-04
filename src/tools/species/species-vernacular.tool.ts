import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';
import type { VernacularName, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for getting vernacular (common) names for a species
 */
export class SpeciesVernacularNamesTool extends BaseTool<
  { key: number; language?: string; limit?: number; offset?: number },
  GBIFResponse<VernacularName>
> {
  protected readonly name = 'gbif_species_vernacular_names';
  protected readonly description = 'Get vernacular (common) names for a species in multiple languages. Returns preferred names when available.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe('GBIF species key'),
    language: z
      .string()
      .length(2)
      .optional()
      .describe('ISO 639-1 language code filter (e.g., "en", "es", "fr")'),
    limit: z.number().min(1).max(1000).default(20).describe('Maximum number of names to return'),
    offset: z.number().min(0).default(0).describe('Pagination offset'),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: {
    key: number;
    language?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const response = await this.speciesService.getVernacularNames(
      input.key,
      input.language,
      { limit: input.limit, offset: input.offset }
    );

    return this.formatResponse(response, {
      key: input.key,
      language: input.language,
      count: response.results?.length || 0,
      totalCount: response.count,
    });
  }
}
