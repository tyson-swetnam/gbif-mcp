import { GBIFClient } from '../../core/gbif-client.js';
import type { Vocabulary, Concept, GBIFResponse } from '../../types/gbif.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Service for interacting with GBIF Vocabularies API
 */
export class VocabulariesService {
  private readonly client: GBIFClient;
  private readonly basePath = '/vocabularies';

  constructor(client: GBIFClient) {
    this.client = client;
  }

  /**
   * List vocabularies
   */
  async list(params?: any): Promise<GBIFResponse<Vocabulary>> {
    logger.info('Listing vocabularies', { params });

    const response = await this.client.get<GBIFResponse<Vocabulary>>(
      this.basePath,
      params
    );

    return response;
  }

  /**
   * Get vocabulary by name
   */
  async getByName(name: string): Promise<Vocabulary> {
    logger.info('Getting vocabulary', { name });

    const response = await this.client.get<Vocabulary>(
      `${this.basePath}/${name}`
    );

    return response;
  }

  /**
   * Get vocabulary concepts
   */
  async getConcepts(vocabularyName: string, params?: any): Promise<GBIFResponse<Concept>> {
    logger.info('Getting vocabulary concepts', { vocabularyName, params });

    const response = await this.client.get<GBIFResponse<Concept>>(
      `${this.basePath}/${vocabularyName}/concepts`,
      params
    );

    return response;
  }

  /**
   * Get concept by name
   */
  async getConcept(vocabularyName: string, conceptName: string): Promise<Concept> {
    logger.info('Getting concept', { vocabularyName, conceptName });

    const response = await this.client.get<Concept>(
      `${this.basePath}/${vocabularyName}/concepts/${conceptName}`
    );

    return response;
  }
}