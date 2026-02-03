import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { VocabulariesService } from '../../services/vocabularies/vocabularies.service.js';

/**
 * Tool for getting a single concept from a vocabulary
 */
export class VocabulariesGetConceptTool extends BaseTool<{ vocabulary: string; concept: string }, any> {
  protected readonly name = 'gbif_vocabularies_get_concept';
  protected readonly description = 'Get detailed information about a specific concept within a controlled vocabulary. Returns the concept definition, usage notes, related terms, and examples. Use to understand the precise meaning and usage of specific vocabulary terms.';

  protected readonly inputSchema = z.object({
    vocabulary: z.string().describe(
      'Vocabulary name. The controlled vocabulary containing the concept. Example: "BasisOfRecord", "EstablishmentMeans", "DegreeOfEstablishment". Get from gbif_vocabularies_list.'
    ),
    concept: z.string().describe(
      'Concept name within the vocabulary. The specific term to look up. Examples: For BasisOfRecord: "HUMAN_OBSERVATION", "PRESERVED_SPECIMEN". For EstablishmentMeans: "NATIVE", "INTRODUCED", "NATURALISED". Case-sensitive.'
    ),
  });

  private vocabulariesService: VocabulariesService;

  constructor(vocabulariesService: VocabulariesService) {
    super();
    this.vocabulariesService = vocabulariesService;
  }

  protected async run(input: { vocabulary: string; concept: string }): Promise<any> {
    const concept = await this.vocabulariesService.getConcept(input.vocabulary, input.concept);

    return this.formatResponse(concept, {
      vocabulary: input.vocabulary,
      conceptName: input.concept,
    });
  }
}
