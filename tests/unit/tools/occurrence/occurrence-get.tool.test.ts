import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OccurrenceGetTool } from '../../../../src/tools/occurrence/occurrence-get.tool.js';
import { OccurrenceService } from '../../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('OccurrenceGetTool', () => {
  let tool: OccurrenceGetTool;
  let occurrenceService: OccurrenceService;

  beforeEach(() => {
    const client = new GBIFClient();
    occurrenceService = new OccurrenceService(client);
    tool = new OccurrenceGetTool(occurrenceService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_occurrence_get');
    expect(definition.description).toContain('occurrence');
  });

  it('should execute with valid key', async () => {
    const mockOccurrence = {
      key: 123456789,
      scientificName: 'Panthera leo',
      decimalLatitude: -1.5,
      decimalLongitude: 36.5,
      country: 'KE',
    };

    vi.spyOn(occurrenceService, 'getByKey').mockResolvedValue(mockOccurrence);

    const result = await tool.execute({ key: 123456789 });
    expect(result.scientificName).toBe('Panthera leo');
    expect(occurrenceService.getByKey).toHaveBeenCalledWith(123456789);
  });

  it('should reject invalid key type', async () => {
    await expect(tool.execute({ key: 'invalid' } as any)).rejects.toThrow();
  });

  it('should reject negative key', async () => {
    await expect(tool.execute({ key: -1 })).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(occurrenceService, 'getByKey').mockRejectedValue(
      new Error('Not found')
    );

    await expect(tool.execute({ key: 999999999 })).rejects.toThrow();
  });
});
