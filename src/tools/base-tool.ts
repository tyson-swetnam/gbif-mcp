import { z, ZodSchema } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

/**
 * Base class for all GBIF MCP tools
 */
export abstract class BaseTool<TInput = any, TOutput = any> {
  protected abstract readonly name: string;
  protected abstract readonly description: string;
  protected abstract readonly inputSchema: ZodSchema<TInput>;
  protected abstract readonly outputSchema?: ZodSchema<TOutput>;

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
      if (this.outputSchema) {
        return this.validateOutput(result);
      }

      return result;
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
    // This is a simplified conversion - in production, use a library like zod-to-json-schema
    const def = (schema as any)._def;

    if (def.typeName === 'ZodObject') {
      const properties: any = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(def.shape())) {
        properties[key] = this.zodToJsonSchema(value as ZodSchema);

        const subDef = (value as any)._def;
        if (subDef.typeName !== 'ZodOptional' && subDef.typeName !== 'ZodNullable') {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    if (def.typeName === 'ZodString') {
      return { type: 'string', description: def.description };
    }

    if (def.typeName === 'ZodNumber') {
      return { type: 'number', description: def.description };
    }

    if (def.typeName === 'ZodBoolean') {
      return { type: 'boolean', description: def.description };
    }

    if (def.typeName === 'ZodArray') {
      return {
        type: 'array',
        items: this.zodToJsonSchema(def.type),
        description: def.description,
      };
    }

    if (def.typeName === 'ZodOptional') {
      return this.zodToJsonSchema(def.innerType);
    }

    if (def.typeName === 'ZodEnum') {
      return {
        type: 'string',
        enum: def.values,
        description: def.description,
      };
    }

    // Default fallback
    return { type: 'string' };
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