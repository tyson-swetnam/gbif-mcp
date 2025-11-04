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
    q: z.string().optional().describe('Simple full-text search parameter. The value for this parameter can be a simple word or a phrase. Wildcards are not supported.'),
    scientificName: z.string().optional().describe('A scientific name from the GBIF backbone or the specified checklist. All included and synonym taxa are included in the search. Under the hood a call to the species match service is done first to retrieve a taxonKey. Only unique scientific names will return results, homonyms return nothing! Consider using the taxonKey parameter instead. Example: "Quercus robur". Parameter may be repeated.'),

    // Taxonomic filters
    taxonKey: z.number().optional().describe('A taxon key from the GBIF backbone or the specified checklist. All included (child) and synonym taxa are included in the search, so a search for Aves with taxonKey=212 will match all birds, no matter which species. Example: 2476674. Parameter may be repeated.'),
    kingdomKey: z.number().optional().describe('Kingdom taxon key from the GBIF backbone. All child taxa are included in the search. Example: 1 (for Animalia). Parameter may be repeated.'),
    phylumKey: z.number().optional().describe('Phylum taxon key from the GBIF backbone. All child taxa are included in the search. Example: 44 (for Chordata). Parameter may be repeated.'),
    classKey: z.number().optional().describe('Class taxon key from the GBIF backbone. All child taxa are included in the search. Example: 212 (for Aves - birds). Parameter may be repeated.'),
    orderKey: z.number().optional().describe('Order taxon key from the GBIF backbone. All child taxa are included in the search. Example: 729 (for Carnivora). Parameter may be repeated.'),
    familyKey: z.number().optional().describe('Family taxon key from the GBIF backbone. All child taxa are included in the search. Example: 9703 (for Felidae - cats). Parameter may be repeated.'),
    genusKey: z.number().optional().describe('Genus taxon key from the GBIF backbone. All child taxa are included in the search. Example: 2435194 (for Panthera). Parameter may be repeated.'),
    subgenusKey: z.number().optional().describe('Subgenus taxon key from the GBIF backbone. All child taxa are included in the search. Parameter may be repeated.'),

    // Geographic filters
    country: z.string().optional().describe('The 2-letter country code (as per ISO-3166-1) of the country in which the occurrence was recorded. Example: "US" (United States), "BR" (Brazil), "GB" (United Kingdom), "AF" (Afghanistan). Parameter may be repeated.'),
    publishingCountry: z.string().optional().describe('The 2-letter country code (as per ISO-3166-1) of the country where the publishing organization is based. Example: "DK" (Denmark). Parameter may be repeated.'),
    continent: z
      .enum(['AFRICA', 'ANTARCTICA', 'ASIA', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTH_AMERICA'])
      .optional()
      .describe('Continent, as defined in GBIF Continent vocabulary. Values: AFRICA, ANTARCTICA, ASIA, EUROPE, NORTH_AMERICA, OCEANIA, SOUTH_AMERICA. Example: "EUROPE". Parameter may be repeated.'),
    waterBody: z.string().optional().describe('The name of the water body in which the Location occurs. Example: "Baltic Sea", "Pacific Ocean", "Lake Victoria". Parameter may be repeated.'),
    stateProvince: z.string().optional().describe('The name of the next smaller administrative region than country (state, province, canton, department, region, etc.) in which the Location occurs. This term does not have data quality checks. Example: "Leicestershire", "California", "Queensland". Parameter may be repeated.'),
    geometry: z.string().optional().describe('Searches for occurrences inside a polygon described in Well Known Text (WKT) format. Only POLYGON and MULTIPOLYGON are accepted. Polygons must have anticlockwise ordering of points. Example: "POLYGON ((30.1 10.1, 40 40, 20 40, 10 20, 30.1 10.1))". Parameter may be repeated.'),
    decimalLatitude: z.string().optional().describe('Latitude in decimal degrees between -90° and 90° based on WGS 84. Supports range queries. Example: "40.5,45" (between 40.5 and 45 degrees).'),
    decimalLongitude: z.string().optional().describe('Longitude in decimals between -180 and 180 based on WGS 84. Supports range queries. Example: "-120,-95.5" (between -120 and -95.5 degrees).'),
    elevation: z.string().optional().describe('Elevation (altitude) in metres above sea level. Supports range queries. Example: "1000,1250" (between 1000 and 1250 meters). Parameter may be repeated or a range.'),
    depth: z.string().optional().describe('Depth in metres relative to altitude. For example 10 metres below a lake surface with given altitude. Supports range queries. Example: "10,20" (between 10 and 20 meters depth). Parameter may be repeated or a range.'),

    // Boolean flags
    hasCoordinate: z.boolean().optional().describe('Limits searches to occurrence records which contain a value in both latitude and longitude. Set to true to limit to records with coordinate values, false to limit to records without coordinate values. Example: true.'),
    hasGeospatialIssue: z.boolean().optional().describe('Limits searches to occurrence records which have spatial issues flagged (e.g., coordinates are invalid, out of range, country mismatch). Set to false to exclude records with geospatial issues, true to only include records with issues. Example: false.'),
    repatriated: z.boolean().optional().describe('Filters for records whose publishing country is different from the country where the record was recorded. Example: true to find specimens collected in one country but held in another.'),

    // Temporal filters
    year: z.string().optional().describe('The 4 digit year. A year of 98 will be interpreted as AD 98. Supports range queries. Example: 1998 (single year), "2015,2020" (range from 2015 to 2020). Parameter may be repeated or a range.'),
    month: z.number().min(1).max(12).optional().describe('The month of the year, starting with 1 for January. Supports range queries. Example: 5 (May), can also use range like "3,6" (March through June). Parameter may be repeated or a range.'),
    decade: z.number().optional().describe('Decade, calculated as year/10. For example, 199 represents the 1990s (1990-1999). Example: 199 (1990s), 200 (2000s). Parameter may be repeated.'),

    // Dataset filters
    datasetKey: z.string().optional().describe('The occurrence dataset key (a UUID). Example: "13b70480-bd69-11dd-b15f-b8a03c50a862". Parameter may be repeated.'),
    publishingOrg: z.string().optional().describe('The publishing organization\'s GBIF key (a UUID). Example: "e2e717bf-551a-4917-bdc9-4fa0f342c530". Parameter may be repeated.'),
    institutionCode: z.string().optional().describe('An identifier assigned by the source to identify the institution the record belongs to. Not guaranteed to be unique. Example: "K" (Royal Botanic Gardens, Kew). Parameter may be repeated.'),
    collectionCode: z.string().optional().describe('An identifier assigned by the source to identify the physical collection or digital dataset uniquely within the context of an institution. Example: "F" (Flora collection). Parameter may be repeated.'),
    catalogNumber: z.string().optional().describe('An identifier assigned by the source within a physical collection or digital dataset for the record which may not be unique, but should be fairly unique in combination with the institution and collection code. Example: "K001275042". Parameter may be repeated.'),
    recordedBy: z.string().optional().describe('The person who recorded the occurrence. Example: "Charles Darwin", "MiljoStyrelsen". Parameter may be repeated.'),
    recordNumber: z.string().optional().describe('An identifier given to the occurrence at the time it was recorded. Often serves as a link between field notes and an occurrence record. Example: "OPP 7101". Parameter may be repeated.'),

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
      .describe('Basis of record, as defined in GBIF BasisOfRecord vocabulary. Values: OBSERVATION (general observation), HUMAN_OBSERVATION (visual/aural observation by human), MACHINE_OBSERVATION (automated sensor), MATERIAL_SAMPLE (physical sample), PRESERVED_SPECIMEN (museum specimen), FOSSIL_SPECIMEN (fossilized specimen), LIVING_SPECIMEN (zoo/botanical garden), MATERIAL_CITATION (specimen cited in publication), OCCURRENCE (generic type). Example: "PRESERVED_SPECIMEN". Parameter may be repeated.'),
    typeStatus: z.array(z.string()).optional().describe('Nomenclatural type (type status, typified scientific name, publication) applied to the subject. Filters for type specimens. Example: "HOLOTYPE" (single specimen designated as the type), "PARATYPE" (additional specimens cited in the description), "SYNTYPE", "LECTOTYPE", etc. Parameter may be repeated.'),
    issue: z.array(z.string()).optional().describe('A specific interpretation issue as defined in GBIF OccurrenceIssue enumeration. Common values: COUNTRY_COORDINATE_MISMATCH, ZERO_COORDINATE, TAXON_MATCH_FUZZY, RECORDED_DATE_INVALID, COORDINATE_OUT_OF_RANGE, etc. Use to filter by data quality issues or to exclude problematic records. Example: "COUNTRY_COORDINATE_MISMATCH". Parameter may be repeated.'),
    mediaType: z.array(z.enum(['STILL_IMAGE', 'MOVING_IMAGE', 'SOUND'])).optional().describe('The kind of multimedia associated with an occurrence. Values: STILL_IMAGE (photos/illustrations), MOVING_IMAGE (videos), SOUND (audio recordings). Example: "STILL_IMAGE" to find occurrences with photographs. Parameter may be repeated.'),

    // Faceting
    facet: z.array(z.string()).optional().describe('A facet name used to retrieve the most frequent values for a field. Facets are allowed for all search parameters except geometry and geoDistance. This parameter may be repeated to request multiple facets. Example: ["datasetKey", "basisOfRecord"] to get counts by dataset and basis of record. Note: terms not available for searching are not available for faceting.'),
    facetMincount: z.number().min(1).optional().describe('Used in combination with the facet parameter. Set facetMincount={#} to exclude facets with a count less than {#}. Example: facetMincount=10000 to only show facet values appearing 10,000+ times.'),
    facetMultiselect: z.boolean().optional().describe('Used in combination with the facet parameter. Set facetMultiselect=true to still return counts for values that are not currently filtered. Useful for implementing multi-select faceted search interfaces.'),

    // Pagination
    offset: z.number().min(0).max(100000).default(0).describe('Determines the offset for the search results. A limit of 20 and offset of 40 will get the third page of 20 results. This service has a maximum offset of 100,000. Example: offset=300 to start at the 301st result.'),
    limit: z.number().min(1).max(300).default(20).describe('Controls the number of results in the page. Using too high a value will be overwritten with the maximum threshold, which is 300 for this service. Sensible defaults are used so this may be omitted. Example: limit=100 to get 100 results per page.'),
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
