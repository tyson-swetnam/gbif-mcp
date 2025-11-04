import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';
import type { GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for getting multimedia (images, sounds, videos) for a species
 */
export class SpeciesMediaTool extends BaseTool<
  { key: number; limit?: number; offset?: number },
  GBIFResponse<any>
> {
  protected readonly name = 'gbif_species_media';
  protected readonly description = 'Get associated multimedia records for a species including images, sounds, and videos. Returns URLs and metadata for media resources from various sources.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe('GBIF species key. The unique identifier of the species whose multimedia you want to retrieve. Example: 5219404 (Panthera leo) returns images, videos, and sound recordings of lions from sources like Wikimedia Commons, Encyclopedia of Life, iNaturalist, and other providers. Each media record includes URLs, license information, and attribution.'),
    limit: z.number().min(1).max(1000).default(20).describe('Maximum number of media records to return per page. A species can have many photos, videos, and sounds from various sources. Range: 1-1000, default: 20.'),
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
    const response = await this.speciesService.getMedia(input.key, {
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
