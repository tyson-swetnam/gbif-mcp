# Response Size Limits and Comprehensive Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three-layer response size limiting (250KB default) and comprehensive integration tests to verify MCP functionality.

**Architecture:** Multi-layer defense (GBIFClient warnings, BaseTool smart truncation, MCP Server safety net) with both mocked MCP protocol tests and real GBIF API integration tests.

**Tech Stack:** TypeScript, Vitest, MCP SDK, Zod, Winston logger

---

## Task 1: Add Configuration Types and Environment Variables

**Files:**
- Modify: `src/config/config.ts:12-61`
- Modify: `.env.example:39`

**Step 1: Add responseLimits to config schema**

In `src/config/config.ts`, add after the `cache` section (around line 38):

```typescript
  // Response Size Limiting Configuration
  responseLimits: z.object({
    maxSizeBytes: z.number().default(250 * 1024), // 250KB
    warnSizeBytes: z.number().default(200 * 1024), // 200KB warning
    enableTruncation: z.boolean().default(true),
    enableSizeLogging: z.boolean().default(true),
  }),
```

**Step 2: Add environment variable parsing**

In `src/config/config.ts`, add to `parseConfig()` function after `cache` section (around line 85):

```typescript
    responseLimits: {
      maxSizeBytes: process.env.RESPONSE_MAX_SIZE_KB
        ? parseInt(process.env.RESPONSE_MAX_SIZE_KB, 10) * 1024
        : undefined,
      warnSizeBytes: process.env.RESPONSE_WARN_SIZE_KB
        ? parseInt(process.env.RESPONSE_WARN_SIZE_KB, 10) * 1024
        : undefined,
      enableTruncation: process.env.RESPONSE_ENABLE_TRUNCATION !== 'false',
      enableSizeLogging: process.env.RESPONSE_ENABLE_SIZE_LOGGING !== 'false',
    },
```

**Step 3: Document environment variables**

Append to `.env.example`:

```bash
# Response Size Limiting Configuration
RESPONSE_MAX_SIZE_KB=250
RESPONSE_WARN_SIZE_KB=200
RESPONSE_ENABLE_TRUNCATION=true
RESPONSE_ENABLE_SIZE_LOGGING=true
```

**Step 4: Test configuration loads**

Run: `npm run typecheck`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add src/config/config.ts .env.example
git commit -m "feat: add response size limit configuration

- Add responseLimits config section with 250KB default max
- Add 200KB warning threshold
- Support environment variable overrides
- Document new env vars in .env.example"
```

---

## Task 2: Add Type Definitions for Response Limiting

**Files:**
- Modify: `src/types/gbif.types.ts:1`

**Step 1: Add TruncatedResponse interface**

At the end of `src/types/gbif.types.ts`:

```typescript
/**
 * Response that has been truncated due to size limits
 */
export interface TruncatedResponse<T> {
  truncated: true;
  originalSize: string;      // "1.2MB"
  returnedSize: string;      // "248KB"
  limit: string;             // "250KB"
  message: string;           // Helpful guidance message
  metadata: {
    totalCount?: number;     // Total results available
    returnedCount: number;   // Results included in response
    offset?: number;         // Current offset
    limit?: number;          // Current limit parameter
  };
  data: T;                   // Partial data that fits under limit
  pagination?: {
    suggestion: string;      // Human-readable pagination advice
    example: Record<string, any>; // Concrete params to use
  };
}

/**
 * Metrics about response size for monitoring
 */
export interface ResponseSizeMetrics {
  sizeBytes: number;
  sizeKB: number;
  sizeMB?: number;
  exceedsLimit: boolean;
  exceedsWarning: boolean;
  truncated: boolean;
}
```

**Step 2: Add GBIFResponse helper type guard**

Add after the interfaces:

```typescript
/**
 * Type guard to check if response has pagination
 */
export function isPaginatedResponse(data: any): data is { results: any[]; count?: number; offset?: number; limit?: number } {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.results) &&
    'count' in data
  );
}
```

**Step 3: Test types compile**

Run: `npm run typecheck`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/types/gbif.types.ts
git commit -m "feat: add types for response size limiting

- Add TruncatedResponse interface with metadata
- Add ResponseSizeMetrics for monitoring
- Add isPaginatedResponse type guard helper"
```

