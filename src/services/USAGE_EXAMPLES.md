# GBIF Services Usage Examples

This document provides comprehensive usage examples for the Species and Occurrence services.

## Setup

```typescript
import { GBIFClient } from '../core/gbif-client.js';
import { SpeciesService, OccurrenceService } from './index.js';

// Initialize client and services
const client = new GBIFClient();
const speciesService = new SpeciesService(client);
const occurrenceService = new OccurrenceService(client);
```

## Species Service Examples

### 1. Search Species

```typescript
// Basic search
const results = await speciesService.search({
  q: "Puma concolor",
  limit: 10
});

// Advanced search with filters
const filtered = await speciesService.search({
  q: "Puma",
  rank: "SPECIES",
  status: ["ACCEPTED"],
  habitat: ["TERRESTRIAL"],
  limit: 20,
  offset: 0
});

// Search with faceting
const faceted = await speciesService.search({
  q: "Felidae",
  rank: "SPECIES",
  facet: ["rank", "taxonomicStatus", "habitat"],
  facetMincount: 1,
  limit: 100
});
```

### 2. Get Species Details

```typescript
// Get complete species record
const species = await speciesService.getByKey(2435099); // Puma concolor
console.log(species.scientificName); // "Puma concolor (Linnaeus, 1771)"
console.log(species.kingdom); // "Animalia"
console.log(species.rank); // "SPECIES"
```

### 3. Match Scientific Name

```typescript
// Simple matching
const match = await speciesService.match({
  name: "Puma concolor"
});
console.log(match.matchType); // "EXACT" | "FUZZY" | "HIGHERRANK" | "NONE"
console.log(match.confidence); // 0-100

// Matching with taxonomic context
const contextMatch = await speciesService.match({
  name: "Puma concolor",
  kingdom: "Animalia",
  class: "Mammalia"
});

// Strict matching (no fuzzy matching)
const strictMatch = await speciesService.match({
  name: "Puma concolor",
  strict: true
});

// Verbose matching (includes alternatives)
const verboseMatch = await speciesService.match({
  name: "Puma",
  verbose: true
});
```

### 4. Autocomplete Suggestions

```typescript
// Get suggestions for autocomplete
const suggestions = await speciesService.suggest("Pum", { limit: 5 });
// Returns: [{ key: 2435098, scientificName: "Puma", rank: "GENUS" }, ...]

// Filter suggestions by rank
const speciesSuggestions = await speciesService.suggest("Felid", {
  rank: "SPECIES",
  limit: 10
});
```

### 5. Get Vernacular Names

```typescript
// Get all common names
const names = await speciesService.getVernacularNames(2435099);
console.log(names.results);
// [
//   { vernacularName: "Mountain Lion", language: "en", preferred: true },
//   { vernacularName: "Cougar", language: "en" },
//   { vernacularName: "Puma", language: "es", preferred: true }
// ]

// Get names in specific language
const englishNames = await speciesService.getVernacularNames(2435099, "en");

// Paginated names
const moreNames = await speciesService.getVernacularNames(2435099, undefined, {
  limit: 50,
  offset: 0
});
```

### 6. Get Synonyms

```typescript
// Get all synonyms
const synonyms = await speciesService.getSynonyms(2435099);
console.log(synonyms.results);
// [
//   {
//     key: 2435100,
//     scientificName: "Felis concolor Linnaeus, 1771",
//     rank: "SPECIES",
//     taxonomicStatus: "SYNONYM",
//     acceptedKey: 2435099,
//     accepted: "Puma concolor (Linnaeus, 1771)"
//   }
// ]
```

### 7. Navigate Taxonomy

```typescript
// Get taxonomic children
const children = await speciesService.getChildren(2435098); // Puma genus
console.log(children.results);
// [
//   { key: 2435099, scientificName: "Puma concolor", rank: "SPECIES" },
//   // ... subspecies and other children
// ]

// Get complete classification
const parents = await speciesService.getParents(2435099); // Puma concolor
console.log(parents);
// [
//   { key: 1, scientificName: "Animalia", rank: "KINGDOM" },
//   { key: 44, scientificName: "Chordata", rank: "PHYLUM" },
//   { key: 359, scientificName: "Mammalia", rank: "CLASS" },
//   { key: 732, scientificName: "Carnivora", rank: "ORDER" },
//   { key: 9703, scientificName: "Felidae", rank: "FAMILY" },
//   { key: 2435098, scientificName: "Puma", rank: "GENUS" }
// ]
```

### 8. Get Media and Descriptions

```typescript
// Get species images and media
const media = await speciesService.getMedia(2435099);
console.log(media.results);
// [
//   {
//     type: "StillImage",
//     format: "image/jpeg",
//     identifier: "http://example.org/image.jpg",
//     creator: "John Doe",
//     license: "CC-BY-4.0"
//   }
// ]

// Get species descriptions
const descriptions = await speciesService.getDescriptions(2435099);

// Get distribution information
const distributions = await speciesService.getDistributions(2435099);
```

