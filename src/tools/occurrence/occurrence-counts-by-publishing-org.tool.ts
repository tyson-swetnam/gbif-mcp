import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceSearchParams } from '../../types/gbif.types.js';

/**
 * Tool for getting occurrence counts by publishing organization
 */
export class OccurrenceCountsByPublishingOrgTool extends BaseTool<OccurrenceSearchParams, Record<string, number>> {
  protected readonly name = 'gbif_occurrence_counts_by_publishing_org';
  protected readonly description = 'Get occurrence counts broken down by publishing organization UUID. Identifies which institutions are contributing the most data for a query. Essential for data attribution, understanding institutional contributions, acknowledging data providers, and analyzing organizational participation. Returns organization UUIDs with occurrence counts.';

  protected readonly inputSchema = z.object({
    taxonKey: z.number().optional().describe('Filter to specific taxon. Example: 212 (birds) to see which organizations publish bird data'),
    country: z.string().length(2).optional().describe('Filter by occurrence country'),
    year: z.string().optional().describe('Filter by year or range'),
    basisOfRecord: z.array(z.string()).optional().describe('Filter by record types'),
    hasCoordinate: z.boolean().optional().describe('Filter to georeferenced records'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: OccurrenceSearchParams): Promise<any> {
    const counts = await this.occurrenceService.getCountsByPublishingOrg(input);

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const topPublishers = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([org, count]) => ({ organizationKey: org, count }));

    return this.formatResponse(counts, {
      filters: input,
      totalOrganizations: Object.keys(counts).length,
      totalRecords,
      topPublishers,
    });
  }
}
