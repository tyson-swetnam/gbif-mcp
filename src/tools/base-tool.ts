import { ZodSchema } from 'zod';
import { zodToJsonSchema as convertZodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { ResponseTruncator } from '../utils/response-truncator.js';
import { config } from '../config/config.js';
import type { TruncatedResponse } from '../types/gbif.types.js';

/**
 * Base class for all GBIF MCP tools
 */
export abstract class BaseTool<TInput = any, TOutput = any> {
  protected abstract readonly name: string;
  protected abstract readonly description: string;
  protected abstract readonly inputSchema: ZodSchema<TInput>;
  protected readonly outputSchema?: ZodSchema<TOutput>;

  private readonly truncator: ResponseTruncator;

  constructor() {
    this.truncator = new ResponseTruncator();
  }

  /**
   * Get MCP tool definition
   */
  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.zodToJsonSchema(this.inputSchema),
    };
  }

  /**
   * Execute the tool with validation
   */
  async execute(input: unknown): Promise<TOutput> {
    try {
      // Validate input
      const validatedInput = await this.validateInput(input);

      // Execute tool logic
      const result = await this.run(validatedInput);

      // Validate output if schema is defined
      const validatedResult = this.outputSchema
        ? this.validateOutput(result)
        : result;

      // Apply size limiting
      const truncatedResult = this.truncateIfNeeded(
        validatedResult,
        validatedInput as Record<string, any>
      );

      return truncatedResult as TOutput;
    } catch (error) {
      logger.error(`Tool execution failed: ${this.name}`, { error, input });
      throw this.transformError(error);
    }
  }

  /**
   * Abstract method to implement tool logic
   */
  protected abstract run(input: TInput): Promise<TOutput>;

  /**
   * Validate input against schema
   */
  protected async validateInput(input: unknown): Promise<TInput> {
    try {
      return this.inputSchema.parse(input);
    } catch (error) {
      throw new Error(`Invalid input for ${this.name}: ${(error as any).message}`);
    }
  }

  /**
   * Validate output against schema
   */
  protected validateOutput(output: unknown): TOutput {
    if (!this.outputSchema) {
      return output as TOutput;
    }

    try {
      return this.outputSchema.parse(output);
    } catch (error) {
      logger.error(`Output validation failed for ${this.name}`, { error, output });
      throw new Error(`Invalid output from ${this.name}: ${(error as any).message}`);
    }
  }

  /**
   * Truncate response if it exceeds size limits
   */
  protected truncateIfNeeded<T>(
    data: T,
    originalParams?: Record<string, any>
  ): T | TruncatedResponse<T> {
    if (!config.responseLimits.enableTruncation) {
      return data;
    }

    const sizeBytes = this.truncator.calculateSize(data);

    if (!this.truncator.needsTruncation(data)) {
      if (config.responseLimits.enableSizeLogging) {
        logger.debug('Response within size limits', {
          tool: this.name,
          sizeKB: Math.round(sizeBytes / 1024)
        });
      }
      return data;
    }

    logger.warn('Response exceeds size limit, truncating', {
      tool: this.name,
      originalSize: ResponseTruncator.formatSize(sizeBytes),
      limit: ResponseTruncator.formatSize(config.responseLimits.maxSizeBytes)
    });

    // Check if this is a paginated GBIF response
    const isPaginated = (data as any)?.results && Array.isArray((data as any).results);

    if (isPaginated) {
      return this.truncator.truncatePaginatedResponse(data as any, originalParams || {}) as any;
    }

    // For non-paginated, return metadata only
    return this.truncator.createMetadataOnlyResponse(data, sizeBytes) as any;
  }

  /**
   * Transform errors to user-friendly messages
   */
  protected transformError(error: any): Error {
    if (error.statusCode) {
      switch (error.statusCode) {
        case 400:
          return new Error(`Invalid request: ${error.message || 'Bad request to GBIF API'}`);
        case 401:
          return new Error('Authentication required for this GBIF endpoint');
        case 403:
          return new Error('Access forbidden to this GBIF resource');
        case 404:
          return new Error('Resource not found in GBIF');
        case 429:
          return new Error('Rate limit exceeded. Please try again later');
        case 500:
        case 502:
        case 503:
          return new Error('GBIF service temporarily unavailable');
        default:
          return new Error(error.message || 'Unknown error occurred');
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Convert Zod schema to JSON Schema for MCP
   */
  protected zodToJsonSchema(schema: ZodSchema): any {
    // Use the proper zod-to-json-schema library for accurate conversion
    return convertZodToJsonSchema(schema, {
      target: 'jsonSchema7',
      $refStrategy: 'none',
    });
  }

  /**
   * Helper method to format responses consistently
   */
  protected formatResponse<T>(data: T, metadata?: Record<string, any>): any {
    return {
      success: true,
      data,
      metadata: {
        tool: this.name,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
  }

  /**
   * Helper method to format error responses
   */
  protected formatErrorResponse(error: Error, metadata?: Record<string, any>): any {
    return {
      success: false,
      error: {
        message: error.message,
        type: error.name,
      },
      metadata: {
        tool: this.name,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
  }
}