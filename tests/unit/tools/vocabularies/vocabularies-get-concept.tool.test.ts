import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VocabulariesGetConceptTool } from '../../../../src/tools/vocabularies/vocabularies-get-concept.tool.js';
import { VocabulariesService } from '../../../../src/services/vocabularies/vocabularies.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('VocabulariesGetConceptTool', () => {
  let tool: VocabulariesGetConceptTool;
  let vocabulariesService: VocabulariesService;

  beforeEach(() => {
    const client = new GBIFClient();
    vocabulariesService = new VocabulariesService(client);
    tool = new VocabulariesGetConceptTool(vocabulariesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_vocabularies_get_concept');
  });

  it('should get concept', async () => {
    const mockConcept = {
      name: 'HUMAN_OBSERVATION',
      label: 'Human Observation',
    };

    vi.spyOn(vocabulariesService, 'getConcept').mockResolvedValue(mockConcept);

    const result: any = await tool.execute({
      vocabulary: 'BasisOfRecord',
      concept: 'HUMAN_OBSERVATION',
    });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('HUMAN_OBSERVATION');
  });

  it('should handle service errors', async () => {
    vi.spyOn(vocabulariesService, 'getConcept').mockRejectedValue(
      new Error('Not found')
    );

    await expect(
      tool.execute({ vocabulary: 'Test', concept: 'Invalid' })
    ).rejects.toThrow();
  });
});