---

## Task 3: Create Response Truncator Utility (TDD)

**Files:**
- Create: `src/utils/response-truncator.ts`
- Create: `tests/unit/utils/response-truncator.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/utils/response-truncator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ResponseTruncator } from '../../../src/utils/response-truncator.js';
import type { GBIFResponse } from '../../../src/types/gbif.types.js';

describe('ResponseTruncator', () => {
  const truncator = new ResponseTruncator(250 * 1024); // 250KB

  describe('calculateSize', () => {
    it('should calculate size in bytes', () => {
      const data = { test: 'data', number: 123 };
      const size = truncator.calculateSize(data);
      expect(size).toBeGreaterThan(0);
      expect(size).toBe(JSON.stringify(data).length);
    });
  });

  describe('needsTruncation', () => {
    it('should return false for small data', () => {
      const smallData = { results: [{ id: 1 }], count: 1 };
      expect(truncator.needsTruncation(smallData)).toBe(false);
    });

    it('should return true for large data', () => {
      // Create data > 250KB
      const largeData = {
        results: Array(5000).fill({
          id: 1,
          scientificName: 'Very long name'.repeat(100)
        }),
        count: 5000
      };
      expect(truncator.needsTruncation(largeData)).toBe(true);
    });
  });

  describe('truncatePaginatedResponse', () => {
    it('should keep metadata and truncate results', () => {
      const largeData: GBIFResponse<any> = {
        results: Array(5000).fill({
          id: 1,
          data: 'x'.repeat(100)
        }),
        count: 5000,
        offset: 0,
        limit: 300,
        endOfRecords: false
      };

      const result = truncator.truncatePaginatedResponse(largeData, {});

      expect(result.truncated).toBe(true);
      expect(result.metadata.totalCount).toBe(5000);
      expect(result.metadata.returnedCount).toBeLessThan(5000);
      expect(result.data.results.length).toBeLessThan(5000);
      expect(result.message).toContain('truncated');
      expect(result.pagination).toBeDefined();
    });

    it('should include pagination suggestion', () => {
      const largeData: GBIFResponse<any> = {
        results: Array(1000).fill({ id: 1, data: 'x'.repeat(500) }),
        count: 1000,
        offset: 0,
        limit: 300
      };

      const result = truncator.truncatePaginatedResponse(largeData, { taxonKey: 212 });

      expect(result.pagination?.suggestion).toContain('limit');
      expect(result.pagination?.example).toHaveProperty('limit');
      expect(result.pagination?.example).toHaveProperty('offset');
    });
  });

  describe('formatSize', () => {
    it('should format bytes to KB', () => {
      expect(ResponseTruncator.formatSize(1024)).toBe('1KB');
      expect(ResponseTruncator.formatSize(1536)).toBe('1.5KB');
      expect(ResponseTruncator.formatSize(250 * 1024)).toBe('250KB');
    });

    it('should format bytes to MB', () => {
      expect(ResponseTruncator.formatSize(1024 * 1024)).toBe('1.0MB');
      expect(ResponseTruncator.formatSize(2.5 * 1024 * 1024)).toBe('2.5MB');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/unit/utils/response-truncator.test.ts`
Expected: FAIL with "Cannot find module 'response-truncator'"

**Step 3: Write minimal implementation**

Create `src/utils/response-truncator.ts`:

```typescript
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

    for (const result of results) {
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
    return `${Math.round(kb)}KB`;
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
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/unit/utils/response-truncator.test.ts`
Expected: PASS all tests

**Step 5: Commit**

```bash
git add src/utils/response-truncator.ts tests/unit/utils/response-truncator.test.ts
git commit -m "feat: implement response truncator utility

- Calculate response sizes accurately
- Smart truncation for paginated responses
- Generate helpful pagination suggestions
- Format sizes in human-readable format
- Comprehensive unit tests"
```

---

## Task 4: Integrate Truncation into BaseTool

**Files:**
- Modify: `src/tools/base-tool.ts:29-47`

**Step 1: Import truncator and types**

Add to imports at top of `src/tools/base-tool.ts`:

