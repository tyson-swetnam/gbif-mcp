/**
 * MCP Protocol Error Types and Utilities
 *
 * Defines standard error types and formatting for MCP protocol responses
 */

/**
 * MCP Error Codes following JSON-RPC 2.0 specification
 */
export enum MCPErrorCode {
  // Standard JSON-RPC errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // MCP-specific errors
  TOOL_NOT_FOUND = -32000,
  TOOL_EXECUTION_ERROR = -32001,
  VALIDATION_ERROR = -32002,
  RATE_LIMIT_ERROR = -32003,
  SERVICE_UNAVAILABLE = -32004,
  CIRCUIT_BREAKER_OPEN = -32005,
  TIMEOUT_ERROR = -32006,
}

/**
 * MCP Error class for structured error responses
 */
export class MCPError extends Error {
  constructor(
    public readonly code: MCPErrorCode,
    message: string,
    public readonly data?: any
  ) {
    super(message);
    this.name = 'MCPError';
    Object.setPrototypeOf(this, MCPError.prototype);
  }

  /**
   * Convert to MCP error response format
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }

  /**
   * Create from standard Error
   */
  static fromError(error: Error | any): MCPError {
    if (error instanceof MCPError) {
      return error;
    }

    // Check for GBIF API errors
    if (error.statusCode) {
      switch (error.statusCode) {
        case 400:
          return new MCPError(
            MCPErrorCode.INVALID_PARAMS,
            error.message || 'Invalid parameters',
            { statusCode: error.statusCode }
          );
        case 404:
          return new MCPError(
            MCPErrorCode.METHOD_NOT_FOUND,
            error.message || 'Resource not found',
            { statusCode: error.statusCode }
          );
        case 429:
          return new MCPError(
            MCPErrorCode.RATE_LIMIT_ERROR,
            error.message || 'Rate limit exceeded',
            { statusCode: error.statusCode }
          );
        case 503:
          return new MCPError(
            MCPErrorCode.SERVICE_UNAVAILABLE,
            error.message || 'Service temporarily unavailable',
            { statusCode: error.statusCode }
          );
        default:
          if (error.statusCode >= 500) {
            return new MCPError(
              MCPErrorCode.INTERNAL_ERROR,
              error.message || 'Internal server error',
              { statusCode: error.statusCode }
            );
          }
      }
    }

    // Check for circuit breaker errors
    if (error.message && error.message.includes('Circuit breaker')) {
      return new MCPError(
        MCPErrorCode.CIRCUIT_BREAKER_OPEN,
        error.message,
        { circuitBreaker: true }
      );
    }

    // Check for timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return new MCPError(
        MCPErrorCode.TIMEOUT_ERROR,
        'Request timeout exceeded',
        { timeout: true }
      );
    }

    // Check for validation errors
    if (error.name === 'ZodError' || error.message?.includes('Invalid input')) {
      return new MCPError(
        MCPErrorCode.VALIDATION_ERROR,
        error.message || 'Validation error',
        { validation: true }
      );
    }

    // Default to internal error
    return new MCPError(
      MCPErrorCode.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred',
      { originalError: error.name }
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return [
      MCPErrorCode.TIMEOUT_ERROR,
      MCPErrorCode.SERVICE_UNAVAILABLE,
      MCPErrorCode.INTERNAL_ERROR,
    ].includes(this.code);
  }

  /**
   * Check if error is user-facing
   */
  isUserError(): boolean {
    return [
      MCPErrorCode.INVALID_PARAMS,
      MCPErrorCode.VALIDATION_ERROR,
      MCPErrorCode.TOOL_NOT_FOUND,
      MCPErrorCode.METHOD_NOT_FOUND,
    ].includes(this.code);
  }
}

/**
 * Error response formatter for MCP protocol
 */
export class MCPErrorFormatter {
  /**
   * Format error for MCP tool response
   */
  static formatToolError(error: Error | MCPError, toolName: string): {
    content: Array<{ type: string; text: string }>;
    isError: boolean;
  } {
    const mcpError = error instanceof MCPError ? error : MCPError.fromError(error);

    const errorResponse = {
      error: true,
      code: mcpError.code,
      message: mcpError.message,
      tool: toolName,
      data: mcpError.data,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorResponse, null, 2),
        },
      ],
      isError: true,
    };
  }

  /**
   * Format error for MCP list response
   */
  static formatListError(error: Error | MCPError): {
    error: any;
  } {
    const mcpError = error instanceof MCPError ? error : MCPError.fromError(error);
    return { error: mcpError.toJSON() };
  }

  /**
   * Create a user-friendly error message
   */
  static createUserMessage(error: Error | MCPError): string {
    const mcpError = error instanceof MCPError ? error : MCPError.fromError(error);

    if (mcpError.isUserError()) {
      return mcpError.message;
    }

    switch (mcpError.code) {
      case MCPErrorCode.RATE_LIMIT_ERROR:
        return 'Rate limit exceeded. Please wait a moment and try again.';
      case MCPErrorCode.CIRCUIT_BREAKER_OPEN:
        return 'Service is temporarily unavailable due to high error rate. Please try again in a few moments.';
      case MCPErrorCode.TIMEOUT_ERROR:
        return 'Request timed out. Please try again with a more specific query.';
      case MCPErrorCode.SERVICE_UNAVAILABLE:
        return 'GBIF service is temporarily unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  }
}
