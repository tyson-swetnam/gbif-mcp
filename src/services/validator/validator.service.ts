import { GBIFClient } from '../../core/gbif-client.js';
import type { ValidationResult } from '../../types/gbif.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Service for interacting with GBIF Validator API
 */
export class ValidatorService {
  private readonly client: GBIFClient;
  private readonly basePath = '/validator';

  constructor(client: GBIFClient) {
    this.client = client;
  }

  /**
   * Validate a Darwin Core Archive
   */
  async validateDwca(fileUrl: string): Promise<ValidationResult> {
    logger.info('Validating DwCA', { fileUrl });

    const response = await this.client.post<ValidationResult>(
      `${this.basePath}/dwca`,
      { fileUrl }
    );

    return response;
  }

  /**
   * Validate a Darwin Core file
   */
  async validateFile(content: string, fileType: string): Promise<ValidationResult> {
    logger.info('Validating file', { fileType });

    const response = await this.client.post<ValidationResult>(
      `${this.basePath}/validate`,
      { content, fileType }
    );

    return response;
  }

  /**
   * Get validation status
   */
  async getStatus(validationKey: string): Promise<ValidationResult> {
    logger.info('Getting validation status', { validationKey });

    const response = await this.client.get<ValidationResult>(
      `${this.basePath}/status/${validationKey}`
    );

    return response;
  }
}