## Occurrence Service Examples

### 1. Search Occurrences

```typescript
// Basic occurrence search
const occurrences = await occurrenceService.search({
  taxonKey: 2435099, // Puma concolor
  limit: 20
});

// Advanced search with multiple filters
const filtered = await occurrenceService.search({
  taxonKey: 2435099,
  country: "US",
  hasCoordinate: true,
  year: "2020,2024",
  basisOfRecord: ["HUMAN_OBSERVATION", "MACHINE_OBSERVATION"],
  limit: 50
});

// Geographic search with bounding box (WKT)
const geographic = await occurrenceService.search({
  taxonKey: 2435099,
  geometry: "POLYGON((-124 32,-114 32,-114 42,-124 42,-124 32))", // California area
  hasCoordinate: true,
  limit: 100
});

// Search with faceting for aggregations
const faceted = await occurrenceService.search({
  taxonKey: 2435099,
  country: "US",
  facet: ["basisOfRecord", "year", "stateProvince"],
  facetMincount: 1,
  limit: 0 // Don't need records, just facets
});
console.log(faceted.facets);
// [
//   {
//     field: "basisOfRecord",
//     counts: [
//       { name: "HUMAN_OBSERVATION", count: 15000 },
//       { name: "PRESERVED_SPECIMEN", count: 3000 }
//     ]
//   },
//   {
//     field: "year",
//     counts: [
//       { name: "2024", count: 1200 },
//       { name: "2023", count: 2500 }
//     ]
//   }
// ]
```

### 2. Get Single Occurrence

```typescript
// Get complete occurrence record
const occurrence = await occurrenceService.getByKey(1234567890);
console.log(occurrence.scientificName);
console.log(`${occurrence.decimalLatitude}, ${occurrence.decimalLongitude}`);
console.log(occurrence.eventDate);
console.log(occurrence.basisOfRecord);
console.log(occurrence.issues); // Data quality issues

// Get verbatim (original) occurrence
const verbatim = await occurrenceService.getVerbatim(1234567890);
console.log(verbatim.fields);
// Access original Darwin Core fields:
// verbatim.fields['http://rs.tdwg.org/dwc/terms/scientificName']
```

### 3. Count Occurrences

```typescript
// Quick count without retrieving records
const count = await occurrenceService.count({
  taxonKey: 2435099,
  country: "US",
  year: "2020,2024"
});
console.log(`Found ${count} mountain lion observations in US since 2020`);

// Count by state
const states = ["California", "Arizona", "Colorado", "New Mexico"];
for (const state of states) {
  const stateCount = await occurrenceService.count({
    taxonKey: 2435099,
    country: "US",
    stateProvince: state
  });
  console.log(`${state}: ${stateCount} observations`);
}
```

### 4. Request Downloads (Requires Authentication)

```typescript
// Build predicate from search parameters
const predicate = occurrenceService.buildPredicateFromSearch({
  taxonKey: 2435099,
  country: "US",
  year: "2020,2024",
  hasCoordinate: true
});

// Request download
const downloadKey = await occurrenceService.requestDownload({
  creator: "your-gbif-username",
  notificationAddresses: ["your-email@example.com"],
  sendNotification: true,
  format: "SIMPLE_CSV", // or "DWCA", "SPECIES_LIST", "SIMPLE_PARQUET"
  predicate: predicate
});

console.log(`Download requested: ${downloadKey}`);

// Check download status
const download = await occurrenceService.getDownloadStatus(downloadKey);
console.log(`Status: ${download.status}`);
// Status values: PREPARING, RUNNING, SUCCEEDED, FAILED, CANCELLED

// When complete, get download link
if (download.status === "SUCCEEDED") {
  console.log(`Download ready: ${download.downloadLink}`);
  console.log(`Total records: ${download.totalRecords}`);
  console.log(`File size: ${download.size} bytes`);
  console.log(`DOI: ${download.doi}`);
}
```

### 5. Complex Download Predicates

```typescript
// Manual predicate building for complex queries
const complexPredicate: DownloadPredicate = {
  type: "and",
  predicates: [
    // Taxon filter
    { type: "equals", key: "TAXON_KEY", value: "2435099" },

    // Geographic - US only
    { type: "equals", key: "COUNTRY", value: "US" },

    // Time range
    { type: "greaterThanOrEquals", key: "YEAR", value: "2020" },
    { type: "lessThanOrEquals", key: "YEAR", value: "2024" },

    // Quality filters
    { type: "equals", key: "HAS_COORDINATE", value: "true" },
    { type: "equals", key: "HAS_GEOSPATIAL_ISSUE", value: "false" },

    // Basis of record options
    {
      type: "or",
      predicates: [
        { type: "equals", key: "BASIS_OF_RECORD", value: "HUMAN_OBSERVATION" },
        { type: "equals", key: "BASIS_OF_RECORD", value: "MACHINE_OBSERVATION" }
      ]
    }
  ]
};

const downloadKey = await occurrenceService.requestDownload({
  creator: "username",
  notificationAddresses: ["email@example.com"],
  format: "DWCA",
  predicate: complexPredicate
});
```

