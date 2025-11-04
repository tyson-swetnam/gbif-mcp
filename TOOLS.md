# GBIF MCP Server - Tool Reference

This document provides a comprehensive reference for all MCP tools available in the GBIF MCP Server.

## Overview

**Total Tools**: 18 (11 Species + 7 Occurrence)

All tools follow consistent patterns:
- Input validation using Zod schemas
- Comprehensive error handling
- Formatted JSON responses with metadata
- Pagination support where applicable
- Clear descriptions for AI consumption

---

## Species Tools (11 tools)

Tools for accessing GBIF's taxonomic backbone and species information.

### 1. gbif_species_search

**Description**: Search for species in the GBIF taxonomic backbone with extensive filtering options.

**Input Parameters**:
```typescript
{
  q?: string;                    // Search query
  rank?: TaxonomicRank;          // Filter by rank (KINGDOM, PHYLUM, CLASS, etc.)
  higherTaxonKey?: number;       // Filter by higher taxon
  status?: TaxonomicStatus[];    // Status filter (ACCEPTED, SYNONYM, etc.)
  isExtinct?: boolean;           // Extinct species only
  habitat?: Habitat[];           // MARINE, FRESHWATER, TERRESTRIAL
  threat?: ThreatStatus[];       // IUCN status (CR, EN, VU, etc.)
  nameType?: NameType[];         // Name type filters
  datasetKey?: string[];         // Dataset filters
  limit?: number;                // Max 1000, default 20
  offset?: number;               // Pagination offset
  facet?: string[];              // Facet fields
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_search",
    "arguments": {
      "q": "Puma concolor",
      "rank": "SPECIES",
      "status": ["ACCEPTED"],
      "limit": 10
    }
  }
}
```

---

### 2. gbif_species_get

**Description**: Get detailed information about a specific species by its GBIF key.

**Input Parameters**:
```typescript
{
  key: number;  // GBIF species key (required)
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_get",
    "arguments": {
      "key": 2435099
    }
  }
}
```

**Use Case**: Retrieve complete species information including classification, nomenclatural details, and references.

---

### 3. gbif_species_match

**Description**: Fuzzy match a species name against the GBIF backbone taxonomy. Critical for name standardization.

**Input Parameters**:
```typescript
{
  name: string;     // Species name to match (required)
  strict?: boolean; // Use strict matching (default: false)
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_match",
    "arguments": {
      "name": "Puma concolor",
      "strict": false
    }
  }
}
```

**Response Fields**: matchType, confidence, scientificName, key, rank, status

---

### 4. gbif_species_suggest

**Description**: Get species name suggestions for autocomplete functionality.

**Input Parameters**:
```typescript
{
  q: string;       // Partial name (min 2 chars, required)
  limit?: number;  // Max suggestions (default: 10, max: 100)
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_suggest",
    "arguments": {
      "q": "Pum",
      "limit": 5
    }
  }
}
```

---

### 5. gbif_species_vernacular_names

**Description**: Get common names for a species in multiple languages.

**Input Parameters**:
```typescript
{
  key: number;        // GBIF species key (required)
  language?: string;  // ISO 639-1 code (e.g., "en", "es")
  limit?: number;     // Default 20
  offset?: number;    // Pagination offset
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_vernacular_names",
    "arguments": {
      "key": 2435099,
      "language": "en"
    }
  }
}
```

**Response**: Returns vernacularName, language, preferred flag, and source.

---

### 6. gbif_species_synonyms

**Description**: Get all synonyms and alternative scientific names for a species.

**Input Parameters**:
```typescript
{
  key: number;      // GBIF species key (required)
  limit?: number;   // Default 20
  offset?: number;  // Pagination offset
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_synonyms",
    "arguments": {
      "key": 2435099
    }
  }
}
```

---

### 7. gbif_species_children

**Description**: Get direct taxonomic children (e.g., species under a genus).

**Input Parameters**:
```typescript
{
  key: number;      // Parent taxon key (required)
  limit?: number;   // Default 20
  offset?: number;  // Pagination offset
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_children",
    "arguments": {
      "key": 2435098
    }
  }
}
```

**Use Case**: Explore taxonomy hierarchically, e.g., find all species in a genus.

---

### 8. gbif_species_parents

**Description**: Get the complete taxonomic classification path from kingdom to species.

