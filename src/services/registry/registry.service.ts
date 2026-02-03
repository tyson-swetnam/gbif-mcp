import { GBIFClient } from '../../core/gbif-client.js';
import { logger } from '../../utils/logger.js';
import type {
  Dataset,
  DatasetSearchParams,
  Organization,
  OrganizationSearchParams,
  Network,
  NetworkSearchParams,
  GBIFResponse,
  GBIFError,
} from '../../types/gbif.types.js';

/**
 * Registry Service
 *
 * Provides access to GBIF's registry of datasets, organizations, and networks.
 * The registry contains metadata about data publishers, their datasets, and
 * collaborative networks that organize biodiversity data.
 */
export class RegistryService {
  private readonly client: GBIFClient;
  private readonly datasetPath = '/dataset';
  private readonly organizationPath = '/organization';
  private readonly networkPath = '/network';

  constructor(client: GBIFClient) {
    this.client = client;
    logger.info('Registry service initialized');
  }

  /**
   * Search datasets in GBIF registry
   *
   * Search and filter published datasets by type, keyword, publisher,
   * geographic coverage, and other criteria.
   *
   * @param params - Search parameters
   * @returns Paginated list of matching datasets
   *
   * @example
   * ```typescript
   * const results = await registryService.searchDatasets({
   *   type: "OCCURRENCE",
   *   keyword: "bird",
   *   publishingCountry: "US",
   *   limit: 20
   * });
   * ```
   */
  async searchDatasets(params: DatasetSearchParams = {}): Promise<GBIFResponse<Dataset>> {
    try {
      logger.info('Searching datasets', { params });

      const searchParams = this.sanitizeDatasetSearchParams(params);

      const response = await this.client.get<GBIFResponse<Dataset>>(
        `${this.datasetPath}/search`,
        searchParams
      );

      logger.info('Dataset search completed', {
        resultCount: response.results?.length || 0,
        totalCount: response.count,
      });

      return response;
    } catch (error) {
      logger.error('Dataset search failed', { params, error });
      throw this.handleError(error, 'Failed to search datasets');
    }
  }

