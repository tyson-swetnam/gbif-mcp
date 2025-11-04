import { GBIFClient } from '../../core/gbif-client.js';
import { logger } from '../../utils/logger.js';
import type {
  Species,
  SpeciesSearchParams,
  SpeciesMatch,
  SpeciesMatchParams,
  SpeciesSuggest,
  VernacularName,
  SpeciesSynonym,
  TaxonParent,
  GBIFResponse,
  GBIFError,
} from '../../types/gbif.types.js';

/**
 * Species Service
 *
 * Provides access to GBIF's taxonomic backbone and species information.
 * This service handles all species-related API endpoints including:
 * - Species search and lookup
 * - Name matching and resolution
 * - Taxonomic hierarchy navigation
 * - Vernacular names and synonyms
 */
export class SpeciesService {
  private readonly client: GBIFClient;
  private readonly basePath = '/species';

  constructor(client: GBIFClient) {
    this.client = client;
    logger.info('Species service initialized');
  }

  /**
   * Search species in GBIF backbone taxonomy
   *
   * Full-text search across all name usages. Supports extensive filtering
   * by taxonomic rank, status, habitat, and nomenclatural properties.
   *
   * @param params - Search parameters
   * @returns Paginated list of matching species
   *
   * @example
   * ```typescript
   * const results = await speciesService.search({
   *   q: "Puma concolor",
   *   rank: "SPECIES",
   *   status: ["ACCEPTED"],
   *   limit: 20
   * });
   * ```
   */
  async search(params: SpeciesSearchParams): Promise<GBIFResponse<Species>> {
    try {
      logger.info('Searching species', { params });

      // Validate and sanitize parameters
      const searchParams = this.sanitizeSearchParams(params);

      const response = await this.client.get<GBIFResponse<Species>>(
        `${this.basePath}/search`,
        searchParams
      );

      logger.info('Species search completed', {
        query: params.q,
        resultCount: response.results?.length || 0,
        totalCount: response.count,
      });

      return response;
    } catch (error) {
      logger.error('Species search failed', { params, error });
      throw this.handleError(error, 'Failed to search species');
    }
  }

  /**
   * Get species by GBIF taxon key
   *
   * Retrieves complete information for a single taxon including classification,
   * nomenclatural status, references, and other metadata.
   *
   * @param key - GBIF taxon key (numeric)
   * @returns Complete species record
   *
   * @example
   * ```typescript
   * const species = await speciesService.getByKey(2435099); // Puma concolor
   * console.log(species.scientificName); // "Puma concolor (Linnaeus, 1771)"
   * ```
   */
  async getByKey(key: number): Promise<Species> {
    try {
      logger.info('Fetching species by key', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid species key: must be a positive integer');
      }

      const species = await this.client.get<Species>(`${this.basePath}/${key}`);

      logger.info('Species retrieved successfully', {
        key,
        scientificName: species.scientificName,
        rank: species.rank,
      });

      return species;
    } catch (error) {
      logger.error('Failed to get species by key', { key, error });
      throw this.handleError(error, `Failed to get species with key ${key}`);
    }
  }

  /**
   * Match scientific name to GBIF backbone
   *
   * Performs fuzzy matching of scientific names against the GBIF taxonomy.
   * Critical for data integration and name standardization. Supports
   * classification context to improve matching accuracy.
   *
   * @param params - Name matching parameters
   * @returns Match result with confidence score and match type
   *
   * @example
   * ```typescript
   * const match = await speciesService.match({
   *   name: "Puma concolor",
   *   kingdom: "Animalia"
   * });
   * console.log(match.matchType); // "EXACT"
   * console.log(match.confidence); // 97
   * ```
   */
  async match(params: SpeciesMatchParams): Promise<SpeciesMatch> {
    try {
      logger.info('Matching species name', { params });

      if (!params.name || params.name.trim().length === 0) {
        throw new Error('Name parameter is required for species matching');
      }

      const matchParams = this.sanitizeMatchParams(params);
      const match = await this.client.get<SpeciesMatch>(`${this.basePath}/match`, matchParams);

      logger.info('Species name matched', {
        inputName: params.name,
        matchedName: match.scientificName,
        matchType: match.matchType,
        confidence: match.confidence,
      });

      return match;
    } catch (error) {
      logger.error('Species name matching failed', { params, error });
      throw this.handleError(error, 'Failed to match species name');
    }
  }

