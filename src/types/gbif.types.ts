/**
 * GBIF API Type Definitions
 */

// Common Types
export interface GBIFPagination {
  offset?: number;
  limit?: number;
  count?: number;
  endOfRecords?: boolean;
}

export interface GBIFError {
  error?: string;
  message?: string;
  statusCode?: number;
}

// Species API Types
export interface Species {
  key: number;
  nubKey?: number;
  nameKey?: number;
  taxonID?: string;
  sourceTaxonKey?: number;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  kingdomKey?: number;
  phylumKey?: number;
  classKey?: number;
  orderKey?: number;
  familyKey?: number;
  genusKey?: number;
  speciesKey?: number;
  datasetKey?: string;
  constituentKey?: string;
  parentKey?: number;
  parent?: string;
  scientificName?: string;
  canonicalName?: string;
  vernacularName?: string;
  authorship?: string;
  nameType?: string;
  rank?: string;
  origin?: string;
  taxonomicStatus?: string;
  nomenclaturalStatus?: string[];
  remarks?: string;
  numDescendants?: number;
  lastCrawled?: string;
  lastInterpreted?: string;
  issues?: string[];
  synonym?: boolean;
}

export interface SpeciesSearchParams {
  q?: string;
  rank?: string;
  higherTaxonKey?: number;
  status?: string[];
  isExtinct?: boolean;
  habitat?: string[];
  threat?: string[];
  nameType?: string[];
  datasetKey?: string[];
  nomenclaturalStatus?: string[];
  issue?: string[];
  hl?: boolean;
  facet?: string[];
  facetMincount?: number;
  facetMultiselect?: boolean;
  offset?: number;
  limit?: number;
}

// Occurrence API Types
export interface Occurrence {
  key: number;
  datasetKey?: string;
  publishingOrgKey?: string;
  publishingCountry?: string;
  protocol?: string;
  lastCrawled?: string;
  lastParsed?: string;
  crawlId?: number;
  basisOfRecord?: string;
  individualCount?: number;
  sex?: string;
  lifeStage?: string;
  establishmentMeans?: string;
  occurrenceStatus?: string;
  // Temporal
  eventDate?: string;
  eventTime?: string;
  startDayOfYear?: number;
  endDayOfYear?: number;
  year?: number;
  month?: number;
  day?: number;
  // Location
  continent?: string;
  waterBody?: string;
  country?: string;
  countryCode?: string;
  stateProvince?: string;
  locality?: string;
  minimumElevationInMeters?: number;
  maximumElevationInMeters?: number;
  minimumDepthInMeters?: number;
  maximumDepthInMeters?: number;
  minimumDistanceAboveSurfaceInMeters?: number;
  maximumDistanceAboveSurfaceInMeters?: number;
  decimalLatitude?: number;
  decimalLongitude?: number;
  coordinatePrecision?: number;
  coordinateUncertaintyInMeters?: number;
  // Taxonomy
  taxonKey?: number;
  scientificName?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  subgenus?: string;
  species?: string;
  genericName?: string;
  specificEpithet?: string;
  infraspecificEpithet?: string;
  taxonRank?: string;
  // Identification
  identifiedBy?: string;
  dateIdentified?: string;
  identificationReferences?: string;
  identificationRemarks?: string;
  identificationQualifier?: string;
  typeStatus?: string;
  // Collection
  recordedBy?: string;
  recordNumber?: string;
  collectionCode?: string;
  institutionCode?: string;
  catalogNumber?: string;
  occurrenceID?: string;
  // Additional
  references?: string;
  license?: string;
  rightsHolder?: string;
  identifier?: string;
  facts?: any[];
  relations?: any[];
  gadm?: any;
  media?: any[];
  issues?: string[];
}

export interface OccurrenceSearchParams {
  q?: string;
  scientificName?: string;
  country?: string;
  publishingCountry?: string;
  hasCoordinate?: boolean;
  hasGeospatialIssue?: boolean;
  taxonKey?: number;
  kingdomKey?: number;
  phylumKey?: number;
  classKey?: number;
  orderKey?: number;
  familyKey?: number;
  genusKey?: number;
  subgenusKey?: number;
  repatriated?: boolean;
  datasetKey?: string;
  publishingOrg?: string;
  decade?: number;
  basisOfRecord?: string[];
  institutionCode?: string;
  collectionCode?: string;
  catalogNumber?: string;
  recordedBy?: string;
  recordNumber?: string;
  typeStatus?: string[];
  continent?: string;
  waterBody?: string;
  stateProvince?: string;
  year?: string;
  month?: number;
  decimalLatitude?: string;
  decimalLongitude?: string;
  elevation?: string;
  depth?: string;
  geometry?: string;
  issue?: string[];
  mediaType?: string[];
  facet?: string[];
  facetMincount?: number;
  facetMultiselect?: boolean;
  offset?: number;
  limit?: number;
}