```typescript
import { ResponseTruncator } from '../utils/response-truncator.js';
import { config } from '../config/config.js';
import type { TruncatedResponse, isPaginatedResponse } from '../types/gbif.types.js';
```

**Step 2: Add truncator instance to BaseTool**

After the abstract properties (around line 13):

```typescript
  private readonly truncator: ResponseTruncator;

  constructor() {
    this.truncator = new ResponseTruncator();
  }
```

**Step 3: Add truncateIfNeeded method**

Add before the `transformError` method (around line 84):

```typescript
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
```

**Step 4: Update execute method to use truncation**

Modify the `execute` method (around line 29-47):

```typescript
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
```

**Step 5: Test TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 6: Run existing tests**

Run: `npm test tests/unit/tools`
Expected: All existing tests still pass

**Step 7: Commit**

```bash
git add src/tools/base-tool.ts
git commit -m "feat: integrate response truncation into BaseTool

- Add truncateIfNeeded method to base class
- Automatically truncate responses > 250KB
- Support both paginated and non-paginated responses
- Apply to all tools via inheritance"
```

---

## Task 5: Add Size Warnings to GBIFClient

**Files:**
- Modify: `src/core/gbif-client.ts:169-209`

**Step 1: Add size checking to GET method**

In `src/core/gbif-client.ts`, modify the `get` method's success block (around line 191-199):

```typescript
      try {
        logger.debug('Making GBIF API request', { path, params });
        const response = await this.client.get<T>(path, { params });

        // Check response size and log warnings
        const responseSize = JSON.stringify(response.data).length;
        if (config.responseLimits.enableSizeLogging && responseSize > config.responseLimits.warnSizeBytes) {
          logger.warn('Large GBIF response detected', {
            path,
            params,
            sizeBytes: responseSize,
            sizeKB: Math.round(responseSize / 1024),
            exceedsLimit: responseSize > config.responseLimits.maxSizeBytes,
            recommendation: responseSize > config.responseLimits.maxSizeBytes
              ? 'Response exceeds limit and will be truncated. Consider using smaller limit parameter.'
              : 'Response approaching limit. Consider pagination for larger datasets.'
          });
        }

        // Record success with circuit breaker
        this.circuitBreaker.recordSuccess();

        // Cache successful responses
        if (config.features.enableCaching && response.data) {
          this.cache.set(cacheKey, response.data);
        }

        return response.data;
      } catch (error) {
```

**Step 2: Test with actual queries**

Run: `npm run build && npm start` (in separate terminal)
Then test with a large query to see logs

**Step 3: Commit**

```bash
git add src/core/gbif-client.ts
git commit -m "feat: add response size warnings to GBIFClient

- Log warnings when responses exceed 200KB threshold
- Include size metrics and recommendations
- Help developers identify queries needing optimization"
```

---

## Task 6: Add MCP Server Safety Net

**Files:**
- Modify: `src/index.ts:326-403`

**Step 1: Add size check to CallToolRequestSchema handler**

In `src/index.ts`, modify the success block in the `CallToolRequestSchema` handler (around line 368-385):

```typescript
              // Execute tool
              const result = await tool.execute(args || {});

              // Final size check before returning
              const resultStr = JSON.stringify(result, null, 2);
              if (resultStr.length > config.responseLimits.maxSizeBytes) {
                logger.error('Tool result exceeds size limit after truncation', {
                  correlationId: context.correlationId,
                  tool: name,
                  size: resultStr.length,
                  limit: config.responseLimits.maxSizeBytes
                });

                return {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      error: 'Response too large',
                      size: `${Math.round(resultStr.length / 1024)}KB`,
                      limit: '250KB',
                      suggestion: 'Use smaller limit parameter or add more filters to narrow your search. The response exceeded limits even after automatic truncation.'
                    }, null, 2)
                  }]
                };
              }

              this.stats.successCount++;

              logger.info('Tool execution successful', {
                correlationId: context.correlationId,
                tool: name,
                duration: Date.now() - context.startTime,
              });

              return {
                content: [
                  {
                    type: 'text',
                    text: resultStr,
                  },
                ],
              };
```

**Step 2: Test TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add MCP server safety net for response sizes

