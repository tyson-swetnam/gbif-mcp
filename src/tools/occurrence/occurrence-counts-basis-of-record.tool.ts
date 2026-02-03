import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceSearchParams } from '../../types/gbif.types.js';

/**
 * Tool for getting occurrence counts broken down by basis of record
 */
export class OccurrenceCountsByBasisOfRecordTool extends BaseTool<OccurrenceSearchParams, Record<string, number>> {
  protected readonly name = 'gbif_occurrence_counts_by_basis_of_record';
  protected readonly description = 'Get occurrence counts broken down by basis of record type (observations, specimens, etc.). Returns a breakdown showing how many occurrences of each type match your filters. Essential for understanding dataset composition and data quality. Very fast - use for dashboards and quick statistics.';

  protected readonly inputSchema = z.object({
    taxonKey: z.number().optional().describe('Filter to specific taxon. Example: 5231190 (Panthera leo)'),
    country: z.string().length(2).optional().describe('Filter to country. Example: "KE" (Kenya)'),
    year: z.string().optional().describe('Filter by year or range. Example: "2020,2024"'),
    datasetKey: z.string().optional().describe('Filter to specific dataset UUID'),
    hasCoordinate: z.boolean().optional().describe('Filter to georeferenced records'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: OccurrenceSearchParams): Promise<any> {
    const counts = await this.occurrenceService.getCountsByBasisOfRecord(input);

    return this.formatResponse(counts, {
      filters: input,
      totalTypes: Object.keys(counts).length,
      totalRecords: Object.values(counts).reduce((sum, count) => sum + count, 0),
    });
  }
}
