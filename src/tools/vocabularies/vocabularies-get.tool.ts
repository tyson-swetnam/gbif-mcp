import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { VocabulariesService } from '../../services/vocabularies/vocabularies.service.js';

/**
 * Tool for getting a specific vocabulary with its concepts
 */
export class VocabulariesGetTool extends BaseTool<{ name: string }, any> {
  protected readonly name = 'gbif_vocabularies_get';
  protected readonly description = 'Get a specific controlled vocabulary with all its concepts and definitions. Returns the complete vocabulary including all valid values, descriptions, and usage notes. Use to understand valid values for specific GBIF fields.';

  protected readonly inputSchema = z.object({
    name: z.string().describe(
      'Vocabulary name. The identifier of the vocabulary to retrieve. Common vocabularies: "BasisOfRecord" (observation types), "EstablishmentMeans" (native/introduced status), "DegreeOfEstablishment" (invasion stages), "Pathway" (introduction routes), "OccurrenceStatus" (present/absent). Get names from gbif_vocabularies_list.'
    ),
  });

  private vocabulariesService: VocabulariesService;

  constructor(vocabulariesService: VocabulariesService) {
    super();
    this.vocabulariesService = vocabulariesService;
  }

  protected async run(input: { name: string }): Promise<any> {
    const vocabulary = await this.vocabulariesService.getByName(input.name);

    return this.formatResponse(vocabulary, {
      vocabularyName: input.name,
      label: vocabulary.label,
    });
  }
}
