# GBIF API Coverage Gap Analysis

## Executive Summary

This document provides a comprehensive analysis of GBIF API endpoint coverage by the GBIF MCP Server, identifies gaps, prioritizes missing functionality, and recommends implementation strategies.

**Current Coverage:** 44 tools covering ~55% of GBIF API
**Gap Identified:** ~45% of API endpoints not yet implemented
**Priority Gaps:** 10 high-priority endpoints identified

---

## Methodology

### Analysis Approach

1. **Endpoint Inventory:** Cataloged all GBIF API v1 endpoints from official documentation
2. **Coverage Mapping:** Mapped existing MCP tools to GBIF endpoints
3. **Gap Identification:** Identified endpoints without MCP tool coverage
4. **Priority Classification:** Categorized gaps by user value and complexity
5. **Implementation Planning:** Recommended approaches for high-priority gaps

### Coverage Calculation

```
Coverage % = (Implemented Endpoints / Total Available Endpoints) × 100
```

**Note:** Some endpoints are deliberately excluded (admin, internal, deprecated)

---

## Summary Statistics

### Overall Coverage

| Metric | Count | Percentage |
|--------|-------|------------|
| Total GBIF API Endpoints | ~100 | 100% |
| Implemented Endpoints | ~55 | 55% |
| High-Priority Gaps | 10 | 10% |
| Medium-Priority Gaps | 25 | 25% |
| Low-Priority Gaps | 10 | 10% |

### Coverage by Category

| Category | Total Endpoints | Implemented | Coverage | Gap |
|----------|----------------|-------------|----------|-----|
| Species | 20 | 11 | 55% | 9 |
| Occurrence | 25 | 7 | 28% | 18 |
| Registry | 30 | 15 | 50% | 15 |
| Maps | 6 | 4 | 67% | 2 |
| Literature | 4 | 2 | 50% | 2 |
| Vocabularies | 5 | 3 | 60% | 2 |
| Validator | 10 | 2 | 20% | 8 |

---

## Category-by-Category Analysis

### 1. Species API

**Coverage:** 11 tools / 20 endpoints = 55%

#### ✅ Implemented (11 tools)
1. `/species/search` - gbif_species_search
2. `/species/{key}` - gbif_species_get
3. `/species/suggest` - gbif_species_suggest
4. `/species/match` - gbif_species_match
5. `/species/{key}/children` - gbif_species_children
6. `/species/{key}/parents` - gbif_species_parents
7. `/species/{key}/synonyms` - gbif_species_synonyms
8. `/species/{key}/descriptions` - gbif_species_descriptions
9. `/species/{key}/distributions` - gbif_species_distributions
10. `/species/{key}/media` - gbif_species_media
11. `/species/{key}/vernacularNames` - gbif_species_vernacular_names

#### 🔴 HIGH Priority Gaps (3 endpoints)

**1. `/species/parser` - Parse scientific names**
- **Priority:** HIGH
- **Value:** Name standardization, batch processing, data cleaning
- **Use Case:** Parse hundreds of names for quality checking
- **Complexity:** Low (simple POST endpoint)
- **Recommendation:** Implement `gbif_species_parse_names` tool

**2. `/species/{key}/metrics` - Species occurrence statistics**
- **Priority:** HIGH
- **Value:** Quick statistics without full occurrence search
- **Use Case:** Dashboard displays, data exploration
- **Complexity:** Low (GET with key)
- **Recommendation:** Implement `gbif_species_metrics` tool

**3. `/species/{key}/related` - Related species (siblings, etc.)**
- **Priority:** HIGH
- **Value:** Taxonomic exploration, related species discovery
- **Use Case:** "See also" functionality, taxonomy browsing
- **Complexity:** Low (GET with key)
- **Recommendation:** Implement `gbif_species_related` tool

#### 🟡 MEDIUM Priority Gaps (4 endpoints)

