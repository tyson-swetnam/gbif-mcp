import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VocabulariesGetTool } from '../../../../src/tools/vocabularies/vocabularies-get.tool.js';
import { VocabulariesService } from '../../../../src/services/vocabularies/vocabularies.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('VocabulariesGetTool', () => {
  let tool: VocabulariesGetTool;
  let vocabulariesService: VocabulariesService;

  beforeEach(() => {
    const client = new GBIFClient();
    vocabulariesService = new VocabulariesService(client);
    tool = new VocabulariesGetTool(vocabulariesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_vocabularies_get');
  });

  it('should get vocabulary by name', async () => {
    const mockVocab = {
      key: 1,
      name: 'BasisOfRecord',
      label: 'Basis of Record',
    };

    vi.spyOn(vocabulariesService, 'getByName').mockResolvedValue(mockVocab);

    const result: any = await tool.execute({ name: 'BasisOfRecord' });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('BasisOfRecord');
  });

  it('should handle service errors', async () => {
    vi.spyOn(vocabulariesService, 'getByName').mockRejectedValue(
      new Error('Not found')
    );

    await expect(tool.execute({ name: 'Invalid' })).rejects.toThrow();
  });
});
