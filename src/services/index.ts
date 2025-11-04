/**
 * GBIF Services
 *
 * Exports all GBIF API service classes for use throughout the application.
 */

export { SpeciesService } from './species/species.service.js';
export { OccurrenceService } from './occurrence/occurrence.service.js';

// Export types for convenience
export type {
  Species,
  SpeciesSearchParams,
  SpeciesMatch,
  SpeciesMatchParams,
  SpeciesSuggest,
  VernacularName,
  SpeciesSynonym,
  TaxonParent,
  Occurrence,
  OccurrenceSearchParams,
  OccurrenceCount,
  OccurrenceDownloadRequest,
  OccurrenceDownload,
  DownloadPredicate,
  GBIFResponse,
} from '../types/gbif.types.js';