// Registry API Types
export interface Dataset {
  key: string;
  doi?: string;
  title: string;
  description?: string;
  type: string;
  subtype?: string;
  license?: string;
  created?: string;
  modified?: string;
  publishingOrganizationKey?: string;
  publishingOrganizationTitle?: string;
  hostingOrganizationKey?: string;
  hostingOrganizationTitle?: string;
  installationKey?: string;
  parentDatasetKey?: string;
  duplicateOfDatasetKey?: string;
  metadata?: any[];
  endpoints?: any[];
  identifiers?: any[];
  tags?: any[];
  machineTags?: any[];
  comments?: any[];
  contacts?: any[];
  bibliography?: any;
  citation?: string;
  rights?: string;
  logoUrl?: string;
  language?: string;
  dataLanguage?: string;
  pubDate?: string;
  recordCount?: number;
}

export interface DatasetSearchParams {
  q?: string;
  type?: string;
  subtype?: string;
  keyword?: string;
  publishingCountry?: string;
  publishingOrg?: string;
  hostingOrg?: string;
  decade?: number;
  license?: string;
  limit?: number;
  offset?: number;
}

export interface Organization {
  key: string;
  endorsingNodeKey?: string;
  endorsementApproved?: boolean;
  title: string;
  abbreviation?: string;
  description?: string;
  created?: string;
  modified?: string;
  homepage?: string[];
  logoUrl?: string;
  address?: string[];
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  numPublishedDatasets?: number;
  email?: string[];
  phone?: string[];
  contacts?: any[];
  endpoints?: any[];
  machineTags?: any[];
  tags?: any[];
  identifiers?: any[];
  comments?: any[];
}

export interface OrganizationSearchParams {
  q?: string;
  country?: string;
  isEndorsed?: boolean;
  limit?: number;
  offset?: number;
}

export interface Network {
  key: string;
  title: string;
  description?: string;
  language?: string;
  email?: string[];
  phone?: string[];
  homepage?: string[];
  logoUrl?: string;
  numConstituents?: number;
  created?: string;
  modified?: string;
  contacts?: any[];
  endpoints?: any[];
  machineTags?: any[];
  tags?: any[];
  identifiers?: any[];
  comments?: any[];
}

export interface NetworkSearchParams {
  q?: string;
  limit?: number;
  offset?: number;
}

// Response wrapper types
export interface GBIFResponse<T> {
  offset?: number;
  limit?: number;
  endOfRecords?: boolean;
  count?: number;
  results?: T[];
  facets?: any[];
}

export interface GBIFSingleResponse<T> {
  data: T;
}

// Species Service Enhanced Types
export interface SpeciesMatch {
  usageKey?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  status?: string;
  confidence?: number;
  matchType?: 'EXACT' | 'FUZZY' | 'HIGHERRANK' | 'NONE';
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  kingdomKey?: number;
  phylumKey?: number;
  classKey?: number;
  orderKey?: number;
  familyKey?: number;
  genusKey?: number;
  speciesKey?: number;
  synonym?: boolean;
  alternatives?: SpeciesMatch[];
  note?: string;
}

export interface SpeciesMatchParams {
  name?: string;
  rank?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  strict?: boolean;
  verbose?: boolean;
}

export interface SpeciesSuggest {
  key: number;
  scientificName: string;
  canonicalName?: string;
  rank?: string;
}

export interface VernacularName {
  vernacularName: string;
  language?: string;
  source?: string;
  sourceTaxonKey?: number;
  preferred?: boolean;
  taxonKey?: number;
}

