import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';

/**
 * Tool for getting the verbatim (original) occurrence record
 */
export class OccurrenceVerbatimTool extends BaseTool<{ key: number }, any> {
  protected readonly name = 'gbif_occurrence_verbatim';
  protected readonly description = 'Get the original, unprocessed occurrence record as provided by the publisher, before GBIF interpretation. Includes all original Darwin Core fields with full URIs.';

  protected readonly inputSchema = z.object({
    key: z.number().int().positive().describe('GBIF occurrence key'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: { key: number }): Promise<any> {
    const verbatim = await this.occurrenceService.getVerbatim(input.key);

    return this.formatResponse(verbatim, {
      key: input.key,
      message: 'Original record with Darwin Core term URIs',
      note: 'Fields use full Darwin Core URIs (e.g., http://rs.tdwg.org/dwc/terms/scientificName)',
    });
  }
}
