# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides programmatic access to the GBIF (Global Biodiversity Information Facility) API. The server enables AI assistants to interact with GBIF's biodiversity data including species information, occurrence records, datasets, organizations, maps, literature, and vocabularies.

**Current Status**: Early initialization stage - only documentation and configuration files exist. The actual MCP server implementation needs to be built.

## Development Commands

As of initial setup, the following commands are planned (per README.md):

```bash
npm install          # Install dependencies
npm run build        # Build the TypeScript server
npm run dev          # Run in development mode
npm test             # Run tests
npm run lint         # Lint code
```

Note: `package.json` and build configuration do not exist yet and need to be created.

## Architecture Overview

### MCP Server Design

The server should implement the Model Context Protocol to expose GBIF API endpoints as MCP tools. The architecture will consist of:

1. **MCP Protocol Layer**: Handles MCP protocol communication (tools, resources, prompts)
2. **GBIF API Client**: Makes HTTP requests to GBIF API endpoints (base URL: https://api.gbif.org/v1)
3. **Tool Definitions**: Maps GBIF API operations to MCP tools
4. **Response Formatting**: Transforms GBIF API responses into MCP-compatible formats

### GBIF API Coverage

The server should provide access to these GBIF API sections:

- **Species API**: Taxonomic information, species search, name matching
- **Occurrence API**: Species occurrence records with filtering
- **Registry API**: Datasets and publishing organizations
- **Maps API**: Biodiversity data visualizations
- **Literature API**: Research papers citing GBIF data
- **Vocabularies API**: Standardized biodiversity terminology
- **Validator API**: Data quality checks

### Key Implementation Considerations

1. **Authentication**: GBIF API is mostly open, but some endpoints may require credentials (GBIF_USERNAME, GBIF_PASSWORD from .env)
2. **Rate Limiting**: Implement appropriate rate limiting and error handling for GBIF API requests
3. **Pagination**: GBIF API uses pagination - tools should handle large result sets appropriately
4. **Data Transformation**: GBIF returns complex nested JSON - should be formatted clearly for AI consumption
5. **Error Handling**: Gracefully handle API errors, network issues, and invalid parameters

## Configuration

- Environment variables go in `.env` (use `.env.example` as template)
- GBIF API credentials are optional but may be needed for authenticated endpoints
- MCP server configuration should support Claude Desktop and other MCP clients

## Entry Point

The built server will be executed via: `node build/index.js`

This should start the MCP server using stdio transport (standard for MCP servers).

## Technology Stack

Based on README and MCP server patterns:
- **Language**: TypeScript
- **Runtime**: Node.js
- **Protocol**: MCP (stdio transport)
- **HTTP Client**: Will need a library for GBIF API requests (e.g., axios, node-fetch)
- **MCP SDK**: @modelcontextprotocol/sdk

## Git Workflow

**CRITICAL**: After successfully completing each prompt or task, you MUST commit the changes to git. This ensures proper version control and allows tracking of all development progress.

### Commit Workflow

After completing any task that modifies files:

1. **Stage the changes**:
   ```bash
   git add .
   ```

2. **Create a descriptive commit**:
   ```bash
   git commit -m "Brief description of what was accomplished"
   ```

### Commit Message Guidelines

Use clear, descriptive commit messages that explain what was done:

- ✅ Good: `"Add Species API service with search and match endpoints"`
- ✅ Good: `"Implement rate limiting and caching for GBIF client"`
- ✅ Good: `"Create MCP tool wrappers for occurrence search"`
- ✅ Good: `"Add unit tests for species service"`
- ❌ Bad: `"Update files"`
- ❌ Bad: `"Changes"`
- ❌ Bad: `"WIP"`

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

Example:
```bash
git add src/services/species/ src/types/species.ts tests/unit/species.test.ts
git commit -m "Implement Species API service with search, match, and suggest endpoints"
```

### Do NOT Commit

- Temporary files
- `.env` files with credentials
- `node_modules/`
- Build artifacts in `build/` or `dist/`
- IDE-specific files (already in `.gitignore`)

These are already excluded via `.gitignore`, but double-check before committing.

## License

Creative Commons Attribution 4.0 International License - allows sharing and adaptation with attribution.
