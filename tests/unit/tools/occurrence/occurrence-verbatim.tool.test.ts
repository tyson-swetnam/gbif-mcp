import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OccurrenceVerbatimTool } from '../../../../src/tools/occurrence/occurrence-verbatim.tool.js';
import { OccurrenceService } from '../../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('OccurrenceVerbatimTool', () => {
  let tool: OccurrenceVerbatimTool;
  let occurrenceService: OccurrenceService;

  beforeEach(() => {
    const client = new GBIFClient();
    occurrenceService = new OccurrenceService(client);
    tool = new OccurrenceVerbatimTool(occurrenceService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_occurrence_verbatim');
    expect(definition.description).toContain('occurrence');
  });

  it('should execute with valid key', async () => {
    const mockVerbatim = {
      key: 123456789,
      'http://rs.tdwg.org/dwc/terms/scientificName': 'Panthera leo',
      'http://rs.tdwg.org/dwc/terms/country': 'Kenya',
    };

    vi.spyOn(occurrenceService, 'getVerbatim').mockResolvedValue(mockVerbatim);

    const result: any = await tool.execute({ key: 123456789 });
    expect(result.success).toBe(true);
    expect(result.data.key).toBe(123456789);
    expect(occurrenceService.getVerbatim).toHaveBeenCalledWith(123456789);
  });

  it('should reject invalid key', async () => {
    await expect(tool.execute({ key: -1 })).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(occurrenceService, 'getVerbatim').mockRejectedValue(
      new Error('Not found')
    );

    await expect(tool.execute({ key: 1 })).rejects.toThrow();
  });
});
