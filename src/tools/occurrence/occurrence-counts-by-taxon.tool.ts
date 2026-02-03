import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceSearchParams } from '../../types/gbif.types.js';

/**
 * Tool for getting occurrence counts by taxon key for taxonomic breakdown
 */
export class OccurrenceCountsByTaxonTool extends BaseTool<OccurrenceSearchParams, Record<string, number>> {
  protected readonly name = 'gbif_occurrence_counts_by_taxon';
  protected readonly description = 'Get occurrence counts broken down by taxon key for taxonomic composition analysis. Returns counts per child taxon showing species-level distribution. Useful for understanding biodiversity patterns, identifying dominant species, and analyzing taxonomic coverage within a higher taxon. Fast statistics for ecological analysis.';

  protected readonly inputSchema = z.object({
    taxonKey: z.number().optional().describe('Parent taxon to analyze. Example: 359 (genus Quercus) returns counts for each oak species'),
    country: z.string().length(2).optional().describe('Filter by country'),
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
    const counts = await this.occurrenceService.getCountsByTaxon(input);

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return this.formatResponse(counts, {
      filters: input,
      totalTaxa: Object.keys(counts).length,
      totalRecords,
    });
  }
}
