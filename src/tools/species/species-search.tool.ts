import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';
import type { Species, SpeciesSearchParams, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for searching GBIF species
 */
export class SpeciesSearchTool extends BaseTool<SpeciesSearchParams, GBIFResponse<Species>> {
  protected readonly name = 'gbif_species_search';
  protected readonly description = 'Search for species in the GBIF taxonomic backbone. Supports filtering by rank, status, habitat, threat level, and more.';

  protected readonly inputSchema = z.object({
    q: z.string().optional().describe('Simple full text search parameter. The value for this parameter can be a simple word or a phrase. Wildcards are not supported.'),
    rank: z.enum(['KINGDOM', 'PHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES'])
      .optional()
      .describe('Filters by taxonomic rank. See https://api.gbif.org/v1/enumeration/basic/Rank for full list. Common values: KINGDOM, PHYLUM, CLASS, ORDER, FAMILY, GENUS, SPECIES, SUBSPECIES.'),
    higherTaxonKey: z.number().optional().describe('Filters by any of the higher Linnean rank keys. Note this is within the respective checklist and not searching NUB keys across all checklists. Example: 212 (for family Felidae).'),
    status: z.array(z.enum(['ACCEPTED', 'DOUBTFUL', 'SYNONYM', 'HETEROTYPIC_SYNONYM', 'HOMOTYPIC_SYNONYM']))
      .optional()
      .describe('Filters by the taxonomic status. Values: ACCEPTED (valid taxon name), DOUBTFUL (uncertain status), SYNONYM (alternative name), HETEROTYPIC_SYNONYM (different type specimens), HOMOTYPIC_SYNONYM (same type specimen). See https://api.gbif.org/v1/enumeration/basic/TaxonomicStatus'),
    isExtinct: z.boolean().optional().describe('Filters by extinction status. Set to true to find only extinct species, false for extant species only.'),
    habitat: z.array(z.enum(['MARINE', 'FRESHWATER', 'TERRESTRIAL']))
      .optional()
      .describe('Filters by the habitat. Currently only 3 major biomes are accepted: MARINE (ocean/sea habitats), FRESHWATER (rivers/lakes), TERRESTRIAL (land habitats). See https://api.gbif.org/v1/enumeration/basic/Habitat'),
    threat: z.array(z.enum(['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE']))
      .optional()
      .describe('Filters by IUCN threat status. Values: EX (Extinct), EW (Extinct in Wild), CR (Critically Endangered), EN (Endangered), VU (Vulnerable), NT (Near Threatened), LC (Least Concern), DD (Data Deficient), NE (Not Evaluated). See https://api.gbif.org/v1/enumeration/basic/ThreatStatus'),
    nameType: z.array(z.enum(['WELLFORMED', 'DOUBTFUL', 'PLACEHOLDER', 'NO_NAME', 'SCIENTIFIC', 'VIRUS', 'HYBRID', 'INFORMAL', 'CULTIVAR', 'CANDIDATUS']))
      .optional()
      .describe('Filters by name type. Values: SCIENTIFIC (proper scientific names), VIRUS (virus names), HYBRID (hybrid names), INFORMAL (informal names), CULTIVAR (cultivated varieties), CANDIDATUS (proposed bacterial names), DOUBTFUL (uncertain names), PLACEHOLDER (temporary names), NO_NAME (unnamed taxa). See https://api.gbif.org/v1/enumeration/basic/NameType'),
    datasetKey: z.array(z.string()).optional().describe('A UUID of a checklist dataset. Example: "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c" (GBIF Backbone Taxonomy). Can be repeated to query multiple datasets.'),
    nomenclaturalStatus: z.array(z.string()).optional().describe('Filters by nomenclatural status. Values include: LEGITIMATE, VALIDLY_PUBLISHED, NEW_COMBINATION, REPLACEMENT, CONSERVED, REJECTED, INVALID, etc. See https://api.gbif.org/v1/enumeration/basic/NomenclaturalStatus for complete list.'),
    issue: z.array(z.string()).optional().describe('A specific indexing issue. Values include: BACKBONE_MATCH_NONE, BACKBONE_MATCH_FUZZY, RANK_INVALID, SCIENTIFIC_NAME_ASSEMBLED, CLASSIFICATION_NOT_APPLIED, etc. See https://api.gbif.org/v1/enumeration/basic/NameUsageIssue for full list.'),
    hl: z.boolean().optional().describe('Set hl=true to highlight terms matching the query in fulltext search fields. The highlight will be an emphasis tag of class "gbifHl".'),
    facet: z.array(z.string()).optional().describe('A facet name used to retrieve the most frequent values for a field. This parameter may be repeated to request multiple facets. Example: ["rank", "status", "habitat"] to get counts by rank, status, and habitat.'),
    facetMincount: z.number().min(1).optional().describe('Used in combination with the facet parameter. Set facetMincount={#} to exclude facets with a count less than {#}. Example: facetMincount=10 to only show facet values appearing 10+ times.'),
    facetMultiselect: z.boolean().optional().describe('Used in combination with the facet parameter. Set facetMultiselect=true to still return counts for values that are not currently filtered. Useful for multi-select faceted search interfaces.'),
    offset: z.number().min(0).default(0).describe('Determines the offset for the search results. A limit of 20 and offset of 40 will get the third page of 20 results. Some services have a maximum offset.'),
    limit: z.number().min(1).max(1000).default(20).describe('Controls the number of results in the page. Using too high a value will be overwritten with the default maximum threshold. Sensible defaults are used so this may be omitted. Maximum: 1000.'),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: SpeciesSearchParams): Promise<GBIFResponse<Species>> {
    const results = await this.speciesService.search(input);
    return this.formatResponse(results, {
      query: input.q,
      totalCount: results.count,
      returnedCount: results.results?.length || 0,
    });
  }
}

/**
 * Tool for getting species details by key
 */
export class SpeciesGetTool extends BaseTool<{ key: number }, Species> {
  protected readonly name = 'gbif_species_get';
  protected readonly description = 'Get detailed information about a specific species by its GBIF key.';

  protected readonly inputSchema = z.object({
    key: z.number().describe('The GBIF unique identifier for a species (usageKey). This is a numeric key that uniquely identifies a taxon in the GBIF backbone taxonomy. Example: 5219404 (Panthera leo - African lion).'),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: { key: number }): Promise<Species> {
    const species = await this.speciesService.getByKey(input.key);
    return this.formatResponse(species, {
      scientificName: species.scientificName,
      rank: species.rank,
    });
  }
}

/**
 * Tool for species name suggestions
 */
export class SpeciesSuggestTool extends BaseTool<{ q: string; limit?: number }, Species[]> {
  protected readonly name = 'gbif_species_suggest';
  protected readonly description = 'Get species name suggestions for autocomplete functionality.';

  protected readonly inputSchema = z.object({
    q: z.string().min(2).describe('Partial species name for autocomplete suggestions. Minimum 2 characters required. Example: "Pant" to get suggestions like "Panthera", "Panthera leo", etc.'),
    limit: z.number().min(1).max(100).default(10).describe('Maximum number of suggestions to return. Controls the number of autocomplete results. Range: 1-100, default: 10.'),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: { q: string; limit?: number }): Promise<any> {
    const suggestions = await this.speciesService.suggest(input.q, { limit: input.limit });
    return this.formatResponse(suggestions, {
      query: input.q,
      count: suggestions.length,
    });
  }
}

/**
 * Tool for fuzzy species name matching
 */
export class SpeciesMatchTool extends BaseTool<{ name: string; strict?: boolean }, Species[]> {
  protected readonly name = 'gbif_species_match';
  protected readonly description = 'Fuzzy match a species name against the GBIF backbone taxonomy.';

  protected readonly inputSchema = z.object({
    name: z.string().describe('Species scientific name to match against the GBIF backbone taxonomy. Can be a full or partial scientific name. Example: "Panthera leo" or "Puma concolor". The matching algorithm is fuzzy and will try to find the best match even with misspellings.'),
    strict: z.boolean().default(false).describe('Use strict matching mode. When false (default), allows fuzzy matching with typo tolerance. When true, only exact matches are returned. Recommended: false for most use cases to handle name variations and historical synonyms.'),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: { name: string; strict?: boolean }): Promise<any> {
    const match = await this.speciesService.match({ name: input.name, strict: input.strict });
    return this.formatResponse(match, {
      query: input.name,
      strict: input.strict,
    });
  }
}