  /**
   * Get dataset by UUID
   *
   * Retrieves complete metadata for a single dataset including title,
   * description, contacts, endpoints, taxonomic coverage, and more.
   *
   * @param key - Dataset UUID
   * @returns Complete dataset record
   *
   * @example
   * ```typescript
   * const dataset = await registryService.getDataset("50c9509d-22c7-4a22-a47d-8c48425ef4a7");
   * console.log(dataset.title); // "eBird Observation Dataset"
   * ```
   */
  async getDataset(key: string): Promise<Dataset> {
    try {
      logger.info('Fetching dataset by key', { key });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid dataset key: must be a valid UUID');
      }

      const dataset = await this.client.get<Dataset>(`${this.datasetPath}/${key}`);

      logger.info('Dataset retrieved successfully', {
        key,
        title: dataset.title,
        type: dataset.type,
      });

      return dataset;
    } catch (error) {
      logger.error('Failed to get dataset by key', { key, error });
      throw this.handleError(error, `Failed to get dataset with key ${key}`);
    }
  }

  /**
   * Get dataset metrics
   *
   * Retrieves occurrence counts and statistics for a dataset broken down
   * by various dimensions (year, country, basis of record, etc.).
   *
   * @param key - Dataset UUID
   * @returns Dataset metrics including occurrence counts
   *
   * @example
   * ```typescript
   * const metrics = await registryService.getDatasetMetrics("50c9509d-22c7-4a22-a47d-8c48425ef4a7");
   * console.log(metrics.occurrenceCount); // 150000000
   * ```
   */
  async getDatasetMetrics(key: string): Promise<any> {
    try {
      logger.info('Fetching dataset metrics', { key });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid dataset key: must be a valid UUID');
      }

      const metrics = await this.client.get<any>(`${this.datasetPath}/${key}/metrics`);

      logger.info('Dataset metrics retrieved', {
        key,
        occurrenceCount: metrics.occurrenceCount,
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to get dataset metrics', { key, error });
      throw this.handleError(error, `Failed to get metrics for dataset ${key}`);
    }
  }

  /**
   * Search organizations
   *
   * Search data publishers and hosting organizations. Organizations are
   * the entities that publish datasets to GBIF.
   *
   * @param params - Search parameters
   * @returns Paginated list of matching organizations
   *
   * @example
   * ```typescript
   * const results = await registryService.searchOrganizations({
   *   country: "US",
   *   isEndorsed: true,
   *   limit: 20
   * });
   * ```
   */
  async searchOrganizations(params: OrganizationSearchParams = {}): Promise<GBIFResponse<Organization>> {
    try {
      logger.info('Searching organizations', { params });

      const searchParams = this.sanitizeOrganizationSearchParams(params);

      const response = await this.client.get<GBIFResponse<Organization>>(
        `${this.organizationPath}/search`,
        searchParams
      );

      logger.info('Organization search completed', {
        resultCount: response.results?.length || 0,
        totalCount: response.count,
      });

      return response;
    } catch (error) {
      logger.error('Organization search failed', { params, error });
      throw this.handleError(error, 'Failed to search organizations');
    }
  }

  /**
   * Get organization by UUID
   *
   * Retrieves complete information for a publishing or hosting organization
   * including contact details, endorsement status, and published datasets.
   *
   * @param key - Organization UUID
   * @returns Complete organization record
   *
   * @example
   * ```typescript
   * const org = await registryService.getOrganization("28eb1a3f-1c15-4a95-931a-4af90ecb574d");
   * console.log(org.title); // "Cornell Lab of Ornithology"
   * ```
   */
  async getOrganization(key: string): Promise<Organization> {
    try {
      logger.info('Fetching organization by key', { key });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid organization key: must be a valid UUID');
      }

      const organization = await this.client.get<Organization>(`${this.organizationPath}/${key}`);

      logger.info('Organization retrieved successfully', {
        key,
        title: organization.title,
        country: organization.country,
      });

      return organization;
    } catch (error) {
      logger.error('Failed to get organization by key', { key, error });
      throw this.handleError(error, `Failed to get organization with key ${key}`);
    }
  }

  /**
   * Get published datasets for an organization
   *
   * Lists all datasets published by a specific organization.
   *
   * @param key - Organization UUID
   * @param options - Pagination and filter options
   * @returns Paginated list of datasets
   *
   * @example
   * ```typescript
   * const datasets = await registryService.getOrganizationDatasets(
   *   "28eb1a3f-1c15-4a95-931a-4af90ecb574d",
   *   { type: "OCCURRENCE", limit: 50 }
   * );
   * ```
   */
  async getOrganizationDatasets(
    key: string,
    options: { type?: string; limit?: number; offset?: number } = {}
  ): Promise<GBIFResponse<Dataset>> {
    try {
      logger.info('Fetching organization datasets', { key, options });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid organization key: must be a valid UUID');
      }

      const params: Record<string, any> = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      if (options.type) params.type = options.type;

      const response = await this.client.get<GBIFResponse<Dataset>>(
        `${this.organizationPath}/${key}/publishedDataset`,
        params
      );

      logger.info('Organization datasets retrieved', {
        key,
        count: response.results?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get organization datasets', { key, options, error });
      throw this.handleError(error, `Failed to get datasets for organization ${key}`);
    }
  }

  /**
   * List networks
   *
   * List thematic networks of datasets. Networks group related datasets
   * around common themes or geographic regions.
   *
   * @param params - Search and pagination parameters
   * @returns Paginated list of networks
   *
   * @example
   * ```typescript
   * const networks = await registryService.listNetworks({
   *   q: "ocean",
   *   limit: 10
   * });
   * ```
   */
  async listNetworks(params: NetworkSearchParams = {}): Promise<GBIFResponse<Network>> {
    try {
      logger.info('Listing networks', { params });

      const searchParams = this.sanitizeNetworkSearchParams(params);

      const response = await this.client.get<GBIFResponse<Network>>(
        `${this.networkPath}/search`,
        searchParams
      );

      logger.info('Networks listed', {
        resultCount: response.results?.length || 0,
        totalCount: response.count,
      });

      return response;
    } catch (error) {
      logger.error('Failed to list networks', { params, error });
      throw this.handleError(error, 'Failed to list networks');
    }
  }

  /**
   * Get network by UUID
   *
   * Retrieves complete information for a dataset network including
   * description, constituent datasets, and contacts.
   *
   * @param key - Network UUID
   * @returns Complete network record
   *
   * @example
   * ```typescript
   * const network = await registryService.getNetwork("99d66b6c-9087-452f-a9d4-f15f2c2d0e7e");
   * console.log(network.title); // "OBIS - Ocean Biodiversity Information System"
   * ```
   */
  async getNetwork(key: string): Promise<Network> {
    try {
      logger.info('Fetching network by key', { key });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid network key: must be a valid UUID');
      }

      const network = await this.client.get<Network>(`${this.networkPath}/${key}`);

      logger.info('Network retrieved successfully', {
        key,
        title: network.title,
      });

      return network;
    } catch (error) {
      logger.error('Failed to get network by key', { key, error });
      throw this.handleError(error, `Failed to get network with key ${key}`);
    }
  }

  /**
   * Get network constituent datasets
   *
   * Lists all datasets that belong to a network.
   *
   * @param key - Network UUID
   * @param options - Pagination options
   * @returns Paginated list of datasets
   *
   * @example
   * ```typescript
   * const datasets = await registryService.getNetworkDatasets(
   *   "99d66b6c-9087-452f-a9d4-f15f2c2d0e7e",
   *   { limit: 50 }
   * );
   * ```
   */
  async getNetworkDatasets(
    key: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<GBIFResponse<Dataset>> {
    try {
      logger.info('Fetching network datasets', { key, options });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid network key: must be a valid UUID');
      }

      const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const response = await this.client.get<GBIFResponse<Dataset>>(
        `${this.networkPath}/${key}/constituents`,
        params
      );

      logger.info('Network datasets retrieved', {
        key,
        count: response.results?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get network datasets', { key, options, error });
      throw this.handleError(error, `Failed to get datasets for network ${key}`);
    }
  }

  /**
   * Sanitize dataset search parameters
   */
  private sanitizeDatasetSearchParams(params: DatasetSearchParams): Record<string, any> {
    const sanitized: Record<string, any> = {};

    // Simple parameters
    if (params.q) sanitized.q = params.q.trim();
    if (params.type) sanitized.type = params.type;
    if (params.subtype) sanitized.subtype = params.subtype;
    if (params.keyword) sanitized.keyword = params.keyword;
    if (params.publishingCountry) sanitized.publishingCountry = params.publishingCountry;
    if (params.publishingOrg) sanitized.publishingOrg = params.publishingOrg;
    if (params.hostingOrg) sanitized.hostingOrg = params.hostingOrg;
    if (params.decade) sanitized.decade = params.decade;
    if (params.license) sanitized.license = params.license;

    // Pagination
    sanitized.limit = params.limit && params.limit > 0 ? Math.min(params.limit, 1000) : 20;
    sanitized.offset = params.offset && params.offset >= 0 ? params.offset : 0;

    return sanitized;
  }

  /**
   * Sanitize organization search parameters
   */
  private sanitizeOrganizationSearchParams(params: OrganizationSearchParams): Record<string, any> {
    const sanitized: Record<string, any> = {};

    if (params.q) sanitized.q = params.q.trim();
    if (params.country) sanitized.country = params.country;
    if (params.isEndorsed !== undefined) sanitized.isEndorsed = params.isEndorsed;

    // Pagination
    sanitized.limit = params.limit && params.limit > 0 ? Math.min(params.limit, 1000) : 20;
    sanitized.offset = params.offset && params.offset >= 0 ? params.offset : 0;

    return sanitized;
  }

  /**
   * Sanitize network search parameters
   */
  private sanitizeNetworkSearchParams(params: NetworkSearchParams): Record<string, any> {
    const sanitized: Record<string, any> = {};

    if (params.q) sanitized.q = params.q.trim();

    // Pagination
    sanitized.limit = params.limit && params.limit > 0 ? Math.min(params.limit, 1000) : 20;
    sanitized.offset = params.offset && params.offset >= 0 ? params.offset : 0;

    return sanitized;
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Search IPT installations
   */
  async searchInstallations(params: any = {}): Promise<GBIFResponse<any>> {
    try {
      logger.info('Searching installations', { params });

      const response = await this.client.get<GBIFResponse<any>>(
        '/installation/search',
        params
      );

      logger.info('Installation search completed', {
        resultCount: response.results?.length || 0,
        totalCount: response.count,
      });

      return response;
    } catch (error) {
      logger.error('Installation search failed', { params, error });
      throw this.handleError(error, 'Failed to search installations');
    }
  }

  /**
   * Get installation by key
   */
  async getInstallation(key: string): Promise<any> {
    try {
      logger.info('Fetching installation by key', { key });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid installation key: must be a valid UUID');
      }

      const installation = await this.client.get<any>(`/installation/${key}`);

      logger.info('Installation retrieved successfully', {
        key,
        type: installation.type,
      });

      return installation;
    } catch (error) {
      logger.error('Failed to get installation', { key, error });
      throw this.handleError(error, `Failed to get installation with key ${key}`);
    }
  }

  /**
   * Search scientific collections (GRSciColl)
   */
  async searchCollections(params: any = {}): Promise<GBIFResponse<any>> {
    try {
      logger.info('Searching collections', { params });

      const response = await this.client.get<GBIFResponse<any>>(
        '/grscicoll/collection',
        params
      );

      logger.info('Collection search completed', {
        resultCount: response.results?.length || 0,
        totalCount: response.count,
      });

      return response;
    } catch (error) {
      logger.error('Collection search failed', { params, error });
      throw this.handleError(error, 'Failed to search collections');
    }
  }

  /**
   * Get collection by key (GRSciColl)
   */
  async getCollection(key: string): Promise<any> {
    try {
      logger.info('Fetching collection by key', { key });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid collection key: must be a valid UUID');
      }

      const collection = await this.client.get<any>(`/grscicoll/collection/${key}`);

      logger.info('Collection retrieved successfully', {
        key,
        code: collection.code,
        name: collection.name,
      });

      return collection;
    } catch (error) {
      logger.error('Failed to get collection', { key, error });
      throw this.handleError(error, `Failed to get collection with key ${key}`);
    }
  }

  /**
   * Search institutions (GRSciColl)
   */
  async searchInstitutions(params: any = {}): Promise<GBIFResponse<any>> {
    try {
      logger.info('Searching institutions', { params });

      const response = await this.client.get<GBIFResponse<any>>(
        '/grscicoll/institution',
        params
      );

      logger.info('Institution search completed', {
        resultCount: response.results?.length || 0,
        totalCount: response.count,
      });

      return response;
    } catch (error) {
      logger.error('Institution search failed', { params, error });
      throw this.handleError(error, 'Failed to search institutions');
    }
  }

  /**
   * Get institution by key (GRSciColl)
   */
  async getInstitution(key: string): Promise<any> {
    try {
      logger.info('Fetching institution by key', { key });

      if (!this.isValidUUID(key)) {
        throw new Error('Invalid institution key: must be a valid UUID');
      }

      const institution = await this.client.get<any>(`/grscicoll/institution/${key}`);

      logger.info('Institution retrieved successfully', {
        key,
        code: institution.code,
        name: institution.name,
      });

      return institution;
    } catch (error) {
      logger.error('Failed to get institution', { key, error });
      throw this.handleError(error, `Failed to get institution with key ${key}`);
    }
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