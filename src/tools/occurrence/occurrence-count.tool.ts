import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { OccurrenceSearchParams } from '../../types/gbif.types.js';

/**
 * Tool for counting occurrences matching filters without retrieving records
 */
export class OccurrenceCountTool extends BaseTool<OccurrenceSearchParams, number> {
  protected readonly name = 'gbif_occurrence_count';
  protected readonly description = 'Fast endpoint for counting occurrences matching filters without retrieving full records. Useful for statistics, dashboards, and filter validation before running full searches.';

  protected readonly inputSchema = z.object({
    // Text search
    q: z.string().optional().describe('Full-text search query'),
    scientificName: z.string().optional().describe('Scientific name to search for'),

    // Taxonomic filters
    taxonKey: z.number().optional().describe('GBIF taxon key'),
    kingdomKey: z.number().optional().describe('Kingdom taxon key'),
    phylumKey: z.number().optional().describe('Phylum taxon key'),
    classKey: z.number().optional().describe('Class taxon key'),
    orderKey: z.number().optional().describe('Order taxon key'),
    familyKey: z.number().optional().describe('Family taxon key'),
    genusKey: z.number().optional().describe('Genus taxon key'),

    // Geographic filters
    country: z.string().optional().describe('ISO country code'),
    continent: z
      .enum(['AFRICA', 'ANTARCTICA', 'ASIA', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTH_AMERICA'])
      .optional()
      .describe('Continent filter'),
    geometry: z.string().optional().describe('WKT geometry'),
    hasCoordinate: z.boolean().optional().describe('Filter to records with coordinates'),

    // Temporal filters
    year: z.string().optional().describe('Year or year range (e.g., "2020,2024")'),
    month: z.number().min(1).max(12).optional().describe('Month (1-12)'),

    // Dataset filters
    datasetKey: z.string().optional().describe('Dataset UUID'),
    publishingOrg: z.string().optional().describe('Publishing organization UUID'),

    // Array filters
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
    issue: z.array(z.string()).optional().describe('Data quality issues'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: OccurrenceSearchParams): Promise<any> {
    const count = await this.occurrenceService.count(input);

    return this.formatResponse(
      { count },
      {
        filters: {
          taxonKey: input.taxonKey,
          country: input.country,
          year: input.year,
          hasCoordinate: input.hasCoordinate,
        },
      }
    );
  }
}
