import { GBIFClient } from '../../core/gbif-client.js';
import type { Occurrence, OccurrenceSearchParams, GBIFResponse } from '../../types/gbif.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Service for interacting with GBIF Occurrence API
 */
export class OccurrenceService {
  private readonly client: GBIFClient;
  private readonly basePath = '/occurrence';

  constructor(client: GBIFClient) {
    this.client = client;
  }

  /**
   * Search for occurrences
   */
  async search(params: OccurrenceSearchParams): Promise<GBIFResponse<Occurrence>> {
    logger.info('Searching occurrences', { params });

    const response = await this.client.get<GBIFResponse<Occurrence>>(
      `${this.basePath}/search`,
      this.cleanParams(params)
    );

    return response;
  }

  /**
   * Get occurrence by key
   */
  async getByKey(key: number): Promise<Occurrence> {
    logger.info('Getting occurrence by key', { key });

    const response = await this.client.get<Occurrence>(
      `${this.basePath}/${key}`
    );

    return response;
  }

  /**
   * Get occurrence count
   */
  async count(params: OccurrenceSearchParams): Promise<number> {
    logger.info('Getting occurrence count', { params });

    const response = await this.client.get<number>(
      `${this.basePath}/count`,
      this.cleanParams(params)
    );

    return response;
  }

  /**
   * Download occurrences
   */
  async requestDownload(params: OccurrenceSearchParams): Promise<string> {
    logger.info('Requesting occurrence download', { params });

    const response = await this.client.post<{ downloadKey: string }>(
      `${this.basePath}/download/request`,
      {
        predicate: this.buildPredicate(params),
        format: 'DWCA',
      }
    );

    return response.downloadKey;
  }

  /**
   * Get download status
   */
  async getDownloadStatus(downloadKey: string): Promise<any> {
    logger.info('Getting download status', { downloadKey });

    const response = await this.client.get<any>(
      `${this.basePath}/download/${downloadKey}`
    );

    return response;
  }

  /**
   * Build predicate for download request
   */
  private buildPredicate(params: OccurrenceSearchParams): any {
    const predicates: any[] = [];

    if (params.taxonKey) {
      predicates.push({
        type: 'equals',
        key: 'TAXON_KEY',
        value: params.taxonKey,
      });
    }

    if (params.country) {
      predicates.push({
        type: 'equals',
        key: 'COUNTRY',
        value: params.country,
      });
    }

    if (params.year) {
      predicates.push({
        type: 'equals',
        key: 'YEAR',
        value: params.year,
      });
    }

    if (predicates.length === 0) {
      return { type: 'all' };
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
   * Clean parameters
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