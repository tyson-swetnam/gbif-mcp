import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';

/**
 * Tool for getting quick occurrence statistics for a species
 */
export class SpeciesMetricsTool extends BaseTool<{ key: number }, any> {
  protected readonly name = 'gbif_species_metrics';
  protected readonly description = 'Get quick occurrence statistics for a species without running full searches. Returns total occurrence count, dataset count, country count, and basis of record breakdown. Fast endpoint perfect for species profile pages, dashboards, and quick data availability checks.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe(
      'GBIF species key. The unique identifier of the species whose metrics you want. Example: 5231190 (Panthera leo) returns occurrence count, geographic spread, and data quality metrics.'
    ),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: { key: number }): Promise<any> {
    const metrics = await this.speciesService.getMetrics(input.key);

    return this.formatResponse(metrics, {
      speciesKey: input.key,
      hasOccurrences: (metrics.occurrenceCount || 0) > 0,
      dataAvailable: !!metrics,
    });
  }
}
