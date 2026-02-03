import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { VocabulariesService } from '../../services/vocabularies/vocabularies.service.js';
import type { GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for listing all GBIF controlled vocabularies
 */
export class VocabulariesListTool extends BaseTool<Record<string, never>, GBIFResponse<any>> {
  protected readonly name = 'gbif_vocabularies_list';
  protected readonly description = 'List all controlled vocabularies used in GBIF. Vocabularies define valid values for fields like basisOfRecord, establishmentMeans, occurrenceStatus, etc. Essential for understanding valid filter values and data standardization.';

  protected readonly inputSchema = z.object({}).describe(
    'No input parameters required. Returns complete list of GBIF vocabularies with their concepts and definitions.'
  );

  private vocabulariesService: VocabulariesService;

  constructor(vocabulariesService: VocabulariesService) {
    super();
    this.vocabulariesService = vocabulariesService;
  }

  protected async run(_input: Record<string, never>): Promise<any> {
    const response = await this.vocabulariesService.list();

    return this.formatResponse(response, {
      totalVocabularies: response.count,
      availableVocabularies: response.results?.map(v => v.name) || [],
    });
  }
}
