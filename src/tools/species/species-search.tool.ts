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
    q: z.string().optional().describe('Search query string'),
    rank: z.enum(['KINGDOM', 'PHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES'])
      .optional()
      .describe('Taxonomic rank filter'),
    higherTaxonKey: z.number().optional().describe('Filter by higher taxon key'),
    status: z.array(z.enum(['ACCEPTED', 'DOUBTFUL', 'SYNONYM', 'HETEROTYPIC_SYNONYM', 'HOMOTYPIC_SYNONYM']))
      .optional()
      .describe('Taxonomic status filter'),
    isExtinct: z.boolean().optional().describe('Filter extinct species'),
    habitat: z.array(z.enum(['MARINE', 'FRESHWATER', 'TERRESTRIAL']))
      .optional()
      .describe('Habitat filter'),
    threat: z.array(z.enum(['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE']))
      .optional()
      .describe('IUCN threat status filter'),
    nameType: z.array(z.enum(['WELLFORMED', 'DOUBTFUL', 'PLACEHOLDER', 'NO_NAME', 'SCIENTIFIC', 'VIRUS', 'HYBRID', 'INFORMAL', 'CULTIVAR', 'CANDIDATUS']))
      .optional()
      .describe('Name type filter'),
    datasetKey: z.array(z.string()).optional().describe('Dataset key filter'),
    nomenclaturalStatus: z.array(z.string()).optional().describe('Nomenclatural status filter'),
    issue: z.array(z.string()).optional().describe('Data quality issue filter'),
    hl: z.boolean().optional().describe('Enable search highlighting'),
    facet: z.array(z.string()).optional().describe('Facet fields to include'),
    facetMincount: z.number().min(1).optional().describe('Minimum facet count'),
    facetMultiselect: z.boolean().optional().describe('Enable facet multiselect'),
    offset: z.number().min(0).default(0).describe('Pagination offset'),
    limit: z.number().min(1).max(1000).default(20).describe('Number of results to return'),
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
    key: z.number().describe('GBIF species key'),
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
    q: z.string().min(2).describe('Partial species name for suggestions'),
    limit: z.number().min(1).max(100).default(10).describe('Maximum number of suggestions'),
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
    name: z.string().describe('Species name to match'),
    strict: z.boolean().default(false).describe('Use strict matching'),
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