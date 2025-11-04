# MCP Protocol Layer Documentation

## Overview

The Protocol Layer is the core of the GBIF MCP Server, implementing the Model Context Protocol specification with production-ready features including correlation tracking, comprehensive error handling, and circuit breaker integration.

## Architecture

The protocol layer consists of three main components:

### 1. MCP Errors (`src/protocol/mcp-errors.ts`)

Standardized error handling following the JSON-RPC 2.0 specification.

**Features:**
- Standard and custom error codes
- Structured error responses
- Error type classification (retryable, user-facing)
- Automatic error transformation from GBIF API errors

**Error Codes:**
```typescript
enum MCPErrorCode {
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
```

**Usage:**
```typescript
import { MCPError, MCPErrorCode } from './protocol/mcp-errors.js';

// Create an MCP error
throw new MCPError(
  MCPErrorCode.TOOL_NOT_FOUND,
  'Tool not found: species_search',
  { availableTools: ['species_search', 'species_get'] }
);

// Convert from standard Error
const mcpError = MCPError.fromError(error);

// Check error characteristics
if (mcpError.isRetryable()) {
  // Retry logic
}
```

### 2. Request Handler (`src/protocol/request-handler.ts`)

Centralized request handling with correlation tracking and context management.

**Features:**
- Correlation ID generation and tracking
- Request context management
- Execution timing
- Consistent logging
- Error boundary wrapping

**Request Context:**
```typescript
interface RequestContext {
  correlationId: string;
  requestId?: string;
  toolName?: string;
  startTime: number;
  metadata?: Record<string, any>;
}
```

**Usage:**
```typescript
import { RequestHandler } from './protocol/request-handler.js';

// Wrap any handler with context
const result = await RequestHandler.withContext(
  'MyOperation',
  async (context) => {
    // Your code here - correlation ID is automatically tracked
    logger.info('Processing', { correlationId: context.correlationId });
    return data;
  },
  { additionalMetadata: 'value' }
);

// Tool execution wrapper
const response = await RequestHandler.executeTool(
  'species_search',
  async (context) => {
    return await tool.execute(args);
  },
  args
);
```

**Response Formatter:**
```typescript
import { ResponseFormatter } from './protocol/request-handler.js';

// Format success response
const response = ResponseFormatter.success(data, { toolName: 'species_search' });

// Format error response
const errorResponse = ResponseFormatter.error(error, { toolName: 'species_search' });

// Format paginated response
const paginated = ResponseFormatter.paginated(
  items,
  { offset: 0, limit: 20, total: 100, hasMore: true },
  metadata
);
```

### 3. Main Server (`src/index.ts`)

Production-ready MCP server with full protocol implementation.

**Features:**
- Tool registration and discovery
- Protocol request handlers (list tools, call tool)
- Circuit breaker state monitoring
- Server statistics and health checks
- Graceful shutdown
- Comprehensive error handling

**Server Statistics:**
```typescript
interface ServerStats {
  startTime: Date;
  requestCount: number;
  successCount: number;
  errorCount: number;
  toolExecutions: Map<string, number>;
}
```

**Health Status:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  uptime: number,
  stats: ServerStats,
  circuitBreaker: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}
```

## Protocol Handlers

### List Tools Handler

Returns all registered tools with their JSON schema definitions.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "gbif_species_search",
        "description": "Search for species in GBIF backbone taxonomy",
        "inputSchema": {
          "type": "object",
          "properties": {
            "q": { "type": "string", "description": "Search query" },
            "limit": { "type": "number", "description": "Number of results" }
          },
          "required": ["q"]
        }
      }
    ]
  },
  "id": 1
}
```

### Call Tool Handler

Executes a tool with the provided arguments.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "gbif_species_search",
    "arguments": {
      "q": "Puma concolor",
      "limit": 10
    }
  },
  "id": 2
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"data\":[...],\"metadata\":{...}}"
      }
    ]
  },
  "id": 2
}
```

**Error Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"error\":true,\"code\":-32000,\"message\":\"Tool not found\",\"tool\":\"unknown_tool\",\"timestamp\":\"...\"}"
      }
    ],
    "isError": true
  },
  "id": 2
}
```

## Correlation ID Tracking

Every request is assigned a unique correlation ID for tracing through the system.

**Generation:**
```typescript
const correlationId = generateCorrelationId();
// Format: "1699112400000-abc123def"
```

**Context Propagation:**
```typescript
// Automatically propagated through AsyncLocalStorage
await RequestHandler.withContext('Operation', async (context) => {
  logger.info('Message', { correlationId: context.correlationId });
  // Correlation ID is available in all nested calls
});
```

**Logging:**
All log entries automatically include the correlation ID:
```json
{
  "timestamp": "2024-11-04 12:30:00",
  "level": "info",
  "message": "Tool invocation started",
  "correlationId": "1699112400000-abc123def",
  "tool": "species_search"
}
```

## Error Handling

### Error Flow

1. Error occurs in tool or service
2. Error is caught by BaseTool or RequestHandler
3. Error is transformed to MCPError
4. Error is formatted for MCP response
5. Error is logged with correlation ID

### Error Types

**User Errors (4xx equivalent):**
- `INVALID_PARAMS`: Bad request parameters
- `VALIDATION_ERROR`: Schema validation failed
- `TOOL_NOT_FOUND`: Requested tool doesn't exist

