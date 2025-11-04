import { GBIFClient } from '../../core/gbif-client.js';
import type { Literature, GBIFResponse } from '../../types/gbif.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Service for interacting with GBIF Literature API
 */
export class LiteratureService {
  private readonly client: GBIFClient;
  private readonly basePath = '/literature';

  constructor(client: GBIFClient) {
    this.client = client;
  }

  /**
   * Search literature
   */
  async search(params: any): Promise<GBIFResponse<Literature>> {
    logger.info('Searching literature', { params });

    const response = await this.client.get<GBIFResponse<Literature>>(
      `${this.basePath}/search`,
      params
    );

    return response;
  }

  /**
   * Get literature by DOI
   */
  async getByDoi(doi: string): Promise<Literature> {
    logger.info('Getting literature by DOI', { doi });

    const response = await this.client.get<Literature>(
      `${this.basePath}/${encodeURIComponent(doi)}`
    );

    return response;
  }
}