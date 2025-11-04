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
  month?: string;
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
  hostingOrganizationKey?: string;
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

// Literature API Types
export interface Literature {
  key?: string;
  title?: string;
  authors?: any[];
  year?: number;
  source?: string;
  identifiers?: any;
  keywords?: string[];
  websites?: string[];
  open_access?: boolean;
  peer_review?: boolean;
  publisher?: string;
  topics?: string[];
  literature_type?: string;
  relevance?: any;
  countries?: string[];
  country_research?: string[];
  gbif_region?: string[];
  published_date?: string;
  accessed?: string;
  abstract?: string;
}

// Map API Types
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