export interface SpeciesSynonym {
  key: number;
  scientificName: string;
  canonicalName?: string;
  rank?: string;
  taxonomicStatus?: string;
  acceptedKey?: number;
  accepted?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

export interface TaxonParent {
  key: number;
  scientificName: string;
  canonicalName?: string;
  rank: string;
}

// Occurrence Service Enhanced Types
export interface OccurrenceCount {
  count: number;
}

export type OccurrenceDownloadStatus = 'PREPARING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'KILLED' | 'SUSPENDED';

export interface OccurrenceDownloadRequest {
  creator: string;
  notificationAddresses?: string[];
  sendNotification?: boolean;
  format?: 'DWCA' | 'SIMPLE_CSV' | 'SPECIES_LIST' | 'SIMPLE_PARQUET';
  predicate: DownloadPredicate;
}

export interface DownloadPredicate {
  type: 'equals' | 'and' | 'or' | 'not' | 'in' | 'lessThan' | 'lessThanOrEquals' | 'greaterThan' | 'greaterThanOrEquals' | 'like' | 'within' | 'isNotNull' | 'isNull';
  key?: string;
  value?: string | number;
  values?: (string | number)[];
  predicates?: DownloadPredicate[];
  geometry?: string;
  predicate?: DownloadPredicate;
}

export interface OccurrenceDownload {
  key: string;
  doi?: string;
  license?: string;
  request?: OccurrenceDownloadRequest;
  created?: string;
  modified?: string;
  eraseAfter?: string;
  status?: OccurrenceDownloadStatus;
  downloadLink?: string;
  size?: number;
  totalRecords?: number;
  numberDatasets?: number;
}

export interface Facet {
  field: string;
  counts: FacetCount[];
}

export interface FacetCount {
  name: string;
  count: number;
}

// Literature API Types
export interface Literature {
  id?: string;
  key?: string;
  title?: string;
  authors?: Array<{
    firstName?: string;
    lastName?: string;
  }>;
  year?: number;
  month?: number;
  day?: number;
  source?: string;
  identifiers?: {
    doi?: string;
    [key: string]: any;
  };
  keywords?: string[];
  websites?: string[];
  openAccess?: boolean;
  open_access?: boolean;
  peerReview?: boolean;
  peer_review?: boolean;
  publisher?: string;
  topics?: string[];
  literatureType?: string;
  literature_type?: string;
  relevance?: string;
  countriesOfResearcher?: string[];
  countries?: string[];
  countriesOfCoverage?: string[];
  country_research?: string[];
  gbif_region?: string[];
  gbifDatasetKey?: string[];
  gbifDownloadKey?: string[];
  publishedDate?: string;
  published_date?: string;
  accessed?: string;
  created?: string;
  abstract?: string;
  tags?: string[];
}

export interface LiteratureSearchParams {
  q?: string;
  countriesOfResearcher?: string;
  countriesOfCoverage?: string;
  literatureType?: string;
  relevance?: string;
  topics?: string;
  year?: number;
  source?: string;
  peerReview?: boolean;
  openAccess?: boolean;
  gbifDatasetKey?: string;
  publishingOrganizationKey?: string;
  gbifDownloadKey?: string;
  gbifOccurrenceKey?: number;
  limit?: number;
  offset?: number;
}

// Map API Types
export interface MapTileParams {
  z: number;
  x: number;
  y: number;
  format?: 'png' | 'mvt';
  scale?: 1 | 2 | 3;
  srs?: 'EPSG:3857' | 'EPSG:4326';
  style?: string;
  // Filters
  taxonKey?: number;
  datasetKey?: string;
  country?: string;
  publishingOrg?: string;
  publishingCountry?: string;
  year?: string | number;
  basisOfRecord?: string | string[];
  bin?: 'hex' | 'square';
  hexPerTile?: number;
  squareSize?: number;
}

export interface MapRequest {
  source?: string;
  z?: number;
  x?: number;
  y?: number;
  format?: string;
  srs?: string;
  style?: string;
  taxonKey?: number;
  datasetKey?: string;
  country?: string;
  publishingOrg?: string;
  publishingCountry?: string;
  year?: string;
  basisOfRecord?: string[];
  bin?: string;
  hexPerTile?: number;
  squareSize?: number;
}

// Vocabulary API Types
export interface Concept {
  name: string;
  label: any;
  definition?: any;
  externalDefinitions?: string[];
  sameAsUris?: string[];
  editorialNotes?: string[];
  deprecated?: boolean;
  replacedByKey?: number;
  createdBy?: string;
  modifiedBy?: string;
  created?: string;
  modified?: string;
  vocabularyKey?: number;
  parentKey?: number;
  alternativeLabels?: any;
  hiddenLabels?: any[];
  children?: Concept[];
}

export interface Vocabulary {
  key: number;
  name: string;
  label: any;
  definition?: any;
  externalDefinitions?: string[];
  editorialNotes?: string[];
  deprecated?: boolean;
  replacedByKey?: number;
  createdBy?: string;
  modifiedBy?: string;
  created?: string;
  modified?: string;
}

// Validation API Types
export interface ValidationResult {
  valid: boolean;
  indexeable?: boolean;
  issues?: ValidationIssue[];
}

export interface ValidationIssue {
  issueFlag?: string;
  severity?: string;
  related?: string[];
  lineNumbers?: number[];
  count?: number;
  sample?: any[];
}

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