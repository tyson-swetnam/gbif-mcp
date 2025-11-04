# GBIF MCP Server Architecture

## Overview

The GBIF MCP Server provides access to the Global Biodiversity Information Facility (GBIF) API through the Model Context Protocol. It implements a clean, layered architecture with clear separation of concerns, robust error handling, and efficient resource management.

## Architecture Principles

1. **Layered Architecture**: Clean separation between transport, protocol, business logic, and external API layers
2. **Domain-Driven Design**: Each GBIF API section is encapsulated in its own service module
3. **Dependency Injection**: Services are injected to improve testability and maintainability
4. **Error Resilience**: Comprehensive error handling at each layer with meaningful error messages
5. **Performance Optimization**: Intelligent caching, request batching, and rate limiting
6. **Type Safety**: Full TypeScript implementation with strict typing throughout

## System Components

### Core Layers

```
┌─────────────────────────────────────────────────┐
│                MCP Transport Layer               │
│               (stdio communication)              │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              MCP Protocol Handler                │
│        (Tool registration & execution)           │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              Tool Orchestrator                   │
│     (Request validation & transformation)        │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│             Service Layer                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Species  │ │Occurrence│ │Registry │  ...      │
│  │Service  │ │Service   │ │Service  │           │
│  └─────────┘ └─────────┘ └─────────┘           │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│               GBIF API Client                    │
│    (HTTP client, auth, rate limiting, retry)    │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│            External GBIF API                     │
│         (https://api.gbif.org/v1)               │
└─────────────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. MCP Transport Layer
- Handles stdio communication with MCP clients
- Manages connection lifecycle
- Serializes/deserializes JSON-RPC messages

#### 2. MCP Protocol Handler
- Implements MCP server capabilities
- Registers and manages tools
- Handles protocol-level errors
- Manages server metadata and versioning

#### 3. Tool Orchestrator
- Validates incoming tool requests
- Transforms parameters to service layer format
- Aggregates responses from multiple services
- Handles cross-cutting concerns (logging, metrics)

#### 4. Service Layer
- **Species Service**: Species lookup, search, suggestions
- **Occurrence Service**: Occurrence search, downloads, metrics
- **Registry Service**: Datasets, organizations, installations
- **Maps Service**: Map tiles and overlays
- **Literature Service**: Literature search and citations
- **Vocabularies Service**: Controlled vocabularies and concepts
- **Validator Service**: Data validation endpoints

#### 5. GBIF API Client
- Manages HTTP connections
- Implements authentication flow
- Handles rate limiting with exponential backoff
- Provides request retry logic
- Caches responses where appropriate

## Data Flow

### Request Flow
1. MCP client sends tool invocation request
2. Transport layer deserializes request
3. Protocol handler validates and routes to tool
4. Tool orchestrator validates parameters
5. Service layer processes business logic
6. API client makes HTTP request to GBIF
7. Response flows back through layers with transformation

### Error Flow
- Each layer catches and enriches errors
- Protocol errors vs business errors are distinguished
- User-friendly error messages are provided
- Stack traces are logged but not exposed

## Security Model

### Authentication
- Environment variables for GBIF credentials
- Credentials never exposed in logs or responses
- OAuth2 token management for authenticated endpoints
- Secure credential storage patterns

### Rate Limiting
- Per-endpoint rate limit tracking
- Exponential backoff on 429 responses
- Request queue management
- Circuit breaker pattern for repeated failures

## Caching Strategy

### Response Caching
- In-memory LRU cache for frequent requests
- TTL based on data volatility
- Cache invalidation on updates
- Configurable cache size limits

### Request Deduplication
- Identical concurrent requests share responses
- Request signature generation
- Promise-based request coalescence

## Monitoring & Observability

### Logging
- Structured logging with correlation IDs
- Log levels: ERROR, WARN, INFO, DEBUG
- Sensitive data masking
- Rotating file logs with size limits

### Metrics
- Request/response times per endpoint
- Error rates and types
- Cache hit/miss ratios
- Rate limit encounters

## Deployment Considerations

### Environment Configuration
- `.env` file for local development
- Environment variable validation on startup
- Configuration schema with defaults
- Secret management best practices

### Resource Requirements
- Memory: ~256MB baseline, scales with cache
- CPU: Single-threaded Node.js process
- Network: Handles concurrent API requests
- Storage: Minimal, logs and cache only

## Testing Strategy

### Unit Tests
- Service layer business logic
- Parameter validation
- Data transformation functions
- Error handling scenarios

### Integration Tests
- Mock GBIF API responses
- End-to-end tool invocations
- Error propagation testing
- Rate limit simulation

### Performance Tests
- Concurrent request handling
- Memory leak detection
- Cache effectiveness
- Response time benchmarks