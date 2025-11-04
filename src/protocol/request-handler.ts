/**
 * MCP Request Handler Utilities
 *
 * Provides utilities for handling MCP protocol requests with correlation IDs,
 * logging, error handling, and response formatting.
 */

import { logger, generateCorrelationId, withCorrelation } from '../utils/logger.js';
import { MCPError, MCPErrorFormatter } from './mcp-errors.js';

/**
 * Request context for tracking and logging
 */
export interface RequestContext {
  correlationId: string;
  requestId?: string;
  toolName?: string;
  startTime: number;
  metadata?: Record<string, any>;
}

/**
 * Request handler wrapper that adds correlation tracking and error handling
 */
export class RequestHandler {
  /**
   * Wrap a handler function with correlation context and error handling
   */
  static async withContext<T>(
    handlerName: string,
    handler: (context: RequestContext) => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const correlationId = generateCorrelationId();
    const context: RequestContext = {
      correlationId,
      startTime: Date.now(),
      metadata,
    };

    return withCorrelation(correlationId, async () => {
      try {
        logger.info(`${handlerName} started`, {
          correlationId: context.correlationId,
          ...metadata,
        });

        const result = await handler(context);

        const duration = Date.now() - context.startTime;
        logger.info(`${handlerName} completed`, {
          correlationId: context.correlationId,
          duration,
          ...metadata,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - context.startTime;
        logger.error(`${handlerName} failed`, {
          correlationId: context.correlationId,
          duration,
          error,
          ...metadata,
        });
        throw error;
      }
    });
  }

  /**
   * Wrap a tool execution with full context and error handling
   */
  static async executeTool<T>(
    toolName: string,
    executor: (context: RequestContext) => Promise<T>,
    args?: any
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const result = await this.withContext(
        `Tool: ${toolName}`,
        executor,
        { toolName, args }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, {
        error,
        args,
      });

      return MCPErrorFormatter.formatToolError(error as Error, toolName);
    }
  }

  /**
   * Create a safe wrapper for list operations
   */
  static async listTools<T>(
    executor: () => Promise<T>
  ): Promise<T | { error: any }> {
    try {
      return await this.withContext('List Tools', async () => executor());
    } catch (error) {
      logger.error('List tools failed', { error });
      return MCPErrorFormatter.formatListError(error as Error);
    }
  }

  /**
   * Validate request parameters
   */
  static validateParams(params: any, required: string[]): void {
    if (!params) {
      throw new MCPError(
        -32602,
        'Missing required parameters',
        { required }
      );
    }

    const missing = required.filter(key => !(key in params));
    if (missing.length > 0) {
      throw new MCPError(
        -32602,
        `Missing required parameters: ${missing.join(', ')}`,
        { missing, required }
      );
    }
  }
}

/**
 * Response formatter for consistent MCP responses
 */
export class ResponseFormatter {
  /**
   * Format successful tool response
   */
  static success<T>(data: T, metadata?: Record<string, any>) {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
  }

  /**
   * Format error response
   */
  static error(error: Error | MCPError, metadata?: Record<string, any>) {
    const mcpError = error instanceof MCPError ? error : MCPError.fromError(error);

    return {
      success: false,
      error: {
        code: mcpError.code,
        message: mcpError.message,
        data: mcpError.data,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
  }

  /**
   * Format paginated response
   */
  static paginated<T>(
    items: T[],
    pagination: {
      offset?: number;
      limit?: number;
      total?: number;
      hasMore?: boolean;
    },
    metadata?: Record<string, any>
  ) {
    return {
      success: true,
      data: items,
      pagination: {
        count: items.length,
        offset: pagination.offset ?? 0,
        limit: pagination.limit ?? 20,
        total: pagination.total,
        hasMore: pagination.hasMore,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
  }

  /**
   * Format list response
   */
  static list<T>(items: T[], metadata?: Record<string, any>) {
    return {
      success: true,
      data: items,
      count: items.length,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
  }
}