**4. `/species/{key}/name` - Name usage details**
- **Priority:** MEDIUM
- **Value:** Detailed nomenclatural information
- **Complexity:** Low
- **Recommendation:** Consider for future

**5. `/species/{key}/references` - Bibliographic references**
- **Priority:** MEDIUM
- **Value:** Taxonomic literature
- **Complexity:** Low
- **Recommendation:** Low user demand

**6. `/species/{key}/speciesProfiles` - Ecological profiles**
- **Priority:** MEDIUM
- **Value:** Habitat, behavior information
- **Complexity:** Low
- **Recommendation:** Nice-to-have

**7. `/species/{key}/typeSpecimens` - Type specimen info**
- **Priority:** MEDIUM
- **Value:** Taxonomic authority
- **Complexity:** Medium
- **Recommendation:** Specialist use case

#### ⚪ LOW Priority Gaps (2 endpoints)

**8-9. Internal/Admin endpoints**
- Metrics, health checks (server-side only)
- Not relevant for MCP tools

---

### 2. Occurrence API

**Coverage:** 7 tools / 25 endpoints = 28%

#### ✅ Implemented (7 tools)
1. `/occurrence/search` - gbif_occurrence_search
2. `/occurrence/{key}` - gbif_occurrence_get
3. `/occurrence/count` - gbif_occurrence_count
4. `/occurrence/{key}/verbatim` - gbif_occurrence_verbatim
5. `/occurrence/download/request` - gbif_occurrence_download_request
6. `/occurrence/download/request/{key}` - gbif_occurrence_download_status
7. Predicate builder - gbif_occurrence_download_predicate_builder

#### 🔴 HIGH Priority Gaps (5 endpoints)

**1. `/occurrence/counts/basisOfRecord` - Count by record type**
- **Priority:** HIGH
- **Value:** Understand dataset composition, filter validation
- **Use Case:** "Show me breakdown: 1000 specimens, 500 observations"
- **Complexity:** Low
- **Recommendation:** ✅ IMPLEMENT - Very useful for dashboards

**2. `/occurrence/counts/year` - Temporal trends**
- **Priority:** HIGH
- **Value:** Time series analysis, trend visualization
- **Use Case:** "Show occurrence counts by year for lions in Kenya"
- **Complexity:** Low
- **Recommendation:** ✅ IMPLEMENT - Essential for temporal analysis

**3. `/occurrence/counts/countries` - Geographic distribution**
- **Priority:** HIGH
- **Value:** Quick geographic summary
- **Use Case:** "Which countries have the most lion records?"
- **Complexity:** Low
- **Recommendation:** ✅ IMPLEMENT - Very common use case

**4. `/occurrence/counts/publishingCountries` - Data provider distribution**
- **Priority:** HIGH
- **Value:** Understand data sources
- **Use Case:** Data coverage analysis
- **Complexity:** Low
- **Recommendation:** Implement alongside countries

**5. `/occurrence/counts/datasets` - Dataset contribution analysis**
- **Priority:** HIGH
- **Value:** Identify major data sources
- **Use Case:** "Which datasets contribute most to lion records?"
- **Complexity:** Low
- **Recommendation:** Useful for attribution

#### 🟡 MEDIUM Priority Gaps (8 endpoints)

**6. `/occurrence/counts/taxonKeys` - Taxonomic breakdown**
- Quick taxonomy counts
- Medium value (covered by search facets)

**7. `/occurrence/{key}/fragment` - Verbatim record fragment**
- Original data fragment
- Specialist use case

**8. `/occurrence/download` - Download list endpoint**
- List user's downloads
- Requires authentication context

