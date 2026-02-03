import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OccurrenceDownloadStatusTool } from '../../../../src/tools/occurrence/occurrence-download-status.tool.js';
import { OccurrenceService } from '../../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('OccurrenceDownloadStatusTool', () => {
  let tool: OccurrenceDownloadStatusTool;
  let occurrenceService: OccurrenceService;

  beforeEach(() => {
    const client = new GBIFClient();
    occurrenceService = new OccurrenceService(client);
    tool = new OccurrenceDownloadStatusTool(occurrenceService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_occurrence_download_status');
    expect(definition.description).toContain('download');
  });

  it('should execute with valid download key', async () => {
    const mockStatus = {
      key: 'download-123',
      status: 'SUCCEEDED',
      downloadLink: 'https://api.gbif.org/v1/occurrence/download/download-123.zip',
      size: 1024000,
    };

    vi.spyOn(occurrenceService, 'getDownloadStatus').mockResolvedValue(mockStatus);

    const result: any = await tool.execute({ downloadKey: 'download-123' });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('SUCCEEDED');
    expect(occurrenceService.getDownloadStatus).toHaveBeenCalledWith('download-123');
  });

  it('should handle PREPARING status', async () => {
    const mockStatus = {
      key: 'download-456',
      status: 'PREPARING',
    };

    vi.spyOn(occurrenceService, 'getDownloadStatus').mockResolvedValue(mockStatus);

    const result: any = await tool.execute({ downloadKey: 'download-456' });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('PREPARING');
  });

  it('should reject empty download key', async () => {
    await expect(tool.execute({ downloadKey: '' })).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(occurrenceService, 'getDownloadStatus').mockRejectedValue(
      new Error('Download not found')
    );

    await expect(tool.execute({ downloadKey: 'invalid' })).rejects.toThrow();
  });
});
