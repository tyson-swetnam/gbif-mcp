import { GBIFClient } from '../../core/gbif-client.js';
import { logger } from '../../utils/logger.js';
import type {
  Occurrence,
  OccurrenceSearchParams,
  OccurrenceDownloadRequest,
  OccurrenceDownload,
  DownloadPredicate,
  GBIFResponse,
  GBIFError,
} from '../../types/gbif.types.js';

/**
 * Occurrence Service
 *
 * Provides access to GBIF occurrence records - the core biodiversity observation data.
 * This service handles:
 * - Occurrence search with extensive filtering
 * - Single occurrence retrieval
 * - Occurrence counting and statistics
 * - Large dataset downloads (authenticated)
 * - Faceted search and aggregations
 */
export class OccurrenceService {
  private readonly client: GBIFClient;
  private readonly basePath = '/occurrence';

  constructor(client: GBIFClient) {
    this.client = client;
    logger.info('Occurrence service initialized');
  }

  /**
   * Search occurrence records
   *
   * Primary endpoint for searching and filtering occurrence records.
   * Supports extensive filtering by taxonomy, geography, time, data quality,
   * and dataset properties. Returns paginated results with optional facets.
   *
   * @param params - Search parameters with filters
   * @returns Paginated occurrence results with facets
   *
   * @example
   * ```typescript
   * const results = await occurrenceService.search({
   *   taxonKey: 2435099, // Puma concolor
   *   country: "US",
   *   hasCoordinate: true,
   *   year: "2020,2024",
   *   limit: 50,
   *   facet: ["basisOfRecord", "year"]
   * });
   * ```
   */
  async search(params: OccurrenceSearchParams): Promise<GBIFResponse<Occurrence>> {
    try {
      logger.info('Searching occurrences', { params });

      // Validate and sanitize parameters
      const searchParams = this.sanitizeSearchParams(params);

      // Warn about offset limit
      if (searchParams.offset && searchParams.offset >= 100000) {
        logger.warn('Offset exceeds GBIF limit of 100,000. Consider using download API for large datasets.');
      }

      const response = await this.client.get<GBIFResponse<Occurrence>>(
        `${this.basePath}/search`,
        searchParams
      );

      logger.info('Occurrence search completed', {
        resultCount: response.results?.length || 0,
        totalCount: response.count,
        offset: response.offset,
        facetCount: response.facets?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Occurrence search failed', { params, error });
      throw this.handleError(error, 'Failed to search occurrences');
    }
  }

  /**
   * Get single occurrence by key
   *
   * Retrieves complete details for a single occurrence record including
   * verbatim fields, interpretation history, media, and data quality issues.
   *
   * @param key - GBIF occurrence key
   * @returns Complete occurrence record
   *
   * @example
   * ```typescript
   * const occurrence = await occurrenceService.getByKey(1234567890);
   * console.log(occurrence.scientificName);
   * console.log(occurrence.decimalLatitude, occurrence.decimalLongitude);
   * ```
   */
  async getByKey(key: number): Promise<Occurrence> {
    try {
      logger.info('Fetching occurrence by key', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid occurrence key: must be a positive integer');
      }

      const occurrence = await this.client.get<Occurrence>(`${this.basePath}/${key}`);

      logger.info('Occurrence retrieved successfully', {
        key,
        scientificName: occurrence.scientificName,
        country: occurrence.country,
        year: occurrence.year,
      });

      return occurrence;
    } catch (error) {
      logger.error('Failed to get occurrence by key', { key, error });
      throw this.handleError(error, `Failed to get occurrence with key ${key}`);
    }
  }

  /**
   * Count occurrences matching filters
   *
   * Fast endpoint for getting occurrence counts without retrieving records.
   * Useful for statistics, dashboards, and filter validation.
   *
   * @param params - Filter parameters (same as search)
   * @returns Count of matching occurrences
   *
   * @example
   * ```typescript
   * const count = await occurrenceService.count({
   *   taxonKey: 2435099,
   *   country: "US",
   *   year: "2020,2024"
   * });
   * console.log(`Found ${count} mountain lion observations in US since 2020`);
   * ```
   */
  async count(params: OccurrenceSearchParams): Promise<number> {
    try {
      logger.info('Counting occurrences', { params });

      const searchParams = this.sanitizeSearchParams(params);

      // Remove pagination params for count
      delete searchParams.limit;
      delete searchParams.offset;

      const count = await this.client.get<number>(`${this.basePath}/count`, searchParams);

      logger.info('Occurrence count completed', { count });

      return count;
    } catch (error) {
      logger.error('Occurrence count failed', { params, error });
      throw this.handleError(error, 'Failed to count occurrences');
    }
  }

  /**
   * Request occurrence data download
   *
   * Requests an asynchronous download for large datasets beyond pagination limits.
   * Returns a download key for checking status. Requires authentication.
   *
   * IMPORTANT: This endpoint requires GBIF credentials (username/password).
   * Set GBIF_USERNAME and GBIF_PASSWORD environment variables.
   *
   * @param request - Download request with predicate and format
   * @returns Download key for status checking
   *
   * @example
   * ```typescript
   * const downloadKey = await occurrenceService.requestDownload({
   *   creator: "username",
   *   notificationAddresses: ["email@example.com"],
   *   sendNotification: true,
   *   format: "SIMPLE_CSV",
   *   predicate: {
   *     type: "and",
   *     predicates: [
   *       { type: "equals", key: "TAXON_KEY", value: "2435099" },
   *       { type: "equals", key: "COUNTRY", value: "US" },
   *       { type: "greaterThanOrEquals", key: "YEAR", value: "2020" }
   *     ]
   *   }
   * });
   * ```
   */
  async requestDownload(request: OccurrenceDownloadRequest): Promise<string> {
    try {
      logger.info('Requesting occurrence download', { request });

      // Validate download request
      if (!request.creator || request.creator.trim().length === 0) {
        throw new Error('Creator (username) is required for download requests');
      }

      if (!request.predicate) {
        throw new Error('Predicate is required for download requests');
      }

      // Default format to DWCA if not specified
      const downloadRequest = {
        ...request,
        format: request.format || 'DWCA',
      };

      const downloadKey = await this.client.post<string>(
        `${this.basePath}/download/request`,
        downloadRequest
      );

      logger.info('Download requested successfully', { downloadKey });

      return downloadKey;
    } catch (error) {
      logger.error('Download request failed', { request, error });
      throw this.handleError(error, 'Failed to request occurrence download');
    }
  }

  /**
   * Check download status
   *
   * Retrieves status and metadata for a download request.
   *
   * @param downloadKey - Download key from requestDownload
   * @returns Download status and metadata
   *
   * @example
   * ```typescript
   * const download = await occurrenceService.getDownloadStatus(downloadKey);
   * console.log(download.status); // "SUCCEEDED", "RUNNING", etc.
   * if (download.status === "SUCCEEDED") {
   *   console.log(download.downloadLink);
   *   console.log(`${download.totalRecords} records, ${download.size} bytes`);
   * }
   * ```
   */
  async getDownloadStatus(downloadKey: string): Promise<OccurrenceDownload> {
    try {
      logger.info('Checking download status', { downloadKey });

      if (!downloadKey || downloadKey.trim().length === 0) {
        throw new Error('Download key is required');
      }

      const download = await this.client.get<OccurrenceDownload>(
        `${this.basePath}/download/${downloadKey.trim()}`
      );

      logger.info('Download status retrieved', {
        downloadKey,
        status: download.status,
        totalRecords: download.totalRecords,
      });

      return download;
    } catch (error) {
      logger.error('Failed to get download status', { downloadKey, error });
      throw this.handleError(error, `Failed to get download status for ${downloadKey}`);
    }
  }

  /**
   * Get verbatim occurrence record
   *
   * Retrieves the original, unprocessed occurrence record as provided by
   * the publisher, before GBIF interpretation.
   *
   * @param key - GBIF occurrence key
   * @returns Verbatim occurrence record with original Darwin Core fields
   *
   * @example
   * ```typescript
   * const verbatim = await occurrenceService.getVerbatim(1234567890);
   * // Access original fields with Darwin Core URIs
   * console.log(verbatim.fields['http://rs.tdwg.org/dwc/terms/scientificName']);
   * ```
   */
  async getVerbatim(key: number): Promise<any> {
    try {
      logger.info('Fetching verbatim occurrence', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid occurrence key: must be a positive integer');
      }

      const verbatim = await this.client.get<any>(`${this.basePath}/${key}/verbatim`);

      logger.info('Verbatim occurrence retrieved', { key });

      return verbatim;
    } catch (error) {
      logger.error('Failed to get verbatim occurrence', { key, error });
      throw this.handleError(error, `Failed to get verbatim occurrence for key ${key}`);
    }
  }

  /**
   * Get occurrence fragment
   *
   * Retrieves the raw XML/JSON fragment from the original archive.
   * Useful for low-level debugging and format inspection.
   *
   * @param key - GBIF occurrence key
   * @returns Raw fragment data
   */
  async getFragment(key: number): Promise<string> {
    try {
      logger.info('Fetching occurrence fragment', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid occurrence key: must be a positive integer');
      }

      const fragment = await this.client.get<string>(`${this.basePath}/${key}/fragment`);

      logger.info('Occurrence fragment retrieved', { key });

      return fragment;
    } catch (error) {
      logger.error('Failed to get occurrence fragment', { key, error });
      throw this.handleError(error, `Failed to get fragment for occurrence ${key}`);
    }
  }

  /**
   * Build download predicate from search parameters
   *
   * Converts search parameters to download API predicate format.
   * Useful for creating download requests from existing searches.
   *
   * @param params - Occurrence search parameters
   * @returns Download predicate
   *
   * @example
   * ```typescript
   * const predicate = occurrenceService.buildPredicateFromSearch({
   *   taxonKey: 2435099,
   *   country: "US",
   *   year: "2020,2024",
   *   hasCoordinate: true
   * });
   * // Use in download request
   * ```
   */
  buildPredicateFromSearch(params: OccurrenceSearchParams): DownloadPredicate {
    const predicates: DownloadPredicate[] = [];

    // Taxonomic filters
    if (params.taxonKey) {
      predicates.push({ type: 'equals', key: 'TAXON_KEY', value: params.taxonKey.toString() });
    }
    if (params.scientificName) {
      predicates.push({ type: 'equals', key: 'SCIENTIFIC_NAME', value: params.scientificName });
    }
    if (params.kingdomKey) {
      predicates.push({ type: 'equals', key: 'KINGDOM_KEY', value: params.kingdomKey.toString() });
    }
    if (params.phylumKey) {
      predicates.push({ type: 'equals', key: 'PHYLUM_KEY', value: params.phylumKey.toString() });
    }
    if (params.classKey) {
      predicates.push({ type: 'equals', key: 'CLASS_KEY', value: params.classKey.toString() });
    }
    if (params.orderKey) {
      predicates.push({ type: 'equals', key: 'ORDER_KEY', value: params.orderKey.toString() });
    }
    if (params.familyKey) {
      predicates.push({ type: 'equals', key: 'FAMILY_KEY', value: params.familyKey.toString() });
    }
    if (params.genusKey) {
      predicates.push({ type: 'equals', key: 'GENUS_KEY', value: params.genusKey.toString() });
    }

    // Geographic filters
    if (params.country) {
      predicates.push({ type: 'equals', key: 'COUNTRY', value: params.country });
    }
    if (params.continent) {
      predicates.push({ type: 'equals', key: 'CONTINENT', value: params.continent });
    }
    if (params.hasCoordinate !== undefined) {
      predicates.push({ type: 'equals', key: 'HAS_COORDINATE', value: params.hasCoordinate.toString() });
    }
    if (params.geometry) {
      predicates.push({ type: 'within', geometry: params.geometry });
    }

    // Temporal filters
    if (params.year) {
      const yearRange = params.year.split(',');
      if (yearRange.length === 2) {
        predicates.push({ type: 'greaterThanOrEquals', key: 'YEAR', value: yearRange[0] });
        predicates.push({ type: 'lessThanOrEquals', key: 'YEAR', value: yearRange[1] });
      } else {
        predicates.push({ type: 'equals', key: 'YEAR', value: params.year });
      }
    }

    // Dataset filters
    if (params.datasetKey) {
      predicates.push({ type: 'equals', key: 'DATASET_KEY', value: params.datasetKey });
    }
    if (params.publishingOrg) {
      predicates.push({ type: 'equals', key: 'PUBLISHING_ORG', value: params.publishingOrg });
    }

    // Data quality filters
    if (params.hasGeospatialIssue !== undefined) {
      predicates.push({ type: 'equals', key: 'HAS_GEOSPATIAL_ISSUE', value: params.hasGeospatialIssue.toString() });
    }

    // Basis of record
    if (params.basisOfRecord && params.basisOfRecord.length > 0) {
      if (params.basisOfRecord.length === 1) {
        predicates.push({ type: 'equals', key: 'BASIS_OF_RECORD', value: params.basisOfRecord[0] });
      } else {
        predicates.push({ type: 'in', key: 'BASIS_OF_RECORD', values: params.basisOfRecord });
      }
    }

    // Build final predicate
    if (predicates.length === 0) {
      throw new Error('At least one filter is required for download predicate');
    } else if (predicates.length === 1) {
      return predicates[0];
    } else {
      return {
        type: 'and',
        predicates,
      };
    }
  }

  /**
   * Sanitize search parameters
   */
  private sanitizeSearchParams(params: OccurrenceSearchParams): Record<string, any> {
    const sanitized: Record<string, any> = {};

    // Text search
    if (params.q) sanitized.q = params.q.trim();
    if (params.scientificName) sanitized.scientificName = params.scientificName.trim();

    // Taxonomic keys
    if (params.taxonKey) sanitized.taxonKey = params.taxonKey;
    if (params.kingdomKey) sanitized.kingdomKey = params.kingdomKey;
    if (params.phylumKey) sanitized.phylumKey = params.phylumKey;
    if (params.classKey) sanitized.classKey = params.classKey;
    if (params.orderKey) sanitized.orderKey = params.orderKey;
    if (params.familyKey) sanitized.familyKey = params.familyKey;
    if (params.genusKey) sanitized.genusKey = params.genusKey;
    if (params.subgenusKey) sanitized.subgenusKey = params.subgenusKey;

    // Geographic filters
    if (params.country) sanitized.country = params.country;
    if (params.publishingCountry) sanitized.publishingCountry = params.publishingCountry;
    if (params.continent) sanitized.continent = params.continent;
    if (params.waterBody) sanitized.waterBody = params.waterBody;
    if (params.stateProvince) sanitized.stateProvince = params.stateProvince;
    if (params.geometry) sanitized.geometry = params.geometry;
    if (params.decimalLatitude) sanitized.decimalLatitude = params.decimalLatitude;
    if (params.decimalLongitude) sanitized.decimalLongitude = params.decimalLongitude;
    if (params.elevation) sanitized.elevation = params.elevation;
    if (params.depth) sanitized.depth = params.depth;

    // Boolean flags
    if (params.hasCoordinate !== undefined) sanitized.hasCoordinate = params.hasCoordinate;
    if (params.hasGeospatialIssue !== undefined) sanitized.hasGeospatialIssue = params.hasGeospatialIssue;
    if (params.repatriated !== undefined) sanitized.repatriated = params.repatriated;

    // Temporal filters
    if (params.year) sanitized.year = params.year;
    if (params.month) sanitized.month = params.month;
    if (params.decade) sanitized.decade = params.decade;

    // Dataset filters
    if (params.datasetKey) sanitized.datasetKey = params.datasetKey;
    if (params.publishingOrg) sanitized.publishingOrg = params.publishingOrg;
    if (params.institutionCode) sanitized.institutionCode = params.institutionCode;
    if (params.collectionCode) sanitized.collectionCode = params.collectionCode;
    if (params.catalogNumber) sanitized.catalogNumber = params.catalogNumber;
    if (params.recordedBy) sanitized.recordedBy = params.recordedBy;
    if (params.recordNumber) sanitized.recordNumber = params.recordNumber;

    // Array parameters
    if (params.basisOfRecord && params.basisOfRecord.length > 0) {
      sanitized.basisOfRecord = params.basisOfRecord;
    }
    if (params.typeStatus && params.typeStatus.length > 0) {
      sanitized.typeStatus = params.typeStatus;
    }
    if (params.issue && params.issue.length > 0) {
      sanitized.issue = params.issue;
    }
    if (params.mediaType && params.mediaType.length > 0) {
      sanitized.mediaType = params.mediaType;
    }

    // Faceting
    if (params.facet && params.facet.length > 0) {
      sanitized.facet = params.facet;
    }
    if (params.facetMincount) sanitized.facetMincount = params.facetMincount;
    if (params.facetMultiselect !== undefined) sanitized.facetMultiselect = params.facetMultiselect;

    // Pagination
    sanitized.limit = params.limit && params.limit > 0 ? Math.min(params.limit, 300) : 20;
    sanitized.offset = params.offset && params.offset >= 0 ? Math.min(params.offset, 100000) : 0;

    return sanitized;
  }

  /**
   * Validate occurrence key
   */
  private isValidKey(key: number): boolean {
    return Number.isInteger(key) && key > 0;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, message: string): Error {
    if ((error as GBIFError).statusCode) {
      const gbifError = error as GBIFError;
      return new Error(`${message}: ${gbifError.message || gbifError.error} (HTTP ${gbifError.statusCode})`);
    }
    return new Error(`${message}: ${error.message || 'Unknown error'}`);
  }
}