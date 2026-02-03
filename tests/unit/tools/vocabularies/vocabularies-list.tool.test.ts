import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VocabulariesListTool } from '../../../../src/tools/vocabularies/vocabularies-list.tool.js';
import { VocabulariesService } from '../../../../src/services/vocabularies/vocabularies.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('VocabulariesListTool', () => {
  let tool: VocabulariesListTool;
  let vocabulariesService: VocabulariesService;

  beforeEach(() => {
    const client = new GBIFClient();
    vocabulariesService = new VocabulariesService(client);
    tool = new VocabulariesListTool(vocabulariesService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_vocabularies_list');
    expect(definition.description).toContain('vocabularies');
  });

  it('should list vocabularies', async () => {
    const mockResult = {
      offset: 0,
      limit: 100,
      endOfRecords: true,
      count: 10,
      results: [
        { key: 1, name: 'BasisOfRecord', label: 'Basis of Record' },
        { key: 2, name: 'EstablishmentMeans', label: 'Establishment Means' },
      ],
    };

    vi.spyOn(vocabulariesService, 'list').mockResolvedValue(mockResult);

    const result: any = await tool.execute({});
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(2);
  });

  it('should handle service errors', async () => {
    vi.spyOn(vocabulariesService, 'list').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({})).rejects.toThrow();
  });
});
