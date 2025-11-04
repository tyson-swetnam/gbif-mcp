import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceDownload } from '../../types/gbif.types.js';

/**
 * Tool for checking download status and retrieving download metadata
 */
export class OccurrenceDownloadStatusTool extends BaseTool<{ downloadKey: string }, OccurrenceDownload> {
  protected readonly name = 'gbif_occurrence_download_status';
  protected readonly description = 'Check the status and retrieve metadata for an occurrence download request. Returns status, download link when ready, record count, and file size.';

  protected readonly inputSchema = z.object({
    downloadKey: z
      .string()
      .min(1)
      .describe('Download key returned from gbif_occurrence_download_request'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: { downloadKey: string }): Promise<any> {
    const download = await this.occurrenceService.getDownloadStatus(input.downloadKey);

    // Format status message based on download state
    let statusMessage = '';
    let nextSteps = '';

    switch (download.status) {
      case 'PREPARING':
        statusMessage = 'Download is being prepared. Please check again in a few moments.';
        nextSteps = 'Call this tool again to check progress.';
        break;
      case 'RUNNING':
        statusMessage = 'Download is currently running and processing records.';
        nextSteps = 'Call this tool again to check progress.';
        break;
      case 'SUCCEEDED':
        statusMessage = 'Download completed successfully! File is ready for download.';
        nextSteps = `Download from: ${download.downloadLink}`;
        break;
      case 'CANCELLED':
        statusMessage = 'Download was cancelled.';
        nextSteps = 'Submit a new download request if needed.';
        break;
      case 'FAILED':
        statusMessage = 'Download failed. Please check the request parameters and try again.';
        nextSteps = 'Review the download request and submit a new one.';
        break;
      case 'KILLED':
        statusMessage = 'Download was terminated.';
        nextSteps = 'Submit a new download request if needed.';
        break;
      case 'SUSPENDED':
        statusMessage = 'Download is suspended. Contact GBIF support.';
        nextSteps = 'Contact GBIF support for assistance.';
        break;
      default:
        statusMessage = `Download status: ${download.status}`;
        nextSteps = 'Check GBIF documentation for status details.';
    }

    const summary = {
      downloadKey: download.key,
      status: download.status,
      statusMessage,
      nextSteps,
      ...(download.status === 'SUCCEEDED' && {
        downloadLink: download.downloadLink,
        totalRecords: download.totalRecords,
        size: download.size ? `${(download.size / 1024 / 1024).toFixed(2)} MB` : undefined,
      }),
      created: download.created,
      modified: download.modified,
    };

    return this.formatResponse(download, summary);
  }
}
