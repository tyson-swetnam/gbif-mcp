import { GBIFClient } from '../../core/gbif-client.js';
import type { MapRequest } from '../../types/gbif.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Service for interacting with GBIF Maps API
 */
export class MapsService {
  private readonly client: GBIFClient;
  private readonly basePath = '/map/occurrence';

  constructor(client: GBIFClient) {
    this.client = client;
  }

  /**
   * Get map tile
   */
  async getTile(params: MapRequest): Promise<Buffer> {
    logger.info('Getting map tile', { params });

    const { z, x, y, format = 'png', ...queryParams } = params;

    const url = `${this.basePath}/density/${z}/${x}/${y}.${format}`;

    const response = await this.client.get<Buffer>(url, queryParams);

    return response;
  }

  /**
   * Get map capabilities
   */
  async getCapabilities(): Promise<any> {
    logger.info('Getting map capabilities');

    const response = await this.client.get<any>(`${this.basePath}/density/capabilities.json`);

    return response;
  }
}