**Input Parameters**:
```typescript
{
  key: number;  // GBIF species key (required)
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_parents",
    "arguments": {
      "key": 2435099
    }
  }
}
```

**Response**: Array of parent taxa from kingdom down to immediate parent.

---

### 9. gbif_species_descriptions

**Description**: Get textual descriptions for a species from various sources.

**Input Parameters**:
```typescript
{
  key: number;      // GBIF species key (required)
  limit?: number;   // Default 20
  offset?: number;  // Pagination offset
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_descriptions",
    "arguments": {
      "key": 2435099
    }
  }
}
```

---

### 10. gbif_species_distributions

**Description**: Get known geographic distribution records for a species.

**Input Parameters**:
```typescript
{
  key: number;      // GBIF species key (required)
  limit?: number;   // Default 20
  offset?: number;  // Pagination offset
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_distributions",
    "arguments": {
      "key": 2435099
    }
  }
}
```

---

### 11. gbif_species_media

**Description**: Get multimedia (images, sounds, videos) associated with a species.

**Input Parameters**:
```typescript
{
  key: number;      // GBIF species key (required)
  limit?: number;   // Default 20
  offset?: number;  // Pagination offset
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_species_media",
    "arguments": {
      "key": 2435099
    }
  }
}
```

**Response**: Media URLs, types, formats, licenses, and sources.

---

## Occurrence Tools (7 tools)

Tools for accessing GBIF occurrence records (observations and specimens).

### 1. gbif_occurrence_search

**Description**: Search occurrence records with comprehensive filtering. Supports up to 100,000 records via pagination.

**Input Parameters** (extensive - showing key ones):
```typescript
{
  // Text search
  q?: string;
  scientificName?: string;

  // Taxonomic filters
  taxonKey?: number;
  kingdomKey?: number;
  phylumKey?: number;
  classKey?: number;
  orderKey?: number;
  familyKey?: number;
  genusKey?: number;

  // Geographic filters
  country?: string;              // ISO code
  continent?: Continent;
  geometry?: string;             // WKT geometry
  hasCoordinate?: boolean;
  decimalLatitude?: number;
  decimalLongitude?: number;

  // Temporal filters
  year?: string;                 // "2020" or "2015,2020"
  month?: number;                // 1-12

  // Dataset filters
  datasetKey?: string;
  publishingOrg?: string;

  // Array filters
  basisOfRecord?: BasisOfRecord[];
  issue?: string[];
  mediaType?: MediaType[];

  // Faceting
  facet?: string[];
  facetMincount?: number;

  // Pagination
  limit?: number;                // Default 20, max 300
  offset?: number;               // Max 100,000
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_occurrence_search",
    "arguments": {
      "taxonKey": 2435099,
      "country": "US",
      "hasCoordinate": true,
      "year": "2020,2024",
      "limit": 50,
      "facet": ["basisOfRecord", "year"]
    }
  }
}
```

---

### 2. gbif_occurrence_get

**Description**: Get complete details for a single occurrence record.

**Input Parameters**:
```typescript
{
  key: number;  // GBIF occurrence key (required)
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_occurrence_get",
    "arguments": {
      "key": 1234567890
    }
  }
}
```

---

### 3. gbif_occurrence_count

**Description**: Fast counting endpoint without retrieving full records. Perfect for statistics.

**Input Parameters**: Same filters as search (but no pagination/facets)

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_occurrence_count",
    "arguments": {
      "taxonKey": 2435099,
      "country": "US",
      "year": "2020,2024"
    }
  }
}
```

**Response**: Simple count number.

---

### 4. gbif_occurrence_download_request

**Description**: Request asynchronous download for large datasets (>100k records). **Requires authentication**.

**Authentication Required**: Set `GBIF_USERNAME` and `GBIF_PASSWORD` environment variables.

**Input Parameters**:
```typescript
{
  creator: string;                    // GBIF username (required)
  notificationAddresses?: string[];   // Email addresses
  sendNotification?: boolean;         // Default: true
  format?: 'DWCA' | 'SIMPLE_CSV' | 'SPECIES_LIST';  // Default: SIMPLE_CSV
  predicate: DownloadPredicate;       // Filter predicate (required)
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_occurrence_download_request",
    "arguments": {
      "creator": "myusername",
      "format": "SIMPLE_CSV",
      "sendNotification": true,
      "notificationAddresses": ["user@example.com"],
      "predicate": {
        "type": "and",
        "predicates": [
          { "type": "equals", "key": "TAXON_KEY", "value": "2435099" },
          { "type": "equals", "key": "COUNTRY", "value": "US" },
          { "type": "greaterThanOrEquals", "key": "YEAR", "value": "2020" }
        ]
      }
    }
  }
}
```

**Response**: Download key for status checking.

---

### 5. gbif_occurrence_download_predicate_builder

**Description**: Helper tool to convert simple search parameters to download predicate format.

**Input Parameters**: Subset of occurrence search parameters

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_occurrence_download_predicate_builder",
    "arguments": {
      "taxonKey": 2435099,
      "country": "US",
      "year": "2020,2024",
      "hasCoordinate": true
    }
  }
}
```