- Final size check before sending to MCP protocol
- Return error if response exceeds 250KB after truncation
- Provide helpful error message with suggestions"
```

---

## Task 7: Add Test Scripts to package.json

**Files:**
- Modify: `package.json:11-16`

**Step 1: Add test scripts**

In `package.json`, replace the test scripts section:

```json
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node build/index.js",
    "test": "vitest",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:integration:mcp": "vitest tests/integration/mcp",
    "test:integration:api": "vitest tests/integration/api --run",
    "test:all": "vitest run tests/unit && vitest run tests/integration",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'",
    "clean": "rimraf build",
    "typecheck": "tsc --noEmit"
  },
```

**Step 2: Test scripts work**

Run: `npm run test:unit`
Expected: Unit tests run

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add test scripts for unit and integration tests

- test:unit - Run only unit tests
- test:integration - Run all integration tests
- test:integration:mcp - MCP protocol tests only
- test:integration:api - Real API tests only
- test:all - Run everything sequentially"
```

---

## Task 8: Update Vitest Config for Integration Tests

**Files:**
- Modify: `vitest.config.ts:3-21`

**Step 1: Update vitest config**

Replace `vitest.config.ts` content:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
        'src/index.ts',
      ],
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules', 'build'],
    testTimeout: 10000, // 10s default for integration tests
    hookTimeout: 10000,
  },
});
```

**Step 2: Test config loads**

Run: `npm test -- --version`
Expected: Vitest version displayed

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: update vitest config for integration tests

- Increase timeout to 10s for API calls
- Support both unit and integration test patterns"
```

---

## Task 9: Create Integration Test Setup Utilities

**Files:**
- Create: `tests/integration/setup.ts`

**Step 1: Create integration test setup file**

Create `tests/integration/setup.ts`:

```typescript
import { beforeAll, afterAll } from 'vitest';
import { config } from '../../src/config/config.js';
import { logger } from '../../src/utils/logger.js';

// Silence logs during tests
logger.silent = true;

// Setup for integration tests
beforeAll(() => {
  // Ensure we're using test configuration
  if (config.logging.level === 'debug') {
    console.warn('Warning: Running integration tests with debug logging enabled');
  }
});

afterAll(() => {
  // Cleanup if needed
});

/**
 * Helper to create mock large data for testing truncation
 */
export function createLargeDataset<T>(
  itemFactory: (index: number) => T,
  targetSizeKB: number
): T[] {
  const items: T[] = [];
  let currentSize = 0;
  let index = 0;

  while (currentSize < targetSizeKB * 1024) {
    const item = itemFactory(index++);
    items.push(item);
    currentSize += JSON.stringify(item).length;
  }

  return items;
}

/**
 * Helper to estimate size of data in KB
 */
export function estimateSize(data: any): number {
  return Math.round(JSON.stringify(data).length / 1024);
}
```

**Step 2: Create directories**

Run:
```bash
mkdir -p tests/integration/mcp
mkdir -p tests/integration/api
```

**Step 3: Commit**

```bash
git add tests/integration/setup.ts
git commit -m "test: add integration test setup utilities

- Create helper functions for large dataset generation
- Add size estimation utility
- Setup test environment configuration"
```

---

## Task 10: Write MCP Protocol Integration Tests

**Files:**
- Create: `tests/integration/mcp/mcp-protocol.test.ts`

**Step 1: Write MCP protocol tests**

