import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { LiteratureService } from '../../services/literature/literature.service.js';
import type { GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching scientific literature citing GBIF
 */
export class LiteratureSearchTool extends BaseTool<any, GBIFResponse<any>> {
  protected readonly name = 'gbif_literature_search';
  protected readonly description = 'Search scientific literature that cites GBIF data. Find peer-reviewed publications, reports, and papers that used GBIF-mediated data. Useful for understanding data impact, finding research examples, and tracking biodiversity research trends.';

  protected readonly inputSchema = z.object({
    q: z.string().optional().describe(
      'Free text search across titles, abstracts, and keywords. Example: "climate change", "species distribution modeling", "conservation", "invasive species".'
    ),
    year: z.string().optional().describe(
      'Publication year or range. Format: "2024" (single year) or "2020,2024" (range 2020-2024). Filters by the year the article was published.'
    ),
    topics: z.array(z.enum([
      'AGRICULTURE',
      'BIODIVERSITY_SCIENCE',
      'BIOGEOGRAPHY',
      'CITIZEN_SCIENCE',
      'CLIMATE_CHANGE',
      'CONSERVATION',
      'DATA_MANAGEMENT',
      'DATA_PAPER',
      'ECOLOGY',
      'ECOSYSTEM_SERVICES',
      'EVOLUTION',
      'FRESHWATER',
      'HUMAN_HEALTH',
      'INVASIVES',
      'MARINE',
      'PHYLOGENETICS',
      'SPECIES_DISTRIBUTIONS',
      'TAXONOMY',
    ])).optional().describe(
      'Filter by research topic. Select one or more topics. Common: BIODIVERSITY_SCIENCE, CONSERVATION, CLIMATE_CHANGE, ECOLOGY, TAXONOMY.'
    ),
    gbifDatasetKey: z.string().optional().describe(
      'Filter to literature citing a specific dataset. Dataset UUID. Shows papers that used data from a particular dataset.'
    ),
    publishingOrganizationKey: z.string().optional().describe(
      'Filter to literature citing data from a specific publisher. Organization UUID.'
    ),
    peerReview: z.boolean().optional().describe(
      'Filter by peer review status. Set true for peer-reviewed articles only, false for non-peer-reviewed. Default: no filter.'
    ),
    openAccess: z.boolean().optional().describe(
      'Filter by open access status. Set true for open access articles only. Default: no filter.'
    ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum articles to return per page. Range: 1-1000, default: 20.'
    ),
    offset: z.number().min(0).default(0).describe(
      'Pagination offset. Default: 0.'
    ),
  });

  private literatureService: LiteratureService;

  constructor(literatureService: LiteratureService) {
    super();
    this.literatureService = literatureService;
  }

  protected async run(input: any): Promise<any> {
    const response = await this.literatureService.search(input);

    return this.formatResponse(response, {
      query: input.q,
      year: input.year,
      topics: input.topics,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
