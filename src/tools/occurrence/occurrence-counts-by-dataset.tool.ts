import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceSearchParams } from '../../types/gbif.types.js';

/**
 * Tool for getting occurrence counts by dataset
 */
export class OccurrenceCountsByDatasetTool extends BaseTool<OccurrenceSearchParams, Record<string, number>> {
  protected readonly name = 'gbif_occurrence_counts_by_dataset';
  protected readonly description = 'Get occurrence counts broken down by contributing dataset. Identifies which datasets contribute most records for a given query. Essential for data attribution, understanding data sources, finding primary datasets for a taxon/region, and acknowledging data providers. Returns dataset UUIDs with counts.';

  protected readonly inputSchema = z.object({
    taxonKey: z.number().optional().describe('Filter to specific taxon. Example: 5231190 (lions) to see which datasets have lion records'),
    country: z.string().length(2).optional().describe('Filter by occurrence country. Example: "KE" to see datasets with Kenyan data'),
    year: z.string().optional().describe('Filter by year or range. Example: "2020,2024"'),
    basisOfRecord: z.array(z.string()).optional().describe('Filter by record types'),
    hasCoordinate: z.boolean().optional().describe('Filter to georeferenced records'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: OccurrenceSearchParams): Promise<any> {
    const counts = await this.occurrenceService.getCountsByDataset(input);

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const topDatasets = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([dataset, count]) => ({ dataset, count }));

    return this.formatResponse(counts, {
      filters: input,
      totalDatasets: Object.keys(counts).length,
      totalRecords,
      topDatasets,
    });
  }
}