Create `tests/integration/mcp/mcp-protocol.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { GBIFMCPServer } from '../../../src/index.js';

describe('MCP Protocol Integration', () => {
  let server: Server;
  let client: Client;
  let transport: InMemoryTransport;

  beforeAll(async () => {
    // Create in-memory transport for testing
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    transport = clientTransport;

    // Initialize server
    server = new Server(
      {
        name: 'gbif-mcp-test',
        version: '1.0.0-test',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Connect server
    await server.connect(serverTransport);

    // Initialize client
    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(clientTransport);
  }, 30000);

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  describe('Tool Discovery', () => {
    it('should list all 57 tools', async () => {
      const result = await client.listTools();
      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBe(57);
    });

    it('should include species search tool', async () => {
      const result = await client.listTools();
      const speciesSearch = result.tools.find(t => t.name === 'gbif_species_search');
      expect(speciesSearch).toBeDefined();
      expect(speciesSearch?.description).toContain('species');
    });

    it('should include occurrence search tool', async () => {
      const result = await client.listTools();
      const occurrenceSearch = result.tools.find(t => t.name === 'gbif_occurrence_search');
      expect(occurrenceSearch).toBeDefined();
      expect(occurrenceSearch?.description).toContain('occurrence');
    });

    it('should include maps tools', async () => {
      const result = await client.listTools();
      const mapTools = result.tools.filter(t => t.name.startsWith('gbif_maps'));
      expect(mapTools.length).toBeGreaterThanOrEqual(4);
    });

    it('should include literature tools', async () => {
      const result = await client.listTools();
      const litTools = result.tools.filter(t => t.name.startsWith('gbif_literature'));
      expect(litTools.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Tool Execution', () => {
    it('should execute species search tool', async () => {
      const result = await client.callTool({
        name: 'gbif_species_search',
        arguments: {
          q: 'Panthera leo',
          limit: 5
        }
      });

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe('text');

      const data = JSON.parse((result.content[0] as any).text);
      expect(data.success).toBe(true);
      expect(data.data.results).toBeDefined();
    });

    it('should handle tool errors gracefully', async () => {
      try {
        await client.callTool({
          name: 'gbif_species_get',
          arguments: {
            key: -1 // Invalid key
          }
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should validate tool input', async () => {
      try {
        await client.callTool({
          name: 'gbif_occurrence_search',
          arguments: {
            limit: -1 // Invalid limit
          }
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid');
      }
    });
  });

  describe('Tool Schemas', () => {
    it('should provide valid JSON schemas for all tools', async () => {
      const result = await client.listTools();

      for (const tool of result.tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });

    it('should have detailed parameter descriptions', async () => {
      const result = await client.listTools();
      const occurrenceSearch = result.tools.find(t => t.name === 'gbif_occurrence_search');

      expect(occurrenceSearch?.inputSchema.properties).toBeDefined();
      const props = occurrenceSearch?.inputSchema.properties as any;

      // Check that key parameters have descriptions
      expect(props.taxonKey?.description).toBeDefined();
      expect(props.taxonKey?.description.length).toBeGreaterThan(50);
      expect(props.country?.description).toContain('ISO');
    });
  });
});
```

**Step 2: Run the test**

Run: `npm run test:integration:mcp`
Expected: Tests run (may need to adjust based on actual MCP SDK API)

**Step 3: Commit**

```bash
git add tests/integration/mcp/mcp-protocol.test.ts
git commit -m "test: add MCP protocol integration tests

- Test tool discovery (57 tools)
- Test tool execution via MCP client
- Test schema validation
- Test error handling
- Use in-memory transport for fast tests"
```

---

## Task 11: Write MCP Size Limit Integration Tests

**Files:**
- Create: `tests/integration/mcp/mcp-size-limits.test.ts`

**Step 1: Write size limit tests**

Create `tests/integration/mcp/mcp-size-limits.test.ts`:

```typescript
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { OccurrenceSearchTool } from '../../../src/tools/occurrence/occurrence-search.tool.js';
import { OccurrenceService } from '../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { createLargeDataset, estimateSize } from '../setup.js';

describe('MCP Size Limits', () => {
  let tool: OccurrenceSearchTool;
  let service: OccurrenceService;
  let client: GBIFClient;

  beforeAll(() => {
    client = new GBIFClient();
    service = new OccurrenceService(client);
    tool = new OccurrenceSearchTool(service);
  });

  describe('Response Truncation', () => {
    it('should pass through small responses unchanged', async () => {
      const smallResult = {
        offset: 0,
        limit: 5,
        endOfRecords: false,
        count: 100,
        results: [
          { key: 1, scientificName: 'Test species', country: 'US' },
          { key: 2, scientificName: 'Test species 2', country: 'GB' },
        ],
      };

      vi.spyOn(service, 'search').mockResolvedValue(smallResult);

      const result: any = await tool.execute({ taxonKey: 1, limit: 5 });

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(2);
      expect((result as any).truncated).toBeUndefined();

      const size = estimateSize(result);
      expect(size).toBeLessThan(250); // Under 250KB
    });

    it('should truncate large responses', async () => {
      // Create response > 250KB
      const largeResults = createLargeDataset(
        (i) => ({
          key: i,
          scientificName: `Species ${i}`,
          country: 'US',
          locality: 'x'.repeat(1000), // Make each record large
          basisOfRecord: 'PRESERVED_SPECIMEN',
          eventDate: '2024-01-01',
          decimalLatitude: 40.0,
          decimalLongitude: -120.0,
        }),
        300 // Target 300KB
      );

      const largeResult = {
        offset: 0,
        limit: 300,
        endOfRecords: false,
        count: 5000,
        results: largeResults,
      };

      vi.spyOn(service, 'search').mockResolvedValue(largeResult);

      const result: any = await tool.execute({ taxonKey: 1, limit: 300 });

      expect(result.truncated).toBe(true);
      expect(result.metadata.totalCount).toBe(5000);
      expect(result.metadata.returnedCount).toBeLessThan(largeResults.length);
      expect(result.message).toContain('truncated');
      expect(result.pagination).toBeDefined();
      expect(result.pagination.suggestion).toContain('limit');

      const size = estimateSize(result);
      expect(size).toBeLessThan(250); // Must be under limit
    });

    it('should include pagination suggestions', async () => {
      const largeResults = createLargeDataset(
        (i) => ({
          key: i,
          scientificName: 'x'.repeat(500),
          data: 'y'.repeat(500),
        }),
        300
      );

      const largeResult = {
        offset: 0,
        limit: 300,
        count: 1000,
        results: largeResults,
      };

      vi.spyOn(service, 'search').mockResolvedValue(largeResult);

      const result: any = await tool.execute({
        taxonKey: 212,
        country: 'US',
        limit: 300
      });

      expect(result.truncated).toBe(true);
      expect(result.pagination.example).toHaveProperty('limit');
      expect(result.pagination.example).toHaveProperty('offset');
      expect(result.pagination.example.taxonKey).toBe(212);
      expect(result.pagination.example.country).toBe('US');
    });
  });

  describe('Size Calculations', () => {
    it('should accurately calculate response sizes', () => {
      const data = { test: 'data', numbers: [1, 2, 3] };
      const expectedSize = JSON.stringify(data).length;
      const actualSize = estimateSize(data);

      expect(actualSize).toBeGreaterThan(0);
      expect(Math.abs(actualSize * 1024 - expectedSize)).toBeLessThan(1024);
    });
  });
});
```

**Step 2: Run tests**

Run: `npm run test:integration:mcp`
Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/integration/mcp/mcp-size-limits.test.ts
git commit -m "test: add size limit integration tests

- Test small responses pass through unchanged
- Test large responses get truncated
- Test pagination suggestions are included
- Verify truncated responses stay under 250KB"
```

---

## Task 12: Write Real API Integration Tests

**Files:**
- Create: `tests/integration/api/gbif-species.integration.test.ts`
- Create: `tests/integration/api/gbif-occurrence.integration.test.ts`

**Step 1: Write species API integration test**

Create `tests/integration/api/gbif-species.integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { SpeciesService } from '../../../src/services/species/species.service.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';

describe('GBIF Species API Integration', () => {
  let service: SpeciesService;

  beforeAll(() => {
    service = new SpeciesService(new GBIFClient());
  });

  describe('Species Search', () => {
    it('should search for Panthera leo', async () => {
      const results = await service.search({
        q: 'Panthera leo',
        limit: 5
      });

      expect(results.count).toBeGreaterThan(0);
      expect(results.results).toBeDefined();
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].scientificName).toContain('Panthera');
    }, 10000);

    it('should filter by rank', async () => {
      const results = await service.search({
        q: 'Panthera',
        rank: 'GENUS',
        limit: 5
      });

      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].rank).toBe('GENUS');
    }, 10000);

    it('should search with habitat filter', async () => {
      const results = await service.search({
        habitat: ['MARINE'],
        limit: 10
      });

      expect(results.count).toBeGreaterThan(0);
      expect(results.results.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Species Lookup', () => {
    it('should get species by key', async () => {
      // Panthera leo key
      const species = await service.getByKey(5219404);

      expect(species.key).toBe(5219404);
      expect(species.scientificName).toContain('Panthera leo');
      expect(species.rank).toBe('SPECIES');
    }, 10000);

    it('should get species with full taxonomy', async () => {
      const species = await service.getByKey(5219404);

      expect(species.kingdom).toBeDefined();
      expect(species.phylum).toBeDefined();
      expect(species.class).toBeDefined();
      expect(species.order).toBeDefined();
      expect(species.family).toBeDefined();
      expect(species.genus).toBeDefined();
    }, 10000);
  });

  describe('Species Names', () => {
    it('should get vernacular names', async () => {
      const names = await service.getVernacularNames(5219404, { limit: 10 });

      expect(names.results.length).toBeGreaterThan(0);
      expect(names.results.some(n => n.language === 'eng')).toBe(true);
    }, 10000);

    it('should get synonyms', async () => {
      const synonyms = await service.getSynonyms(5219404, { limit: 5 });

      expect(synonyms.results).toBeDefined();
    }, 10000);
  });
});
```

**Step 2: Write occurrence API integration test**

Create `tests/integration/api/gbif-occurrence.integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { OccurrenceService } from '../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';

