import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OccurrenceDownloadTool } from '../../../../src/tools/occurrence/occurrence-download.tool.js';
import { OccurrenceService } from '../../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('OccurrenceDownloadTool', () => {
  let tool: OccurrenceDownloadTool;
  let occurrenceService: OccurrenceService;

  beforeEach(() => {
    const client = new GBIFClient();
    occurrenceService = new OccurrenceService(client);
    tool = new OccurrenceDownloadTool(occurrenceService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_occurrence_download');
    expect(definition.description).toContain('download');
  });

  it('should execute with valid predicate', async () => {
    const mockDownload = {
      key: 'download-123',
      status: 'PREPARING',
    };

    // Mock the download request method (check actual service implementation)
    vi.spyOn(occurrenceService as any, 'requestDownload').mockResolvedValue(mockDownload);

    const predicate = {
      type: 'equals' as const,
      key: 'TAXON_KEY',
      value: '5231190',
    };

    const result = await tool.execute({ predicate });
    expect(result.status).toBe('PREPARING');
  });

  it('should handle AND predicates', async () => {
    const mockDownload = {
      key: 'download-456',
      status: 'PREPARING',
    };

    vi.spyOn(occurrenceService as any, 'requestDownload').mockResolvedValue(mockDownload);

    const predicate = {
      type: 'and' as const,
      predicates: [
        { type: 'equals' as const, key: 'TAXON_KEY', value: '5231190' },
        { type: 'equals' as const, key: 'COUNTRY', value: 'US' },
      ],
    };

    const result = await tool.execute({ predicate });
    expect(result).toBeDefined();
  });

  it('should handle service errors', async () => {
    vi.spyOn(occurrenceService as any, 'requestDownload').mockRejectedValue(
      new Error('Download request failed')
    );

    const predicate = {
      type: 'equals' as const,
      key: 'TAXON_KEY',
      value: '1',
    };

    await expect(tool.execute({ predicate })).rejects.toThrow();
  });
});