**9-13. Additional /occurrence/counts/* endpoints**
- Counts by publishingOrg, protocol, etc.
- Lower priority variants

#### ⚪ LOW Priority Gaps (5 endpoints)

**14-18. Admin/internal endpoints**
- Inventory, experiments, internal tools
- Not suitable for MCP

---

### 3. Registry API

**Coverage:** 15 tools / 30 endpoints = 50%

#### ✅ Implemented (15 tools)

**Datasets (3):**
- Search, get, metrics

**Organizations (3):**
- Search, get, list datasets

**Networks (3):**
- Search, get, list datasets

**Installations (2):**
- Search, get

**GRSciColl Collections (2):**
- Search, get

**GRSciColl Institutions (2):**
- Search, get

#### 🔴 HIGH Priority Gaps (2 endpoints)

**1. `/dataset/{key}/document` - EML metadata document**
- **Priority:** HIGH
- **Value:** Ecological Metadata Language, dataset documentation
- **Use Case:** Get structured metadata for dataset citation
- **Complexity:** Low
- **Recommendation:** Useful for researchers

**2. `/node` - GBIF nodes (national endpoints)**
- **Priority:** HIGH
- **Value:** National GBIF participation info
- **Use Case:** Discover national GBIF nodes
- **Complexity:** Low
- **Recommendation:** Good for institutional context

#### 🟡 MEDIUM Priority Gaps (8 endpoints)

**3. `/organization/{key}/hostedDatasets` - Datasets hosted**
- Datasets hosted (vs published)
- Distinction important for some use cases

**4. `/network/{key}/constituents` - Network members**
- Alternative endpoint for network datasets
- Covered by existing tool

**5. `/installation/{key}/datasets` - Datasets on installation**
- Technical infrastructure query
- Lower priority

**6-8. GRSciColl persons, staff, contacts**
- Person-level metadata
- Specialist use case

#### ⚪ LOW Priority Gaps (5 endpoints)

**9-13. Admin endpoints**
- Node management, endorsement
- Not suitable for MCP tools

---

### 4. Maps API

**Coverage:** 4 tools / 6 endpoints = 67%

#### ✅ Implemented (4 tools)
1. Tile URL generation (with filters) - gbif_maps_get_tile_url
2. Vector tiles - gbif_maps_get_vector_tile_url
3. Raster tiles - gbif_maps_get_raster_tile_url
4. Style listing - gbif_maps_list_styles

#### 🟡 MEDIUM Priority Gaps (1 endpoint)

**1. `/map/occurrence/adhoc` - Custom map generation**
- **Priority:** MEDIUM
- **Value:** Generate custom static maps
- **Use Case:** One-off map images for reports
- **Complexity:** Medium
- **Recommendation:** Lower priority (tiles handle most cases)

#### ⚪ LOW Priority Gaps (1 endpoint)

**2. Map capabilities endpoint**
- Technical metadata
- Covered by service method

---

### 5. Literature API

**Coverage:** 2 tools / 4 endpoints = 50%

#### ✅ Implemented (2 tools)
1. `/literature/search` - gbif_literature_search
2. `/literature/{doi}` - gbif_literature_get

#### 🟡 MEDIUM Priority Gaps (2 endpoints)

**1. `/literature/export` - Export citations**
- **Priority:** MEDIUM
- **Value:** BibTeX, RIS, CSV export for reference managers
- **Use Case:** Generate bibliography for papers
- **Complexity:** Low
- **Recommendation:** ✅ Implement in Phase 2 (already planned)

**2. `/literature/{id}` - Get by numeric ID**
- **Priority:** LOW
- **Value:** Alternative to DOI lookup
- **Complexity:** Low
- **Recommendation:** DOI is preferred identifier

---

### 6. Vocabularies API

**Coverage:** 3 tools / 5 endpoints = 60%

#### ✅ Implemented (3 tools)
1. `/vocabularies` - gbif_vocabularies_list
2. `/vocabularies/{name}` - gbif_vocabularies_get
3. `/vocabularies/{name}/concepts/{concept}` - gbif_vocabularies_get_concept

#### 🟡 MEDIUM Priority Gaps (2 endpoints)

**1. `/vocabularies/{name}/concepts` - List all concepts**
- **Priority:** MEDIUM
- **Value:** Get all valid values for a field
- **Complexity:** Low
- **Recommendation:** Partially covered by get vocabulary

**2. `/vocabularies/{name}/concepts/suggest` - Concept autocomplete**
- **Priority:** LOW
- **Value:** UI autocomplete
- **Complexity:** Low
- **Recommendation:** Limited use case for AI

---

### 7. Validator API

**Coverage:** 2 tools / 10 endpoints = 20%

#### ✅ Implemented (2 tools)
1. `/tools/datasets/dwca/validate` - gbif_validator_validate_dwca
2. `/validator/status/{key}` - gbif_validator_get_status

#### 🟡 MEDIUM Priority Gaps (5 endpoints)

**1. `/tools/datasets/tabular/validate` - Validate CSV/TSV**
- **Priority:** MEDIUM
- **Value:** Simpler data validation
- **Use Case:** Validate spreadsheets before DwC-A creation
- **Complexity:** Low
- **Recommendation:** Useful for data preparation

**2. `/validator/jobserver/job/{key}` - Detailed job status**
- **Priority:** MEDIUM
- **Value:** More detailed validation progress
- **Complexity:** Low
- **Recommendation:** Enhancement to existing tool

**3-5. Additional validation endpoints**
- EML validation, name validation
- Specialist use cases

#### ⚪ LOW Priority Gaps (3 endpoints)

**6-8. Admin/internal validation**
- Job management, queue status
- Not suitable for MCP

---

## High-Priority Implementation Recommendations

### Immediate Value (Implement First)

#### 1. Occurrence Counts Endpoints (3 tools)

**Rationale:** Quick statistics without heavy searches

**Tools to Implement:**

**A. `gbif_occurrence_counts_by_basis_of_record`**
```typescript
// Returns: { HUMAN_OBSERVATION: 1000, PRESERVED_SPECIMEN: 500, ... }
// Use case: "What types of records exist for lions in Kenya?"
```

**B. `gbif_occurrence_counts_by_year`**
```typescript
// Returns: { 2020: 100, 2021: 150, 2022: 200, ... }
// Use case: "Show me temporal trends for species X"
```

**C. `gbif_occurrence_counts_by_country`**
```typescript
// Returns: { US: 5000, BR: 3000, KE: 2000, ... }
// Use case: "Which countries have the most records?"
```

**Implementation Effort:** 2-3 hours
**Value:** Very high - enables dashboards and quick analysis

---

#### 2. Species Enhancement (2 tools)

**A. `gbif_species_metrics`**
```typescript
// GET /species/{key}/metrics
// Returns occurrence counts, dataset count, country count
// Use case: "How many records exist for this species?"
```

**B. `gbif_species_parse_names`**
```typescript
// POST /species/parser with name array
// Returns parsed names with authorship, rank, etc.
// Use case: "Standardize 100 names from spreadsheet"
```

**Implementation Effort:** 1-2 hours
**Value:** High - common data cleaning task

---

### Secondary Priority

#### 3. Registry Enhancements (2 tools)

**A. Dataset EML Document**
- GET `/dataset/{key}/document`
- Returns Ecological Metadata Language XML
- Use for citations, metadata extraction

**B. GBIF Nodes**
- GET `/node` and `/node/{key}`
- National GBIF participant info
- Institutional context

**Implementation Effort:** 1-2 hours
**Value:** Medium - specialist use cases

---

#### 4. Validator Enhancements (1 tool)

**A. Tabular Validation**
- POST `/tools/datasets/tabular/validate`
- Validate CSV/TSV before archive creation
- Simplifies data preparation workflow

**Implementation Effort:** 1 hour
**Value:** Medium - helpful but not essential

---

## Gap Analysis by Priority

### 🔴 HIGH Priority (10 gaps - Implement Soon)

**Occurrence Counts (5):**
1. counts/basisOfRecord - Record type breakdown ⭐
2. counts/year - Temporal trends ⭐
3. counts/countries - Geographic distribution ⭐
4. counts/publishingCountries - Data source countries
5. counts/datasets - Dataset contributions

**Species (3):**
6. /species/parser - Name parsing/standardization ⭐
7. /species/{key}/metrics - Quick statistics ⭐
8. /species/{key}/related - Related species

**Registry (2):**
9. /dataset/{key}/document - EML metadata
10. /node - GBIF national nodes

**Estimated Implementation:** 8-12 hours total
**Impact:** Enables dashboards, quick stats, data cleaning

---

### 🟡 MEDIUM Priority (25 gaps - Consider Later)

**Occurrence (8):**
- counts/taxonKeys, counts/publishingOrgs
- fragments, experimental endpoints
- Download management (list, cancel)

**Registry (8):**
- Organization hosted datasets
- Installation datasets
- GRSciColl persons/staff
- Network constituents (alt endpoint)

**Validator (5):**
- Tabular validation
- EML validation
- Detailed job status
- Name validation

**Literature (2):**
- Export to citation formats (Phase 2)
- Get by numeric ID

**Vocabularies (2):**
- List concepts (covered by get)
- Concept autocomplete

**Estimated Implementation:** 20-30 hours total
**Impact:** Moderate - specialist features

---

### ⚪ LOW Priority (10 gaps - Not Recommended)

**Admin/Internal:**
- Node management endpoints
- Endorsement workflows
- Validator job queue management
- Internal metrics
- Experimental features

**Deprecated:**
- Legacy endpoints
- Replaced functionality

**Rationale:** Not suitable for AI tools, require admin access, or have better alternatives

---

## Implementation Roadmap

### Quick Wins (8-12 hours)

**Phase 5A: Occurrence Counts (Priority 1)**
1. Implement 3 count endpoints (basisOfRecord, year, countries)
2. Create OccurrenceService methods
3. Create MCP tools with Zod schemas
4. Add tests (3 test files)

**Expected Outcome:**
- 3 new tools
- Dashboard/statistics capabilities
- Quick data exploration

**Phase 5B: Species Enhancement (Priority 2)**
1. Implement parser endpoint
2. Implement metrics endpoint
3. Create MCP tools
4. Add tests (2 test files)

**Expected Outcome:**
- 2 new tools
- Name standardization
- Quick species statistics

**Total Quick Wins:** 5 new tools, ~50% of high-priority gaps

---

### Medium-Term (20-30 hours)

**Phase 5C: Registry & Validator**
1. Dataset EML documents
2. GBIF nodes
3. Tabular validation

**Expected Outcome:**
- 3-4 new tools
- Specialist capabilities
- Enhanced metadata access

---

## Coverage Improvement Projection

### Current State
```
Tools: 44
Coverage: ~55%
High-priority gaps: 10
```

### After Quick Wins (Phase 5A + 5B)
```
Tools: 49 (+5)
Coverage: ~60% (+5%)
High-priority gaps: 5 (-50%)
```

### After Medium-Term (Phase 5C)
```
Tools: 52-53 (+8-9)
Coverage: ~65% (+10%)
High-priority gaps: 2 (-80%)
```

### After All Practical Gaps
```
Tools: ~60
Coverage: ~70%
High-priority gaps: 0 (-100%)
```

**Note:** 100% coverage not recommended (diminishing returns, admin endpoints)

---

## Endpoint Analysis Reference

### GBIF API Structure

**Core Data:**
- Species (taxonomy)
- Occurrence (observations)
- Dataset (metadata)

**Supporting:**
- Organization (publishers)
- Network (partnerships)
- Installation (infrastructure)

**Augmentation:**
- Maps (visualization)
- Literature (citations)
- Vocabularies (standards)
- Validator (quality)

**Admin:**
- Nodes (governance)
- Metrics (analytics)
- Management (operations)

---

## Implementation Guidelines

### When to Implement

**Implement if:**
- ✅ High user value (common use case)
- ✅ Low complexity (simple endpoint)
- ✅ Fills clear gap (no alternative)
- ✅ Public API (no auth required for read)

**Skip if:**
- ❌ Admin/internal only
- ❌ Deprecated or replaced
- ❌ Covered by existing tool
- ❌ Very specialist (low demand)

### Implementation Pattern

```typescript
// 1. Add service method
async methodName(params): Promise<Type> {
  const response = await this.client.get('/endpoint', params);
  return response;
}

// 2. Create tool
export class ToolName extends BaseTool<Input, Output> {
  protected readonly name = 'gbif_category_action';
  protected readonly description = '...';
  protected readonly inputSchema = z.object({ ... });

  protected async run(input: Input): Promise<any> {
    const result = await this.service.method(input);
    return this.formatResponse(result, metadata);
  }
}

// 3. Register in index.ts
this.toolRegistry.register(new ToolName(service));

// 4. Create tests
describe('ToolName', () => {
  // Definition, validation, execution, errors
});
```

---

## Cost-Benefit Analysis

### High-Priority Implementations

| Tool | Implementation Time | User Value | ROI |
|------|-------------------|------------|-----|
| counts/basisOfRecord | 1h | Very High | ⭐⭐⭐⭐⭐ |
| counts/year | 1h | Very High | ⭐⭐⭐⭐⭐ |
| counts/countries | 1h | Very High | ⭐⭐⭐⭐⭐ |
| species/parser | 1.5h | High | ⭐⭐⭐⭐ |
| species/metrics | 1h | High | ⭐⭐⭐⭐ |
| dataset/document | 1h | Medium | ⭐⭐⭐ |
| node endpoints | 1.5h | Medium | ⭐⭐⭐ |

**Total Quick Wins:** ~8 hours for 5-7 tools with very high ROI

---

## Recommendations

### Immediate Actions (This Session if Time)

1. ✅ **Implement 3 occurrence count tools** (3 hours)
   - Highest value
   - Enables dashboards
   - Very common use cases

2. **Implement 2 species tools** (2 hours)
   - Name parser (data cleaning)
   - Metrics (quick stats)

**Total:** 5 hours, 5 tools, major capability boost

### Near-Term (Next Session)

3. **Dataset EML document** (1 hour)
4. **GBIF nodes** (1.5 hours)
5. **Tabular validator** (1 hour)

**Total:** 3.5 hours, 3 tools, complete high-priority gaps

### Long-Term (As Needed)

- Medium-priority endpoints based on user demand
- Integration tests (Phase 7)
- MkDocs documentation (Phase 6)
- Parameter audit (Phase 8)

---

## Gap Analysis Summary

### What We Have
✅ Comprehensive species identification
✅ Full occurrence querying
✅ Complete registry metadata
✅ Map visualization
✅ Literature tracking
✅ Standards compliance
✅ Data validation

### What's Missing (High Priority)
🔴 Quick occurrence statistics (counts/*)
🔴 Name parsing/standardization
🔴 Species quick stats
🔴 EML metadata documents
🔴 GBIF nodes

### What's Missing (Medium/Low Priority)
🟡 Specialist endpoints
🟡 Alternative query methods
🟡 Admin/management tools
⚪ Internal/deprecated endpoints

---

## Conclusion

**Current State:** Production-ready platform covering ~55% of GBIF API with high-quality implementation of most common use cases.

**Gap Assessment:** 10 high-priority gaps identified, 5 very quick to implement with high ROI.

**Recommendation:** Implement the 5 occurrence/species quick wins (5 hours) to boost coverage to ~60% and enable critical dashboard/statistics capabilities.

**Overall Status:** ✅ Excellent coverage of essential functionality, strategic gaps identified, clear implementation path forward.

---

*Gap Analysis Complete: 2026-02-03*
*Current Coverage: 55% | Potential with Quick Wins: 60% | Maximum Practical: ~70%*
