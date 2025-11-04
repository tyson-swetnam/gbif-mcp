import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { Occurrence } from '../../types/gbif.types.js';

/**
 * Tool for getting a single occurrence record by key
 */
export class OccurrenceGetTool extends BaseTool<{ key: number }, Occurrence> {
  protected readonly name = 'gbif_occurrence_get';
  protected readonly description = 'Get complete details for a single occurrence record including verbatim fields, interpretation history, media, and data quality issues.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe('GBIF occurrence key (unique identifier)'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: { key: number }): Promise<any> {
    const occurrence = await this.occurrenceService.getByKey(input.key);

    const summary = {
      key: occurrence.key,
      scientificName: occurrence.scientificName,
      location: occurrence.country
        ? {
            country: occurrence.country,
            coordinates: occurrence.decimalLatitude && occurrence.decimalLongitude
              ? {
                  lat: occurrence.decimalLatitude,
                  lon: occurrence.decimalLongitude,
                }
              : undefined,
          }
        : undefined,
      date: occurrence.eventDate || occurrence.year,
      basisOfRecord: occurrence.basisOfRecord,
      datasetKey: occurrence.datasetKey,
      issues: occurrence.issues?.length || 0,
    };

    return this.formatResponse(occurrence, summary);
  }
}
