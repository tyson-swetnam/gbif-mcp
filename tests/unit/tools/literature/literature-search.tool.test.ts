import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LiteratureSearchTool } from '../../../../src/tools/literature/literature-search.tool.js';
import { LiteratureService } from '../../../../src/services/literature/literature.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('LiteratureSearchTool', () => {
  let tool: LiteratureSearchTool;
  let literatureService: LiteratureService;

  beforeEach(() => {
    const client = new GBIFClient();
    literatureService = new LiteratureService(client);
    tool = new LiteratureSearchTool(literatureService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_literature_search');
    expect(definition.description).toContain('literature');
  });

  it('should execute search', async () => {
    const mockResult = {
      offset: 0,
      limit: 20,
      endOfRecords: false,
      count: 100,
      results: [
        { id: 123, title: 'Test Paper', year: 2024, doi: '10.1234/test' },
      ],
    };

    vi.spyOn(literatureService, 'search').mockResolvedValue(mockResult);

    const result: any = await tool.execute({ year: '2024' });
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(1);
  });

  it('should handle service errors', async () => {
    vi.spyOn(literatureService, 'search').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ q: 'test' })).rejects.toThrow();
  });
});
