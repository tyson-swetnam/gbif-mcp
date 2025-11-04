import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceDownloadRequest, DownloadPredicate } from '../../types/gbif.types.js';

/**
 * Tool for requesting large occurrence data downloads (requires authentication)
 */
export class OccurrenceDownloadTool extends BaseTool<any, string> {
  protected readonly name = 'gbif_occurrence_download_request';
  protected readonly description = 'Request an asynchronous download for large occurrence datasets beyond pagination limits (100,000+ records). Returns a download key for checking status. REQUIRES AUTHENTICATION: Set GBIF_USERNAME and GBIF_PASSWORD environment variables.';

  protected readonly inputSchema = z.object({
    creator: z.string().min(1).describe('GBIF username (creator of the download)'),
    notificationAddresses: z
      .array(z.string().email())
      .optional()
      .describe('Email addresses to notify when download completes'),
    sendNotification: z.boolean().optional().default(true).describe('Send email notification on completion'),
    format: z
      .enum(['DWCA', 'SIMPLE_CSV', 'SPECIES_LIST'])
      .optional()
      .default('SIMPLE_CSV')
      .describe('Download format (DWCA=Darwin Core Archive, SIMPLE_CSV=Simple CSV, SPECIES_LIST=Species list only)'),
    predicate: z.any().describe(
      'Download predicate defining filters (REQUIRED). Complex JSON structure with type, key, value. Use buildPredicateFromSearch or construct manually.'
    ),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: any): Promise<any> {
    try {
      const downloadKey = await this.occurrenceService.requestDownload(input as OccurrenceDownloadRequest);

      return this.formatResponse(
        {
          downloadKey,
          message: 'Download request submitted successfully. Use gbif_occurrence_download_status to check progress.',
          checkStatusWith: {
            tool: 'gbif_occurrence_download_status',
            input: { downloadKey },
          },
        },
        {
          creator: input.creator,
          format: input.format,
          willNotify: input.sendNotification && input.notificationAddresses?.length,
        }
      );
    } catch (error: any) {
      // Provide helpful error message for auth issues
      if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        throw new Error(
          'Authentication required: Please set GBIF_USERNAME and GBIF_PASSWORD environment variables with valid GBIF credentials.'
        );
      }
      throw error;
    }
  }
}

/**
 * Helper tool for building download predicates from simple search parameters
 */
export class OccurrenceDownloadPredicateBuilderTool extends BaseTool<any, DownloadPredicate> {
  protected readonly name = 'gbif_occurrence_download_predicate_builder';
  protected readonly description = 'Helper tool to build a download predicate from simple search parameters. Converts occurrence search filters into the complex predicate format required by the download API.';

  protected readonly inputSchema = z.object({
    taxonKey: z.number().optional().describe('GBIF taxon key'),
    scientificName: z.string().optional().describe('Scientific name'),
    country: z.string().optional().describe('ISO country code'),
    year: z.string().optional().describe('Year or year range (e.g., "2020,2024")'),
    hasCoordinate: z.boolean().optional().describe('Filter to records with coordinates'),
    basisOfRecord: z
      .array(
        z.enum([
          'OBSERVATION',
          'HUMAN_OBSERVATION',
          'MACHINE_OBSERVATION',
          'MATERIAL_SAMPLE',
          'PRESERVED_SPECIMEN',
          'FOSSIL_SPECIMEN',
          'LIVING_SPECIMEN',
          'MATERIAL_CITATION',
          'OCCURRENCE',
        ])
      )
      .optional()
      .describe('Basis of record types'),
    datasetKey: z.string().optional().describe('Dataset UUID'),
    geometry: z.string().optional().describe('WKT geometry'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: any): Promise<any> {
    const predicate = this.occurrenceService.buildPredicateFromSearch(input);

    return this.formatResponse(
      {
        predicate,
        message: 'Use this predicate in gbif_occurrence_download_request',
        example: {
          tool: 'gbif_occurrence_download_request',
          input: {
            creator: 'your-gbif-username',
            format: 'SIMPLE_CSV',
            predicate: predicate,
          },
        },
      },
      { inputFilters: input }
    );
  }
}
