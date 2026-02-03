import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceSearchParams } from '../../types/gbif.types.js';

/**
 * Tool for getting occurrence counts by year for temporal trend analysis
 */
export class OccurrenceCountsByYearTool extends BaseTool<OccurrenceSearchParams, Record<string, number>> {
  protected readonly name = 'gbif_occurrence_counts_by_year';
  protected readonly description = 'Get occurrence counts broken down by year for temporal trend analysis. Returns year-by-year counts showing how observations have accumulated over time. Perfect for time series visualization, identifying data collection patterns, and understanding temporal coverage. Fast endpoint for dashboards.';

  protected readonly inputSchema = z.object({
    taxonKey: z.number().optional().describe('Filter to specific taxon and descendants. Example: 212 (all birds), 5231190 (lions only)'),
    country: z.string().length(2).optional().describe('Filter to specific country. Example: "US", "BR", "KE"'),
    datasetKey: z.string().optional().describe('Filter to specific dataset UUID'),
    basisOfRecord: z.array(z.string()).optional().describe('Filter by record types. Example: ["HUMAN_OBSERVATION", "PRESERVED_SPECIMEN"]'),
    hasCoordinate: z.boolean().optional().describe('Filter to records with coordinates'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: OccurrenceSearchParams): Promise<any> {
    const counts = await this.occurrenceService.getCountsByYear(input);

    const years = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return this.formatResponse(counts, {
      filters: input,
      yearRange: years.length > 0 ? `${years[0]}-${years[years.length - 1]}` : 'N/A',
      totalYears: years.length,
      totalRecords,
    });
  }
}
