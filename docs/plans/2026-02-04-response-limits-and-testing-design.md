# Response Size Limits and Comprehensive Testing

**Date:** 2026-02-04
**Status:** Approved
**Goal:** Add response size limits to prevent context window issues and create comprehensive tests to verify MCP functionality

## Overview

This design adds multi-layer response size limiting with a conservative 250KB limit and comprehensive testing including both mocked MCP protocol tests and real GBIF API integration tests.

## Architecture

### Three-Layer Response Size Limiting

**Layer 1 - GBIFClient (Warning Layer)**
- Calculate response size after receiving data from GBIF API
- Log warnings when responses exceed 200KB (early warning threshold)
- Pass through all data but emit metrics for monitoring
- Location: `src/core/gbif-client.ts`

**Layer 2 - BaseTool (Smart Truncation Layer)**
- New `truncateIfNeeded()` method in base class
- Checks serialized output size before returning to MCP protocol
- If > 250KB: Returns truncated response with metadata structure:
  ```typescript
  {
    truncated: true,
    originalCount: 1000,
    returnedCount: 20,
    size: "248KB",
    message: "Response truncated. Use limit=20 and pagination...",
    data: [...first N results that fit...]
  }
  ```
- Location: `src/tools/base-tool.ts`

**Layer 3 - MCP Server (Safety Net)**
- Final size check in `CallToolRequestSchema` handler before JSON serialization
- If > 250KB after tool execution: Override with error message explaining limits
- Location: `src/index.ts`

### Configuration

New config section in `src/config/config.ts`:

```typescript
responseLimits: z.object({
  maxSizeBytes: z.number().default(250 * 1024), // 250KB
  warnSizeBytes: z.number().default(200 * 1024), // 200KB warning
  enableTruncation: z.boolean().default(true),
  enableSizeLogging: z.boolean().default(true),
}),
```

Environment variables:
```bash
RESPONSE_MAX_SIZE_KB=250
RESPONSE_WARN_SIZE_KB=200
RESPONSE_ENABLE_TRUNCATION=true
RESPONSE_ENABLE_SIZE_LOGGING=true
```

## Implementation Details

### GBIFClient Warning Layer

Add size calculation and logging in the `get()` method:

```typescript
// After response.data is received
const responseSize = JSON.stringify(response.data).length;
if (responseSize > config.responseLimits.warnSizeBytes) {
  logger.warn('Large GBIF response detected', {
    path,
    sizeBytes: responseSize,
    sizeKB: Math.round(responseSize / 1024),
    exceedsLimit: responseSize > config.responseLimits.maxSizeBytes
  });
}
```

### BaseTool Truncation Layer

Add new protected method and modify `execute()`:

```typescript
protected truncateIfNeeded<T>(data: T): T | TruncatedResponse<T> {
  const serialized = JSON.stringify(data);
  const sizeBytes = serialized.length;

  if (sizeBytes <= config.responseLimits.maxSizeBytes) {
    return data; // Within limits, return as-is
  }

  // Smart truncation for paginated responses
  if (this.isPaginatedResponse(data)) {
    return this.truncatePaginatedResponse(data, sizeBytes);
  }

  // For non-paginated, return metadata only
  return this.createTruncatedMetadata(data, sizeBytes);
}
```

Truncation logic:
1. Tries to fit as many results as possible under 250KB
2. Calculates metadata size first (count, offset, etc.)
3. Adds results one-by-one until approaching limit
4. Returns helpful message with pagination example using the original query

### MCP Server Safety Net

In the `CallToolRequestSchema` handler, wrap the response:

```typescript
const result = await tool.execute(args || {});
const resultStr = JSON.stringify(result, null, 2);

if (resultStr.length > config.responseLimits.maxSizeBytes) {
  logger.error('Tool result exceeds size limit', {
    tool: name,
    size: resultStr.length
  });
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: 'Response too large',
        size: `${Math.round(resultStr.length / 1024)}KB`,
        limit: '250KB',
        suggestion: 'Use smaller limit parameter or pagination'
      }, null, 2)
    }]
  };
}
```

## Type Definitions

New types in `src/types/gbif.types.ts`:

```typescript
export interface TruncatedResponse<T> {
  truncated: true;
  originalSize: string;      // "1.2MB"
  returnedSize: string;      // "248KB"
  limit: string;             // "250KB"
  message: string;           // Helpful guidance
  metadata: {
    totalCount?: number;
    returnedCount: number;
    offset?: number;
    limit?: number;
  };
  data: T;                   // Partial data
  pagination?: {
    suggestion: string;      // "Use limit=20 with offset=0,20,40..."
    example: Record<string, any>; // Actual params to use
  };
}

export interface ResponseSizeMetrics {
  sizeBytes: number;
  sizeKB: number;
  exceedsLimit: boolean;
  exceedsWarning: boolean;
  truncated: boolean;
}
```

## Testing Strategy

### Unit Tests (Extend Existing)

Location: `tests/unit/tools/` (add to existing test files)

Test cases:
- Small responses pass through unchanged
- Large responses get truncated with proper metadata
- Truncation math (verify N results fit under 250KB)
- Mock responses at various sizes (100KB, 250KB, 500KB, 1MB)

New file: `tests/unit/core/response-limits.test.ts`
- Test size calculation accuracy
- Test truncation algorithm independently
- Test configuration loading

### Integration Tests - MCP Protocol

Location: `tests/integration/mcp/`

**New files:**
- `mcp-protocol.test.ts` - List tools, call tools via MCP SDK
- `mcp-size-limits.test.ts` - Verify limits enforced at protocol level
- `mcp-error-handling.test.ts` - Circuit breaker, rate limits, errors

