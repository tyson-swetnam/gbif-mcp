import { GBIFClient } from '../../core/gbif-client.js';
import type { Species, SpeciesSearchParams, GBIFResponse } from '../../types/gbif.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Service for interacting with GBIF Species API
 */
export class SpeciesService {
  private readonly client: GBIFClient;
  private readonly basePath = '/species';

  constructor(client: GBIFClient) {
    this.client = client;
  }

  /**
   * Search for species
   */
  async search(params: SpeciesSearchParams): Promise<GBIFResponse<Species>> {
    logger.info('Searching species', { params });

    const response = await this.client.get<GBIFResponse<Species>>(
      `${this.basePath}/search`,
      this.cleanParams(params)
    );

    return response;
  }

  /**
   * Get species by key
   */
  async getByKey(key: number): Promise<Species> {
    logger.info('Getting species by key', { key });

    const response = await this.client.get<Species>(
      `${this.basePath}/${key}`
    );

    return response;
  }

  /**
   * Get species suggestions
   */
  async suggest(q: string, limit = 10): Promise<Species[]> {
    logger.info('Getting species suggestions', { q, limit });

    const response = await this.client.get<Species[]>(
      `${this.basePath}/suggest`,
      { q, limit }
    );

    return response;
  }

  /**
   * Match species name
   */
  async match(name: string, strict = false): Promise<Species[]> {
    logger.info('Matching species name', { name, strict });

    const response = await this.client.get<any>(
      `${this.basePath}/match`,
      { name, strict }
    );

    // The match endpoint returns different structures based on confidence
    if (response.matchType === 'EXACT' || response.matchType === 'FUZZY') {
      return [response];
    } else if (response.alternatives) {
      return response.alternatives;
    } else {
      return [];
    }
  }

  /**
   * Get species children
   */
  async getChildren(key: number, offset = 0, limit = 20): Promise<GBIFResponse<Species>> {
    logger.info('Getting species children', { key, offset, limit });

    const response = await this.client.get<GBIFResponse<Species>>(
      `${this.basePath}/${key}/children`,
      { offset, limit }
    );

    return response;
  }

  /**
   * Get species parents
   */
  async getParents(key: number): Promise<Species[]> {
    logger.info('Getting species parents', { key });

    const response = await this.client.get<Species[]>(
      `${this.basePath}/${key}/parents`
    );

    return response;
  }

  /**
   * Get species synonyms
   */
  async getSynonyms(key: number, offset = 0, limit = 20): Promise<GBIFResponse<Species>> {
    logger.info('Getting species synonyms', { key, offset, limit });

    const response = await this.client.get<GBIFResponse<Species>>(
      `${this.basePath}/${key}/synonyms`,
      { offset, limit }
    );

    return response;
  }

  /**
   * Get species vernacular names
   */
  async getVernacularNames(key: number): Promise<any[]> {
    logger.info('Getting species vernacular names', { key });

    const response = await this.client.get<GBIFResponse<any>>(
      `${this.basePath}/${key}/vernacularNames`
    );

    return response.results || [];
  }

  /**
   * Get species distributions
   */
  async getDistributions(key: number): Promise<any[]> {
    logger.info('Getting species distributions', { key });

    const response = await this.client.get<GBIFResponse<any>>(
      `${this.basePath}/${key}/distributions`
    );

    return response.results || [];
  }

  /**
   * Get species media
   */
  async getMedia(key: number, offset = 0, limit = 20): Promise<GBIFResponse<any>> {
    logger.info('Getting species media', { key, offset, limit });

    const response = await this.client.get<GBIFResponse<any>>(
      `${this.basePath}/${key}/media`,
      { offset, limit }
    );

    return response;
  }

  /**
   * Clean parameters by removing undefined values
   */
  private cleanParams(params: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }
}