**Service Errors (5xx equivalent):**
- `INTERNAL_ERROR`: Unexpected server error
- `SERVICE_UNAVAILABLE`: GBIF API unavailable
- `TIMEOUT_ERROR`: Request timeout
- `RATE_LIMIT_ERROR`: Rate limit exceeded

**System Errors:**
- `CIRCUIT_BREAKER_OPEN`: Circuit breaker protecting service

### Error Response Format

```typescript
{
  error: true,
  code: MCPErrorCode,
  message: string,
  tool: string,
  data?: any,
  timestamp: string
}
```

## Circuit Breaker Integration

The protocol layer integrates with the GBIFClient circuit breaker:

**States:**
- `CLOSED`: Normal operation
- `OPEN`: Too many errors, rejecting requests
- `HALF_OPEN`: Testing if service recovered

**Protocol Behavior:**
- Before tool execution, check circuit breaker state
- If OPEN, return `CIRCUIT_BREAKER_OPEN` error immediately
- No GBIF API calls are made when circuit is OPEN
- Automatic recovery when circuit transitions to CLOSED

**Error Response:**
```json
{
  "error": true,
  "code": -32005,
  "message": "Service temporarily unavailable due to high error rate",
  "data": { "circuitState": "OPEN" },
  "timestamp": "2024-11-04T12:30:00Z"
}
```

## Monitoring and Metrics

### Server Statistics

Tracked automatically:
- Total request count
- Success/error counts
- Success rate percentage
- Top executed tools
- Circuit breaker state
- Cache statistics

**Periodic Logging:**
Statistics are logged every 5 minutes when metrics are enabled:
```json
{
  "uptime": "120 minutes",
  "requests": {
    "total": 1523,
    "successful": 1498,
    "failed": 25,
    "successRate": "98.36%"
  },
  "topTools": [
    { "name": "species_search", "count": 842 },
    { "name": "species_get", "count": 431 }
  ],
  "circuitBreaker": { "state": "CLOSED" },
  "cache": { "size": 45231, "itemCount": 156 }
}
```

### Health Checks

Health status determined by:
- Circuit breaker state
- Success rate
- Server uptime

**Status Levels:**
- `healthy`: Circuit CLOSED, success rate > 90%
- `degraded`: Circuit HALF_OPEN or success rate 50-90%
- `unhealthy`: Circuit OPEN or success rate < 50%

## Graceful Shutdown

The server handles shutdown signals properly:

**Signals Handled:**
- `SIGINT` (Ctrl+C)
- `SIGTERM` (Docker/Kubernetes)
- `SIGHUP`

**Shutdown Process:**
1. Set shutdown flag (prevent new requests)
2. Log final statistics
3. Close MCP server connection
4. Flush logger
5. Exit with code 0

## Testing the Protocol Layer

### Manual Testing

Run the server in development mode:
```bash
npm run dev
```

### Integration with Claude Desktop

Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "gbif": {
      "command": "node",
      "args": ["/path/to/gbif-mcp/build/index.js"]
    }
  }
}
```

### Expected Behavior

1. Server starts and logs initialization
2. Lists 4 species tools
3. Accepts tool calls via stdio
4. Returns structured JSON responses
5. Handles errors gracefully
6. Logs statistics periodically
7. Shuts down cleanly on signal

## Best Practices

### For Tool Developers

1. **Always use BaseTool**
   - Inherit from BaseTool for automatic validation and error handling
   - Define clear input/output schemas

2. **Use formatResponse**
   - Consistent response format
   - Automatic metadata inclusion

3. **Throw meaningful errors**
   - Use descriptive error messages
   - Include helpful data in errors

### For Service Developers

1. **Use Logger**
   - Log important operations
   - Include relevant context
   - Correlation IDs are automatic

2. **Handle GBIF errors**
   - Let errors propagate to BaseTool
   - Add service-specific context

3. **Consider caching**
   - GBIFClient handles caching
   - Focus on business logic

## Future Enhancements

### Phase 4: Resources
- Implement MCP resources for common datasets
- Resource templates for queries

### Phase 5: Prompts
- Add prompt templates for common workflows
- Prompt arguments with validation

### Advanced Features
- Request rate limiting per client
- Request queue management
- Response streaming for large datasets
- WebSocket transport support

## Troubleshooting

### Common Issues

**Issue: "Circuit breaker is OPEN"**
- Cause: Too many failed requests to GBIF API
- Solution: Wait for automatic recovery, or reset circuit breaker
- Prevention: Check GBIF service status, validate requests

**Issue: "Tool execution failed"**
- Check correlation ID in logs
- Trace request through log chain
- Verify input parameters

**Issue: "Server not responding"**
- Check process is running
- Verify stdio transport
- Check for uncaught errors in logs

### Debug Logging

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

### Monitoring

Watch for:
- Success rate drops below 95%
- Circuit breaker state changes
- Increased error counts
- High request latency

## Summary

The MCP Protocol Layer provides:
- Production-ready MCP server implementation
- Comprehensive error handling
- Request correlation tracking
- Circuit breaker integration
- Server monitoring and health checks
- Graceful lifecycle management

This foundation is ready for adding additional GBIF service tools while maintaining reliability, observability, and maintainability.