Structure:
```typescript
describe('MCP Protocol Integration', () => {
  let server: GBIFMCPServer;
  let client: Client; // MCP SDK client

  beforeAll(async () => {
    // Create test transport (in-memory, not stdio)
    server = new GBIFMCPServer();
    client = await connectMCPClient(server);
  });

  it('should list all 57 tools', async () => {
    const tools = await client.listTools();
    expect(tools).toHaveLength(57);
  });

  it('should enforce 250KB limit', async () => {
    // Request large dataset
    const result = await client.callTool('gbif_occurrence_search', {
      taxonKey: 212, // Birds - huge dataset
      limit: 300 // Max limit
    });
    // Verify truncated or error
  });
});
```

### Integration Tests - Real GBIF API

Location: `tests/integration/api/`

**New files:**
- `gbif-species.integration.test.ts`
- `gbif-occurrence.integration.test.ts`
- `gbif-registry.integration.test.ts`
- `gbif-maps.integration.test.ts`

These make real API calls (no mocks), marked with longer timeouts:

```typescript
describe('GBIF Species API Integration', () => {
  it('should search for Panthera leo', async () => {
    const service = new SpeciesService(new GBIFClient());
    const results = await service.search({ q: 'Panthera leo' });
    expect(results.count).toBeGreaterThan(0);
    expect(results.results[0].scientificName).toContain('Panthera');
  }, 10000); // 10s timeout
});
```

## Error Handling

### Standardized Error Messages

**Truncated Response:**
```
Response truncated to 250KB. Total results: 1000, returned: 23.
To get more data, use limit=20 with offset pagination:
offset=0, then offset=20, offset=40, etc.
```

**Hard Limit Exceeded:**
```
Response size (1.2MB) exceeds maximum limit (250KB).
Please reduce the limit parameter or add more filters to narrow your search.
```

Each error includes working example parameters based on the original query.

### Logging Strategy

- **WARN level:** Response > 200KB (approaching limit)
- **ERROR level:** Response > 250KB (truncated/failed)
- **INFO level:** Size metrics when `enableSizeLogging=true`
- All logs include: tool name, size, query params, truncation decision

## Files to Create

1. `tests/integration/mcp/mcp-protocol.test.ts`
2. `tests/integration/mcp/mcp-size-limits.test.ts`
3. `tests/integration/mcp/mcp-error-handling.test.ts`
4. `tests/integration/api/gbif-species.integration.test.ts`
5. `tests/integration/api/gbif-occurrence.integration.test.ts`
6. `tests/integration/api/gbif-registry.integration.test.ts`
7. `tests/integration/api/gbif-maps.integration.test.ts`
8. `tests/integration/setup.ts`
9. `src/utils/response-truncator.ts`

## Files to Modify

1. `src/config/config.ts` - Add responseLimits section
2. `src/types/gbif.types.ts` - Add TruncatedResponse, ResponseSizeMetrics types
3. `src/core/gbif-client.ts` - Add size warnings
4. `src/tools/base-tool.ts` - Add truncateIfNeeded() method
5. `src/index.ts` - Add final size check
6. `package.json` - Add test scripts
7. `vitest.config.ts` - Add integration test patterns
8. `.env.example` - Document new environment variables

## Files to Update (Tests)

Add size limit tests to:
- `tests/unit/tools/occurrence/occurrence-search.tool.test.ts`
- `tests/unit/tools/species/species-search.tool.test.ts`

## NPM Scripts

```json
{
  "test": "vitest",
  "test:unit": "vitest tests/unit",
  "test:integration": "vitest tests/integration",
  "test:integration:mcp": "vitest tests/integration/mcp",
  "test:integration:api": "vitest tests/integration/api --run",
  "test:all": "vitest --run tests/unit && vitest --run tests/integration"
}
```

## Implementation Order

1. **Configuration & types** (foundation)
   - Update `src/config/config.ts`
   - Add types to `src/types/gbif.types.ts`

2. **Response truncation utility** (core logic)
   - Create `src/utils/response-truncator.ts`
   - Unit test the truncation logic

3. **Integrate into BaseTool** (apply to all tools)
   - Modify `src/tools/base-tool.ts`
   - Test with existing tool tests

4. **Add client warnings & server safety net**
   - Update `src/core/gbif-client.ts`
   - Update `src/index.ts`

5. **Write unit tests for truncation**
   - Create `tests/unit/core/response-limits.test.ts`
   - Update existing tool tests

6. **Write MCP protocol integration tests**
   - Create `tests/integration/mcp/` tests
   - Test mocked MCP protocol flow

7. **Write real API integration tests**
   - Create `tests/integration/api/` tests
   - Test actual GBIF API calls (slowest, do last)

## Success Criteria

- ✅ All responses stay under 250KB
- ✅ Smart truncation returns useful data + guidance
- ✅ MCP protocol tests verify all 57 tools work
- ✅ Real API integration tests pass for key endpoints
- ✅ Configuration allows adjustment of limits
- ✅ Helpful error messages guide users to pagination
- ✅ Existing tests still pass
- ✅ New tests provide 80%+ coverage of new code

## Trade-offs & Decisions

**Why 250KB?**
- Conservative limit leaves room for conversation history in Claude's context
- Most biodiversity queries return < 100KB
- Forces users to paginate large datasets (better UX)

**Why smart truncation over hard fail?**
- Users get immediate value (sample data + metadata)
- Clear guidance on how to get more data
- Better experience than error-only response

**Why three layers?**
- Defense in depth - catches issues at multiple points
- Warning layer helps developers optimize queries
- Safety net prevents protocol violations

**Why both mocked and real API tests?**
- Mocked tests run fast in CI (< 1s)
- Real tests verify actual GBIF integration works
- Can run mocked tests frequently, real tests occasionally
