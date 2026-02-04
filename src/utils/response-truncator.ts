import { config } from '../config/config.js';
import { logger } from './logger.js';
import type { TruncatedResponse, GBIFResponse, isPaginatedResponse } from '../types/gbif.types.js';

/**
 * Utility for truncating large responses to stay within size limits
 */
export class ResponseTruncator {
  private readonly maxSizeBytes: number;

  constructor(maxSizeBytes?: number) {
    this.maxSizeBytes = maxSizeBytes ?? config.responseLimits.maxSizeBytes;
  }

  /**
   * Calculate size of data in bytes
   */
  calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  /**
   * Check if data needs truncation
   */
  needsTruncation(data: any): boolean {
    return this.calculateSize(data) > this.maxSizeBytes;
  }

  /**
   * Truncate paginated GBIF response to fit under size limit
   */
  truncatePaginatedResponse<T>(
    data: GBIFResponse<T>,
    originalParams: Record<string, any>
  ): TruncatedResponse<GBIFResponse<T>> {
    const originalSize = this.calculateSize(data);
    const { results, count, offset, limit, endOfRecords, ...metadata } = data;

    // Calculate base size without results
    const baseSize = this.calculateSize({ ...metadata, results: [], count, offset, limit });
    const availableSize = this.maxSizeBytes - baseSize - 2000; // Reserve 2KB for wrapper

    // Fit as many results as possible
    const truncatedResults: T[] = [];
    let currentSize = 0;

    for (const result of results || []) {
      const resultSize = this.calculateSize(result);
      if (currentSize + resultSize > availableSize) {
        break;
      }
      truncatedResults.push(result);
      currentSize += resultSize;
    }

    const truncatedData: GBIFResponse<T> = {
      ...metadata,
      results: truncatedResults,
      count,
      offset,
      limit,
      endOfRecords
    };

    const returnedSize = this.calculateSize(truncatedData);

    // Generate helpful pagination suggestion
    const suggestion = this.generatePaginationSuggestion(
      count || 0,
      truncatedResults.length,
      originalParams
    );

    return {
      truncated: true,
      originalSize: ResponseTruncator.formatSize(originalSize),
      returnedSize: ResponseTruncator.formatSize(returnedSize),
      limit: ResponseTruncator.formatSize(this.maxSizeBytes),
      message: `Response truncated to ${ResponseTruncator.formatSize(this.maxSizeBytes)}. Total results: ${count || 0}, returned: ${truncatedResults.length}. ${suggestion.suggestion}`,
      metadata: {
        totalCount: count,
        returnedCount: truncatedResults.length,
        offset,
        limit
      },
      data: truncatedData,
      pagination: suggestion
    };
  }

  /**
   * Generate pagination suggestion based on data
   */
  private generatePaginationSuggestion(
    totalCount: number,
    returnedCount: number,
    originalParams: Record<string, any>
  ): { suggestion: string; example: Record<string, any> } {
    // Calculate optimal page size
    const optimalLimit = Math.max(10, Math.min(returnedCount, 50));

    const suggestion = `To get more data, use limit=${optimalLimit} with offset pagination: offset=0, then offset=${optimalLimit}, offset=${optimalLimit * 2}, etc.`;

    const example = {
      ...originalParams,
      limit: optimalLimit,
      offset: 0
    };

    return { suggestion, example };
  }

  /**
   * Format size in bytes to human-readable string
   */
  static formatSize(bytes: number): string {
    const kb = bytes / 1024;
    if (kb >= 1024) {
      const mb = kb / 1024;
      return `${mb.toFixed(1)}MB`;
    }
    // Use one decimal place for KB if not a whole number
    const rounded = Math.round(kb * 10) / 10;
    return rounded % 1 === 0 ? `${rounded}KB` : `${rounded.toFixed(1)}KB`;
  }

  /**
   * Create truncated metadata-only response for non-paginated data
   */
  createMetadataOnlyResponse<T>(
    data: T,
    originalSize: number
  ): TruncatedResponse<null> {
    return {
      truncated: true,
      originalSize: ResponseTruncator.formatSize(originalSize),
      returnedSize: '1KB',
      limit: ResponseTruncator.formatSize(this.maxSizeBytes),
      message: `Response size (${ResponseTruncator.formatSize(originalSize)}) exceeds maximum limit (${ResponseTruncator.formatSize(this.maxSizeBytes)}). No data returned.`,
      metadata: {
        returnedCount: 0
      },
      data: null
    };
  }
}