describe('GBIF Occurrence API Integration', () => {
  let service: OccurrenceService;

  beforeAll(() => {
    service = new OccurrenceService(new GBIFClient());
  });

  describe('Occurrence Search', () => {
    it('should search occurrences by taxon', async () => {
      const results = await service.search({
        taxonKey: 5219404, // Panthera leo
        limit: 10
      });

      expect(results.count).toBeGreaterThan(0);
      expect(results.results).toBeDefined();
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].taxonKey).toBeDefined();
    }, 15000);

    it('should filter by country', async () => {
      const results = await service.search({
        taxonKey: 5219404,
        country: 'KE', // Kenya
        limit: 10
      });

      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results.every(r => r.country === 'KE')).toBe(true);
    }, 15000);

    it('should filter by coordinates', async () => {
      const results = await service.search({
        hasCoordinate: true,
        decimalLatitude: '-1.5,1.5',
        decimalLongitude: '35,37',
        limit: 10
      });

      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results.every(r =>
        r.decimalLatitude !== undefined &&
        r.decimalLongitude !== undefined
      )).toBe(true);
    }, 15000);

    it('should filter by year', async () => {
      const results = await service.search({
        taxonKey: 212, // Birds
        year: '2020',
        limit: 10
      });

      expect(results.count).toBeGreaterThan(0);
      expect(results.results.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Occurrence Count', () => {
    it('should count occurrences', async () => {
      const count = await service.count({
        taxonKey: 212 // Birds
      });

      expect(count).toBeGreaterThan(1000000); // Millions of bird records
    }, 15000);

    it('should count with filters', async () => {
      const count = await service.count({
        taxonKey: 212,
        country: 'US'
      });

      expect(count).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Occurrence Get', () => {
    it('should get specific occurrence', async () => {
      // First search for an occurrence
      const searchResults = await service.search({
        taxonKey: 5219404,
        limit: 1
      });

      expect(searchResults.results.length).toBeGreaterThan(0);
      const occurrenceKey = searchResults.results[0].key;

      // Then get it by key
      const occurrence = await service.getByKey(occurrenceKey);

      expect(occurrence.key).toBe(occurrenceKey);
      expect(occurrence.scientificName).toBeDefined();
    }, 15000);
  });
});
```

**Step 3: Run integration tests**

Run: `npm run test:integration:api`
Expected: Tests pass (requires network connection)

**Step 4: Commit**

```bash
git add tests/integration/api/
git commit -m "test: add real GBIF API integration tests

- Test species search, lookup, and names
- Test occurrence search with various filters
- Test occurrence count and individual lookup
- All tests use real GBIF API (15s timeout)"
```

---

## Task 13: Update Existing Unit Tests with Size Checks

**Files:**
- Modify: `tests/unit/tools/occurrence/occurrence-search.tool.test.ts:40-76`

**Step 1: Add truncation test cases**

Add to `tests/unit/tools/occurrence/occurrence-search.tool.test.ts` after existing tests:

```typescript
  describe('Response Size Limiting', () => {
    it('should pass through small responses', async () => {
      const smallResult = {
        offset: 0,
        limit: 10,
        endOfRecords: true,
        count: 10,
        results: Array(10).fill({
          key: 123,
          scientificName: 'Test species',
          country: 'US'
        }),
      };

      vi.spyOn(occurrenceService, 'search').mockResolvedValue(smallResult);

      const result: any = await tool.execute({ taxonKey: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect((result as any).truncated).toBeUndefined();
    });

    it('should truncate large responses', async () => {
      // Create a very large response
      const largeResults = Array(5000).fill(null).map((_, i) => ({
        key: i,
        scientificName: 'Very long scientific name that takes space'.repeat(50),
        locality: 'x'.repeat(1000),
        eventDate: '2024-01-01',
        country: 'US'
      }));

      const largeResult = {
        offset: 0,
        limit: 300,
        endOfRecords: false,
        count: 5000,
        results: largeResults,
      };

      vi.spyOn(occurrenceService, 'search').mockResolvedValue(largeResult);

      const result: any = await tool.execute({ taxonKey: 1, limit: 300 });

      expect(result.truncated).toBe(true);
      expect(result.metadata.totalCount).toBe(5000);
      expect(result.metadata.returnedCount).toBeLessThan(5000);
      expect(result.message).toContain('truncated');
    });
  });
```

**Step 2: Run updated tests**

Run: `npm run test:unit`
Expected: All tests pass including new ones

**Step 3: Commit**

```bash
git add tests/unit/tools/occurrence/occurrence-search.tool.test.ts
git commit -m "test: add size limit tests to occurrence search tool

- Test small responses pass through
- Test large responses get truncated
- Verify metadata is preserved"
```

---

## Task 14: Final Verification and Documentation

**Files:**
- Modify: `README.md` (add section about size limits)

**Step 1: Run all tests**

Run: `npm run test:all`
Expected: All unit and integration tests pass

**Step 2: Build project**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Run type checking**

Run: `npm run typecheck`
Expected: No TypeScript errors

**Step 4: Test with real server**

Run server in one terminal:
```bash
npm start
```

Test with a query that would be large to verify truncation works.

**Step 5: Update README with size limits section**

Add section to `README.md` after Features section:

```markdown
## Response Size Limits

To ensure compatibility with AI context windows, this server implements automatic response size limiting:

- **Maximum Response Size**: 250KB (configurable via `RESPONSE_MAX_SIZE_KB`)
- **Warning Threshold**: 200KB (logs warnings for optimization)
- **Smart Truncation**: Large responses are automatically truncated with helpful pagination guidance

### Configuration

Control response limiting via environment variables:

```bash
RESPONSE_MAX_SIZE_KB=250              # Maximum response size
RESPONSE_WARN_SIZE_KB=200             # Warning threshold
RESPONSE_ENABLE_TRUNCATION=true       # Enable smart truncation
RESPONSE_ENABLE_SIZE_LOGGING=true     # Log size metrics
```

### Truncated Responses

When a response exceeds the size limit, you'll receive:

```json
{
  "truncated": true,
  "originalSize": "1.2MB",
  "returnedSize": "248KB",
  "metadata": {
    "totalCount": 1000,
    "returnedCount": 23
  },
  "pagination": {
    "suggestion": "Use limit=20 with offset=0, then offset=20, offset=40...",
    "example": { "taxonKey": 212, "limit": 20, "offset": 0 }
  },
  "data": { ... }
}
```
```

**Step 6: Final commit**

```bash
git add README.md
git commit -m "docs: document response size limits feature

- Add configuration section
- Explain truncation behavior
- Show example truncated response
- Document environment variables"
```

**Step 7: Create summary of changes**

Run: `git log --oneline --since="1 day ago"`

This shows all commits made during implementation.

---

## Summary

This plan implements:

✅ Three-layer response size limiting (250KB default)
✅ Smart truncation with pagination guidance
✅ Comprehensive unit tests for truncation logic
✅ MCP protocol integration tests (mocked)
✅ Real GBIF API integration tests
✅ Configuration via environment variables
✅ Helpful error messages and logging
✅ Documentation

**Total Tasks**: 14
**Estimated Time**: 3-4 hours
**Test Coverage**: 80%+ on new code

All code follows TDD principles, YAGNI, and DRY. Each task is independently testable and committable.
