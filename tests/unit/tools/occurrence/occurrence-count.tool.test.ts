import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OccurrenceCountTool } from '../../../../src/tools/occurrence/occurrence-count.tool.js';
import { OccurrenceService } from '../../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('OccurrenceCountTool', () => {
  let tool: OccurrenceCountTool;
  let occurrenceService: OccurrenceService;

  beforeEach(() => {
    const client = new GBIFClient();
    occurrenceService = new OccurrenceService(client);
    tool = new OccurrenceCountTool(occurrenceService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_occurrence_count');
    expect(definition.description).toContain('count');
  });

  it('should execute with valid filters', async () => {
    vi.spyOn(occurrenceService, 'count').mockResolvedValue(15000);

    const result = await tool.execute({ taxonKey: 5231190, country: 'US' });
    expect(result).toBe(15000);
    expect(occurrenceService.count).toHaveBeenCalled();
  });

  it('should handle zero count', async () => {
    vi.spyOn(occurrenceService, 'count').mockResolvedValue(0);

    const result = await tool.execute({ taxonKey: 999999 });
    expect(result).toBe(0);
  });

  it('should handle year range', async () => {
    vi.spyOn(occurrenceService, 'count').mockResolvedValue(500);

    await tool.execute({ year: '2020,2024' });
    expect(occurrenceService.count).toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    vi.spyOn(occurrenceService, 'count').mockRejectedValue(
      new Error('Service error')
    );

    await expect(tool.execute({ taxonKey: 1 })).rejects.toThrow();
  });
});
