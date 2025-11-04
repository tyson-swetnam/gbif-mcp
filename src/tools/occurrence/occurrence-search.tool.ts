import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { OccurrenceService } from '../../services/occurrence/occurrence.service.js';
import type { Occurrence, OccurrenceSearchParams, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching occurrence records with extensive filtering
 */
export class OccurrenceSearchTool extends BaseTool<OccurrenceSearchParams, GBIFResponse<Occurrence>> {
  protected readonly name = 'gbif_occurrence_search';
  protected readonly description = 'Search GBIF occurrence records (species observations and specimens) with comprehensive filtering by taxonomy, geography, time, data quality, and more. Returns paginated results with optional facets for aggregations.';

  protected readonly inputSchema = z.object({
    // Text search
    q: z.string().optional().describe('Full-text search query across all fields'),
    scientificName: z.string().optional().describe('Scientific name to search for'),

    // Taxonomic filters
    taxonKey: z.number().optional().describe('GBIF taxon key (species or higher taxon)'),
    kingdomKey: z.number().optional().describe('Kingdom taxon key'),
    phylumKey: z.number().optional().describe('Phylum taxon key'),
    classKey: z.number().optional().describe('Class taxon key'),
    orderKey: z.number().optional().describe('Order taxon key'),
    familyKey: z.number().optional().describe('Family taxon key'),
    genusKey: z.number().optional().describe('Genus taxon key'),
    subgenusKey: z.number().optional().describe('Subgenus taxon key'),

    // Geographic filters
    country: z.string().optional().describe('ISO 3166-1 alpha-2 country code (e.g., "US", "BR")'),
    publishingCountry: z.string().optional().describe('Publishing organization country code'),
    continent: z
      .enum(['AFRICA', 'ANTARCTICA', 'ASIA', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTH_AMERICA'])
      .optional()
      .describe('Continent filter'),
    waterBody: z.string().optional().describe('Water body name'),
    stateProvince: z.string().optional().describe('State or province name'),
    geometry: z.string().optional().describe('WKT geometry for spatial filtering'),
    decimalLatitude: z.string().optional().describe('Latitude in decimal degrees (as string)'),
    decimalLongitude: z.string().optional().describe('Longitude in decimal degrees (as string)'),
    elevation: z.string().optional().describe('Elevation range in meters (e.g., "100,500")'),
    depth: z.string().optional().describe('Depth range in meters (e.g., "0,100")'),

    // Boolean flags
    hasCoordinate: z.boolean().optional().describe('Filter to records with coordinates'),
    hasGeospatialIssue: z.boolean().optional().describe('Filter to records with geospatial issues'),
    repatriated: z.boolean().optional().describe('Filter to repatriated records'),

    // Temporal filters
    year: z.string().optional().describe('Year or year range (e.g., "2020" or "2015,2020")'),
    month: z.number().min(1).max(12).optional().describe('Month (1-12)'),
    decade: z.number().optional().describe('Decade (e.g., 199 for 1990s, calculated as year/10)'),

    // Dataset filters
    datasetKey: z.string().optional().describe('Dataset UUID'),
    publishingOrg: z.string().optional().describe('Publishing organization UUID'),
    institutionCode: z.string().optional().describe('Institution code'),
    collectionCode: z.string().optional().describe('Collection code'),
    catalogNumber: z.string().optional().describe('Catalog number'),
    recordedBy: z.string().optional().describe('Collector name'),
    recordNumber: z.string().optional().describe('Record number'),

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
    typeStatus: z.array(z.string()).optional().describe('Type status values'),
    issue: z.array(z.string()).optional().describe('Data quality issues to filter by'),
    mediaType: z.array(z.enum(['STILL_IMAGE', 'MOVING_IMAGE', 'SOUND'])).optional().describe('Media type filters'),

    // Faceting
    facet: z.array(z.string()).optional().describe('Facet fields for aggregations (e.g., ["country", "year"])'),
    facetMincount: z.number().min(1).optional().describe('Minimum facet count to include'),
    facetMultiselect: z.boolean().optional().describe('Enable facet multiselect'),

    // Pagination
    offset: z.number().min(0).max(100000).default(0).describe('Pagination offset (max 100,000)'),
    limit: z.number().min(1).max(300).default(20).describe('Number of results to return (max 300)'),
  });

  private occurrenceService: OccurrenceService;

  constructor(occurrenceService: OccurrenceService) {
    super();
    this.occurrenceService = occurrenceService;
  }

  protected async run(input: OccurrenceSearchParams): Promise<any> {
    const results = await this.occurrenceService.search(input);

    // Build readable summary
    const summary = {
      query: input.q || input.scientificName || 'All occurrences',
      filters: {
        ...((input.taxonKey || input.country || input.year) && {
          taxonKey: input.taxonKey,
          country: input.country,
          year: input.year,
        }),
      },
      results: {
        count: results.results?.length || 0,
        totalCount: results.count,
        offset: results.offset,
        endOfRecords: results.endOfRecords,
      },
      facets: results.facets ? Object.keys(results.facets).length : 0,
    };

    return this.formatResponse(results, summary);
  }
}