**Response**: Formatted predicate ready for use in download request.

---

### 6. gbif_occurrence_download_status

**Description**: Check download status and get download link when ready.

**Input Parameters**:
```typescript
{
  downloadKey: string;  // Key from download request (required)
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_occurrence_download_status",
    "arguments": {
      "downloadKey": "0001234-567890123456789"
    }
  }
}
```

**Possible Status Values**:
- `PREPARING` - Being prepared
- `RUNNING` - Processing records
- `SUCCEEDED` - Complete, download link available
- `FAILED` - Failed
- `CANCELLED` - Cancelled by user
- `KILLED` - Terminated
- `SUSPENDED` - Suspended

---

### 7. gbif_occurrence_verbatim

**Description**: Get the original, unprocessed occurrence record with Darwin Core URIs.

**Input Parameters**:
```typescript
{
  key: number;  // GBIF occurrence key (required)
}
```

**Example MCP Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gbif_occurrence_verbatim",
    "arguments": {
      "key": 1234567890
    }
  }
}
```

**Response**: Original fields with full Darwin Core term URIs.

---

## Tool Integration Patterns

### Workflow Examples

#### 1. Complete Species Research Workflow

```
1. Search for species: gbif_species_search
2. Get details: gbif_species_get
3. Get common names: gbif_species_vernacular_names
4. Get images: gbif_species_media
5. View taxonomy: gbif_species_parents
6. Find occurrences: gbif_occurrence_search
```

#### 2. Data Quality Analysis Workflow

```
1. Count total occurrences: gbif_occurrence_count
2. Search with filters: gbif_occurrence_search (with facets)
3. Get individual records: gbif_occurrence_get
4. Check verbatim data: gbif_occurrence_verbatim
```

#### 3. Large Dataset Download Workflow

```
1. Test query: gbif_occurrence_search (with limit)
2. Build predicate: gbif_occurrence_download_predicate_builder
3. Request download: gbif_occurrence_download_request
4. Check status: gbif_occurrence_download_status
5. Download file from provided link
```

---

## Response Format

All tools return responses in this structure:

```json
{
  "success": true,
  "data": {
    // Actual response data
  },
  "metadata": {
    "tool": "tool_name",
    "timestamp": "2024-11-04T12:00:00Z",
    // Tool-specific metadata
  }
}
```

---

## Error Handling

Tools provide clear error messages for common issues:

- **400**: Invalid request parameters
- **401**: Authentication required (for download tools)
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500-503**: GBIF service issues

All errors are transformed to user-friendly messages with context.

---

## Pagination Guidelines

**Search Tools**:
- Species search: max offset unlimited, limit 1-1000 (recommended 20-100)
- Occurrence search: max offset 100,000, limit 1-300 (recommended 20-100)

**For Large Datasets**:
- Use count tool to estimate size
- If >100,000 records, use download API
- Use facets for aggregations without pagination

---

## Best Practices

1. **Start Specific**: Use count/suggest tools before full searches
2. **Use Keys**: Species/occurrence keys are stable identifiers
3. **Enable Facets**: Get aggregations in single request
4. **Download Wisely**: Use download API for >10k records
5. **Cache Results**: Species data changes infrequently
6. **Handle Pagination**: Respect limits and offsets

---

## Testing Tools

Use MCP inspector or direct JSON-RPC calls:

```bash
# List all tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Call a tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"gbif_species_search","arguments":{"q":"Puma"}}}' | node build/index.js
```

---

## Next Steps

After Phase 5 completion:
- Phase 6: Registry Service (datasets, organizations)
- Phase 7: Testing & Documentation
- Phase 8: Advanced features (maps, literature)

See [PLANNING.md](./docs/PLANNING.md) for full roadmap.
