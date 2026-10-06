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

    // GBIF has no `/literature/{doi}` route (`/literature/{id}` takes the internal UUID);
    // publications are looked up by DOI through the search endpoint's `doi` filter.
    const normalizedDoi = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:/i, '');
    const response = await this.client.get<GBIFResponse<Literature>>(
      `${this.basePath}/search`,
      { doi: normalizedDoi, limit: 1 }
    );

    const literature = response.results?.[0];
    if (!literature) {
      throw {
        error: 'NOT_FOUND',
        message: `No GBIF literature record found for DOI ${normalizedDoi}`,
        statusCode: 404,
      };
    }

    return literature;
  }
}