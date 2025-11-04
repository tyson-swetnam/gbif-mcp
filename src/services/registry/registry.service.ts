import { GBIFClient } from '../../core/gbif-client.js';
import type { Dataset, Organization, GBIFResponse } from '../../types/gbif.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Service for interacting with GBIF Registry API
 */
export class RegistryService {
  private readonly client: GBIFClient;

  constructor(client: GBIFClient) {
    this.client = client;
  }

  /**
   * Search datasets
   */
  async searchDatasets(params: any): Promise<GBIFResponse<Dataset>> {
    logger.info('Searching datasets', { params });

    const response = await this.client.get<GBIFResponse<Dataset>>(
      '/dataset/search',
      params
    );

    return response;
  }

  /**
   * Get dataset by key
   */
  async getDataset(key: string): Promise<Dataset> {
    logger.info('Getting dataset', { key });

    const response = await this.client.get<Dataset>(`/dataset/${key}`);

    return response;
  }

  /**
   * Search organizations
   */
  async searchOrganizations(params: any): Promise<GBIFResponse<Organization>> {
    logger.info('Searching organizations', { params });

    const response = await this.client.get<GBIFResponse<Organization>>(
      '/organization',
      params
    );

    return response;
  }

  /**
   * Get organization by key
   */
  async getOrganization(key: string): Promise<Organization> {
    logger.info('Getting organization', { key });

    const response = await this.client.get<Organization>(`/organization/${key}`);

    return response;
  }
}