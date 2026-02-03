# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides programmatic access to the GBIF (Global Biodiversity Information Facility) API. The server enables AI assistants to interact with GBIF's biodiversity data including species information, occurrence records, datasets, organizations, maps, literature, and vocabularies.

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript to build/ directory
npm run dev          # Run in development mode with watch (uses tsx)
npm start            # Run built server from build/index.js
npm test             # Run tests with Vitest
npm run test:coverage # Run tests with coverage report
npm run lint         # Lint TypeScript files in src/
npm run format       # Format code with Prettier
npm run clean        # Remove build directory
npm run typecheck    # Type-check without emitting files
```

## Architecture Overview

### Layered Architecture

The codebase follows a clean, layered architecture with clear separation of concerns:

```
MCP Transport (stdio) → MCP Protocol Handler → Tool Orchestrator → Service Layer → GBIF Client → GBIF API
```

**Key Components:**

1. **Entry Point** (`src/index.ts`): Main server initialization, tool registration, request handling, graceful shutdown, and statistics tracking

2. **GBIF Client** (`src/core/gbif-client.ts`): Centralized HTTP client with:
   - Circuit breaker pattern (CLOSED → OPEN → HALF_OPEN states)
   - LRU cache for responses
   - Request queue with concurrency control (p-queue)
   - Rate limiting (max requests per minute)
   - Exponential backoff for retries
   - Automatic retry for 5xx errors and 429 rate limits

3. **Tool Registry** (`src/core/tool-registry.ts`): Manages MCP tool registration and lookup

4. **Service Layer** (`src/services/`): Domain-specific business logic:
   - `species.service.ts` - Taxonomic operations
   - `occurrence.service.ts` - Occurrence data queries
   - Each service wraps GBIF API endpoints with domain logic

5. **Tool Layer** (`src/tools/`): MCP tools that expose services:
   - Inherit from `BaseTool` abstract class
   - Use Zod schemas for input validation
   - Convert Zod to JSON Schema via `zod-to-json-schema`
   - Each tool implements the `run(input)` method

6. **Protocol Layer** (`src/protocol/`): MCP-specific error handling and request context

### Tool Implementation Pattern

All tools follow this pattern:

```typescript
class ExampleTool extends BaseTool<InputType, OutputType> {
  protected name = 'tool_name';
  protected description = 'What this tool does';
  protected inputSchema = z.object({ /* zod schema */ });

  protected async run(input: InputType): Promise<OutputType> {
    // Tool logic using injected service
  }
}
```

Tools are registered in `src/index.ts` during server initialization.

## TypeScript Configuration

- **Target**: ES2022
- **Module System**: NodeNext (ESM with `.js` extensions in imports)
- **Output**: `build/` directory
- **Strict Mode**: Enabled with all strict checks
- **Source Maps**: Generated for debugging

**Important**: Always use `.js` extensions in imports (e.g., `from './config.js'`) because this is an ESM project. TypeScript will resolve to `.ts` files during compilation but emit correct `.js` paths.

## Testing

- **Framework**: Vitest with v8 coverage provider
- **Test Files**: `tests/**/*.test.ts`
- **Setup**: `tests/setup.ts` runs before tests
- **Coverage**: Excludes types, index.ts, and test files
- Run single test: `npm test -- tests/unit/species.service.test.ts`
- Run with UI: `npm test -- --ui`

## Configuration & Environment

- Configuration in `src/config/config.ts` loads from environment variables
- `.env.example` shows available options
- Key settings:
  - `GBIF_BASE_URL` - API base URL (default: https://api.gbif.org/v1)
  - `GBIF_USERNAME` / `GBIF_PASSWORD` - Optional credentials for downloads
  - `RATE_LIMIT_MAX_REQUESTS` - Max requests per minute
  - `CACHE_ENABLED` / `CACHE_MAX_SIZE` / `CACHE_TTL` - Caching settings
  - `LOG_LEVEL` - Logging verbosity (error/warn/info/debug)

## Logging

- **Library**: Winston (configured in `src/utils/logger.ts`)
- **Transport**: Logs to stderr (stdout is reserved for MCP protocol)
- **Format**: JSON structured logging
- **Correlation IDs**: Tracked through request context in `RequestHandler.withContext()`

## Error Handling

The codebase has comprehensive error handling:

1. **Circuit Breaker**: Prevents cascading failures when GBIF API is down
   - Opens after 5 consecutive failures
   - Enters HALF_OPEN after 1 minute timeout
   - Closes after 2 consecutive successes in HALF_OPEN

2. **MCP Errors** (`src/protocol/mcp-errors.ts`): Standardized error codes and formatting

3. **Tool Errors** (`src/tools/base-tool.ts`): Transform HTTP status codes to user-friendly messages

4. **Graceful Shutdown**: Handles SIGINT/SIGTERM/SIGHUP, logs final statistics, closes connections

## MCP Protocol Details

- **Transport**: stdio (StdioServerTransport)
- **Capabilities**: Currently only `tools` (resources and prompts can be added later)
- **Handlers**:
  - `ListToolsRequestSchema` - Returns all registered tools
  - `CallToolRequestSchema` - Executes a tool with validation
- **Response Format**: JSON with `content` array containing `text` type

## GBIF API Integration

- **Base URL**: https://api.gbif.org/v1
- **Authentication**: Basic auth via Axios interceptor (when credentials provided)
- **Pagination**: GBIF uses `offset`/`limit` with `endOfRecords` flag
- **Rate Limiting**: Client-side enforcement + backoff on 429 responses
- **Retry Strategy**: Exponential backoff for 5xx, configurable retry attempts

## Service Extensibility

To add a new GBIF API section:

1. Create service in `src/services/[name]/[name].service.ts`
2. Create tools in `src/tools/[name]/` inheriting from `BaseTool`
3. Register tools in `src/index.ts` `initializeServices()` method
4. Add types to `src/types/gbif.types.ts` if needed

## Git Workflow

**CRITICAL**: After successfully completing each prompt or task, you MUST commit the changes to git. This ensures proper version control and allows tracking of all development progress.

### Commit Workflow

After completing any task that modifies files:

1. Stage the changes: `git add .`
2. Create a descriptive commit: `git commit -m "Brief description of what was accomplished"`

### Commit Message Guidelines

Use clear, descriptive commit messages that explain what was done:

- ✅ Good: "Add Species API service with search and match endpoints"
- ✅ Good: "Implement rate limiting and caching for GBIF client"
- ✅ Good: "Create MCP tool wrappers for occurrence search"
- ✅ Good: "Add unit tests for species service"
- ❌ Bad: "Update files"
- ❌ Bad: "Changes"

### When to Commit

Commit after:
- Implementing a new feature or component
- Fixing a bug or error
- Adding tests
- Updating documentation
- Completing a phase or milestone
- Any logical unit of work that adds value

### Multi-file Changes

When multiple related files are created or modified together (e.g., a service + its tests + types), commit them together with a message describing the complete feature.

## Docker Support

- **Dockerfile**: Multi-stage build using Node 20 Alpine
- **Image Size**: ~150MB optimized
- **Security**: Non-root user (uid 1001), read-only filesystem
- **Health Check**: Built-in
- **Usage**: `docker build -t gbif-mcp .` then `docker run -i gbif-mcp`

## License

Creative Commons Attribution 4.0 International License - allows sharing and adaptation with attribution.
