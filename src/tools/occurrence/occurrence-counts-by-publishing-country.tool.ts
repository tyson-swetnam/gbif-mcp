import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceSearchParams } from '../../types/gbif.types.js';

/**
 * Tool for getting occurrence counts by publishing country
 */
export class OccurrenceCountsByPublishingCountryTool extends BaseTool<OccurrenceSearchParams, Record<string, number>> {
  protected readonly name = 'gbif_occurrence_counts_by_publishing_country';
  protected readonly description = 'Get occurrence counts broken down by the country of the publishing organization. Shows which countries are contributing data, useful for understanding data provider distribution, identifying data collaboration opportunities, and analyzing global participation in GBIF. Different from occurrence country (where specimen was collected).';

  protected readonly inputSchema = z.object({
    taxonKey: z.number().optional().describe('Filter to specific taxon. Example: 212 (birds) to see which countries publish bird data'),
    country: z.string().length(2).optional().describe('Filter by occurrence country (where collected)'),
    year: z.string().optional().describe('Filter by year or range'),
    datasetKey: z.string().optional().describe('Filter to specific dataset'),
    hasCoordinate: z.boolean().optional().describe('Filter to georeferenced records'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: OccurrenceSearchParams): Promise<any> {
    const counts = await this.occurrenceService.getCountsByPublishingCountry(input);

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const topPublishers = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country]) => country);

    return this.formatResponse(counts, {
      filters: input,
      totalPublishingCountries: Object.keys(counts).length,
      totalRecords,
      topPublishers,
    });
  }
}