## Advanced Usage Patterns

### 1. Name Resolution Pipeline

```typescript
async function resolveSpeciesName(name: string) {
  // Try exact matching first
  const match = await speciesService.match({ name, strict: true });

  if (match.matchType === "EXACT") {
    return {
      key: match.usageKey,
      name: match.scientificName,
      confidence: "high"
    };
  }

  // Try fuzzy matching
  const fuzzyMatch = await speciesService.match({ name, strict: false });

  if (fuzzyMatch.confidence && fuzzyMatch.confidence > 80) {
    return {
      key: fuzzyMatch.usageKey,
      name: fuzzyMatch.scientificName,
      confidence: "medium",
      matchType: fuzzyMatch.matchType
    };
  }

  // Suggest alternatives
  const suggestions = await speciesService.suggest(name, { limit: 5 });

  return {
    suggestions: suggestions,
    confidence: "low",
    message: "No strong match found, showing suggestions"
  };
}
```

### 2. Occurrence Data Quality Assessment

```typescript
async function assessDataQuality(taxonKey: number, country: string) {
  // Get total count
  const total = await occurrenceService.count({ taxonKey, country });

  // Count georeferenced records
  const georeferenced = await occurrenceService.count({
    taxonKey,
    country,
    hasCoordinate: true
  });

  // Count high-quality records (georeferenced without issues)
  const highQuality = await occurrenceService.count({
    taxonKey,
    country,
    hasCoordinate: true,
    hasGeospatialIssue: false
  });

  // Get facets for basis of record
  const faceted = await occurrenceService.search({
    taxonKey,
    country,
    facet: ["basisOfRecord"],
    limit: 0
  });

  return {
    total,
    georeferenced,
    georeferencedPercent: (georeferenced / total * 100).toFixed(1),
    highQuality,
    highQualityPercent: (highQuality / total * 100).toFixed(1),
    basisOfRecord: faceted.facets?.[0]?.counts || []
  };
}
```

### 3. Taxonomic Hierarchy Building

```typescript
async function buildTaxonomicTree(genusKey: number) {
  // Get genus details
  const genus = await speciesService.getByKey(genusKey);

  // Get all species in genus
  const species = await speciesService.getChildren(genusKey, { limit: 100 });

  // For each species, get subspecies
  const tree = {
    key: genus.key,
    name: genus.scientificName,
    rank: genus.rank,
    children: await Promise.all(
      species.results!.map(async (sp) => {
        const subspecies = await speciesService.getChildren(sp.key!, { limit: 50 });
        return {
          key: sp.key,
          name: sp.scientificName,
          rank: sp.rank,
          children: subspecies.results || []
        };
      })
    )
  };

  return tree;
}
```

### 4. Geographic Distribution Analysis

```typescript
async function analyzeGeographicDistribution(taxonKey: number) {
  // Get occurrence counts by country
  const results = await occurrenceService.search({
    taxonKey,
    facet: ["country"],
    facetMincount: 10,
    limit: 0
  });

  const countries = results.facets?.find(f => f.field === "country")?.counts || [];

  // For top countries, get detailed breakdown by year
  const topCountries = countries.slice(0, 5);

  const detailedAnalysis = await Promise.all(
    topCountries.map(async (country) => {
      const yearlyData = await occurrenceService.search({
        taxonKey,
        country: country.name,
        facet: ["year"],
        limit: 0
      });

      return {
        country: country.name,
        totalRecords: country.count,
        yearlyDistribution: yearlyData.facets?.[0]?.counts || []
      };
    })
  );

  return detailedAnalysis;
}
```

## Error Handling

```typescript
try {
  const species = await speciesService.getByKey(123456);
} catch (error) {
  if (error.message.includes('HTTP 404')) {
    console.error('Species not found');
  } else if (error.message.includes('HTTP 500')) {
    console.error('GBIF server error, retry later');
  } else {
    console.error('Unknown error:', error.message);
  }
}

// Circuit breaker status
console.log('Circuit state:', client.getCircuitState());
// If OPEN, wait before retrying
```

## Performance Tips

1. **Use caching effectively**: Species taxonomy data changes rarely, occurrence data changes frequently
2. **Use count() instead of search()** when you only need statistics
3. **Use faceting** for aggregations instead of multiple count queries
4. **Paginate carefully**: Maximum offset is 100,000 for occurrences
5. **Use download API** for large datasets (> 100,000 records)
6. **Batch operations**: Group related queries together
7. **Monitor circuit breaker**: Check circuit state if experiencing failures

## Next Steps

- Explore the MCP tool wrappers in `src/tools/`
- Review the complete API documentation in `GBIF_API_ENDPOINTS_ANALYSIS.md`
- Check service implementations for additional methods
- See type definitions in `src/types/gbif.types.ts`