  /**
   * Get autocomplete suggestions for species names
   *
   * Fast lookup for building autocomplete interfaces. Returns abbreviated
   * records optimized for quick display.
   *
   * @param query - Search query (minimum 3 characters recommended)
   * @param options - Optional filters
   * @returns Array of suggested species
   *
   * @example
   * ```typescript
   * const suggestions = await speciesService.suggest("Pum", { limit: 5 });
   * // Returns: [{ key: 2435098, scientificName: "Puma", rank: "GENUS" }, ...]
   * ```
   */
  async suggest(
    query: string,
    options: { datasetKey?: string; rank?: string; limit?: number } = {}
  ): Promise<SpeciesSuggest[]> {
    try {
      logger.info('Getting species suggestions', { query, options });

      if (!query || query.trim().length < 2) {
        throw new Error('Query must be at least 2 characters for suggestions');
      }

      const params: Record<string, any> = {
        q: query.trim(),
        limit: options.limit || 10,
      };

      if (options.datasetKey) params.datasetKey = options.datasetKey;
      if (options.rank) params.rank = options.rank;

      const suggestions = await this.client.get<SpeciesSuggest[]>(`${this.basePath}/suggest`, params);

      logger.info('Species suggestions retrieved', {
        query,
        count: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      logger.error('Failed to get species suggestions', { query, options, error });
      throw this.handleError(error, 'Failed to get species suggestions');
    }
  }

  /**
   * Get vernacular (common) names for a species
   *
   * Retrieves common names in multiple languages from various sources.
   * Includes preferred names when available.
   *
   * @param key - GBIF taxon key
   * @param language - Optional ISO 639-1 language code filter
   * @param options - Pagination options
   * @returns Paginated list of vernacular names
   *
   * @example
   * ```typescript
   * const names = await speciesService.getVernacularNames(2435099, "en");
   * // Returns: [{ vernacularName: "Mountain Lion", language: "en", preferred: true }, ...]
   * ```
   */
  async getVernacularNames(
    key: number,
    language?: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<GBIFResponse<VernacularName>> {
    try {
      logger.info('Fetching vernacular names', { key, language });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid species key: must be a positive integer');
      }

      const params: Record<string, any> = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      if (language) params.language = language;

      const response = await this.client.get<GBIFResponse<VernacularName>>(
        `${this.basePath}/${key}/vernacularNames`,
        params
      );

      logger.info('Vernacular names retrieved', {
        key,
        language,
        count: response.results?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get vernacular names', { key, language, error });
      throw this.handleError(error, `Failed to get vernacular names for species ${key}`);
    }
  }

  /**
   * Get synonyms for a species
   *
   * Lists all synonyms and alternative scientific names for a taxon.
   * Useful for name resolution and historical name tracking.
   *
   * @param key - GBIF taxon key
   * @param options - Pagination options
   * @returns Paginated list of synonyms
   *
   * @example
   * ```typescript
   * const synonyms = await speciesService.getSynonyms(2435099);
   * // Returns synonyms like "Felis concolor" with accepted name reference
   * ```
   */
  async getSynonyms(
    key: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<GBIFResponse<SpeciesSynonym>> {
    try {
      logger.info('Fetching species synonyms', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid species key: must be a positive integer');
      }

      const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const response = await this.client.get<GBIFResponse<SpeciesSynonym>>(
        `${this.basePath}/${key}/synonyms`,
        params
      );

      logger.info('Species synonyms retrieved', {
        key,
        count: response.results?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get species synonyms', { key, error });
      throw this.handleError(error, `Failed to get synonyms for species ${key}`);
    }
  }

  /**
   * Get direct taxonomic children
   *
   * Lists immediate children in the taxonomic hierarchy (e.g., species under
   * a genus, subspecies under a species).
   *
   * @param key - Parent taxon key
   * @param options - Pagination options
   * @returns Paginated list of child taxa
   *
   * @example
   * ```typescript
   * const children = await speciesService.getChildren(2435098); // Puma genus
   * // Returns: [{ key: 2435099, scientificName: "Puma concolor", rank: "SPECIES" }, ...]
   * ```
   */
  async getChildren(
    key: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<GBIFResponse<Species>> {
    try {
      logger.info('Fetching taxonomic children', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid species key: must be a positive integer');
      }

      const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const response = await this.client.get<GBIFResponse<Species>>(
        `${this.basePath}/${key}/children`,
        params
      );

      logger.info('Taxonomic children retrieved', {
        key,
        count: response.results?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get taxonomic children', { key, error });
      throw this.handleError(error, `Failed to get children for taxon ${key}`);
    }
  }

  /**
   * Get complete taxonomic classification path
   *
   * Returns the full hierarchy from kingdom down to the specified taxon.
   * Useful for breadcrumb navigation and classification display.
   *
   * @param key - GBIF taxon key
   * @returns Array of parent taxa from kingdom to parent
   *
   * @example
   * ```typescript
   * const parents = await speciesService.getParents(2435099); // Puma concolor
   * // Returns: [
   * //   { key: 1, scientificName: "Animalia", rank: "KINGDOM" },
   * //   { key: 44, scientificName: "Chordata", rank: "PHYLUM" },
   * //   ...
   * // ]
   * ```
   */
  async getParents(key: number): Promise<TaxonParent[]> {
    try {
      logger.info('Fetching taxonomic parents', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid species key: must be a positive integer');
      }

      const parents = await this.client.get<TaxonParent[]>(`${this.basePath}/${key}/parents`);

      logger.info('Taxonomic parents retrieved', {
        key,
        count: parents.length,
      });

      return parents;
    } catch (error) {
      logger.error('Failed to get taxonomic parents', { key, error });
      throw this.handleError(error, `Failed to get parents for taxon ${key}`);
    }
  }

  /**
   * Get descriptions for a species
   *
   * Retrieves textual descriptions from various sources.
   *
   * @param key - GBIF taxon key
   * @param options - Pagination options
   * @returns Paginated list of descriptions
   */
  async getDescriptions(
    key: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<GBIFResponse<any>> {
    try {
      logger.info('Fetching species descriptions', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid species key: must be a positive integer');
      }

      const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const response = await this.client.get<GBIFResponse<any>>(
        `${this.basePath}/${key}/descriptions`,
        params
      );

      logger.info('Species descriptions retrieved', {
        key,
        count: response.results?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get species descriptions', { key, error });
      throw this.handleError(error, `Failed to get descriptions for species ${key}`);
    }
  }

  /**
   * Get distribution information for a species
   *
   * Retrieves known geographic distribution records.
   *
   * @param key - GBIF taxon key
   * @param options - Pagination options
   * @returns Paginated list of distribution records
   */
  async getDistributions(
    key: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<GBIFResponse<any>> {
    try {
      logger.info('Fetching species distributions', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid species key: must be a positive integer');
      }

      const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const response = await this.client.get<GBIFResponse<any>>(
        `${this.basePath}/${key}/distributions`,
        params
      );

      logger.info('Species distributions retrieved', {
        key,
        count: response.results?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get species distributions', { key, error });
      throw this.handleError(error, `Failed to get distributions for species ${key}`);
    }
  }

  /**
   * Get media (images, sounds) for a species
   *
   * Retrieves associated multimedia records.
   *
   * @param key - GBIF taxon key
   * @param options - Pagination options
   * @returns Paginated list of media records
   */
  async getMedia(
    key: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<GBIFResponse<any>> {
    try {
      logger.info('Fetching species media', { key });

      if (!this.isValidKey(key)) {
        throw new Error('Invalid species key: must be a positive integer');
      }

      const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const response = await this.client.get<GBIFResponse<any>>(
        `${this.basePath}/${key}/media`,
        params
      );

      logger.info('Species media retrieved', {
        key,
        count: response.results?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get species media', { key, error });
      throw this.handleError(error, `Failed to get media for species ${key}`);
    }
  }

  /**
   * Sanitize search parameters
   */
  private sanitizeSearchParams(params: SpeciesSearchParams): Record<string, any> {
    const sanitized: Record<string, any> = {};

    // Simple parameters
    if (params.q) sanitized.q = params.q.trim();
    if (params.rank) sanitized.rank = params.rank;
    if (params.higherTaxonKey) sanitized.higherTaxonKey = params.higherTaxonKey;
    if (params.isExtinct !== undefined) sanitized.isExtinct = params.isExtinct;
    if (params.hl !== undefined) sanitized.hl = params.hl;
    if (params.facetMincount) sanitized.facetMincount = params.facetMincount;
    if (params.facetMultiselect !== undefined) sanitized.facetMultiselect = params.facetMultiselect;

    // Pagination
    sanitized.limit = params.limit && params.limit > 0 ? Math.min(params.limit, 300) : 20;
    sanitized.offset = params.offset && params.offset >= 0 ? params.offset : 0;

    // Array parameters
    if (params.status && params.status.length > 0) sanitized.status = params.status;
    if (params.habitat && params.habitat.length > 0) sanitized.habitat = params.habitat;
    if (params.threat && params.threat.length > 0) sanitized.threat = params.threat;
    if (params.nameType && params.nameType.length > 0) sanitized.nameType = params.nameType;
    if (params.datasetKey && params.datasetKey.length > 0) sanitized.datasetKey = params.datasetKey;
    if (params.nomenclaturalStatus && params.nomenclaturalStatus.length > 0) {
      sanitized.nomenclaturalStatus = params.nomenclaturalStatus;
    }
    if (params.issue && params.issue.length > 0) sanitized.issue = params.issue;
    if (params.facet && params.facet.length > 0) sanitized.facet = params.facet;

    return sanitized;
  }

  /**
   * Sanitize match parameters
   */
  private sanitizeMatchParams(params: SpeciesMatchParams): Record<string, any> {
    const sanitized: Record<string, any> = {
      name: params.name!.trim(),
    };

    if (params.rank) sanitized.rank = params.rank;
    if (params.kingdom) sanitized.kingdom = params.kingdom;
    if (params.phylum) sanitized.phylum = params.phylum;
    if (params.class) sanitized.class = params.class;
    if (params.order) sanitized.order = params.order;
    if (params.family) sanitized.family = params.family;
    if (params.genus) sanitized.genus = params.genus;
    if (params.strict !== undefined) sanitized.strict = params.strict;
    if (params.verbose !== undefined) sanitized.verbose = params.verbose;

    return sanitized;
  }

  /**
   * Validate taxon key
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