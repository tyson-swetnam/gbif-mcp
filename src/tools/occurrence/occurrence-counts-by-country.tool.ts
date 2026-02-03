import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceSearchParams } from '../../types/gbif.types.js';

/**
 * Tool for getting occurrence counts by country for geographic distribution analysis
 */
export class OccurrenceCountsByCountryTool extends BaseTool<OccurrenceSearchParams, Record<string, number>> {
  protected readonly name = 'gbif_occurrence_counts_by_country';
  protected readonly description = 'Get occurrence counts broken down by country for geographic distribution analysis. Returns counts per country showing global distribution patterns. Essential for understanding species ranges, identifying data gaps by region, and prioritizing conservation efforts. Fast statistics endpoint.';

  protected readonly inputSchema = z.object({
    taxonKey: z.number().optional().describe('Filter to specific taxon. Example: 5231190 (Panthera leo) to see lion distribution across countries'),
    year: z.string().optional().describe('Filter by year or range. Example: "2020,2024" for recent records only'),
    datasetKey: z.string().optional().describe('Filter to specific dataset to see its geographic coverage'),
    basisOfRecord: z.array(z.string()).optional().describe('Filter by record types'),
    hasCoordinate: z.boolean().optional().describe('Filter to georeferenced records only'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: OccurrenceSearchParams): Promise<any> {
    const counts = await this.occurrenceService.getCountsByCountry(input);

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const topCountries = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country]) => country);

    return this.formatResponse(counts, {
      filters: input,
      totalCountries: Object.keys(counts).length,
      totalRecords,
      topCountries,
    });
  }
}
