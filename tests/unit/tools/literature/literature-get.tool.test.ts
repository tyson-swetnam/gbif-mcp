import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LiteratureGetTool } from '../../../../src/tools/literature/literature-get.tool.js';
import { LiteratureService } from '../../../../src/services/literature/literature.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('LiteratureGetTool', () => {
  let tool: LiteratureGetTool;
  let literatureService: LiteratureService;

  beforeEach(() => {
    const client = new GBIFClient();
    literatureService = new LiteratureService(client);
    tool = new LiteratureGetTool(literatureService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_literature_get');
  });

  it('should execute with DOI', async () => {
    const mockLiterature = {
      id: 123,
      title: 'Test Paper',
      year: 2024,
      doi: '10.1234/test',
    };

    vi.spyOn(literatureService, 'getByDoi').mockResolvedValue(mockLiterature);

    const result: any = await tool.execute({ doi: '10.1234/test' });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Test Paper');
  });

  it('should handle service errors', async () => {
    vi.spyOn(literatureService, 'getByDoi').mockRejectedValue(
      new Error('Not found')
    );

    await expect(tool.execute({ doi: '10.1234/test' })).rejects.toThrow();
  });
});
