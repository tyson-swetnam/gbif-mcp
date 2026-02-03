import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { SpeciesService } from '../../services/species/species.service.js';

/**
 * Tool for parsing and standardizing scientific names in batch
 */
export class SpeciesParseNamesTool extends BaseTool<{ names: string[] }, any[]> {
  protected readonly name = 'gbif_species_parse_names';
  protected readonly description = 'Parse and standardize scientific names in batch using GBIF\'s name parser. Extracts genus, species, authorship, rank, and more from scientific name strings. Essential for data cleaning, quality checking, and standardizing names from spreadsheets or databases. Handles up to 1000 names per request.';

  protected readonly inputSchema = z.object({
    names: z.array(z.string()).min(1).max(1000).describe(
      'Array of scientific names to parse. Each name is a string that may include authorship, year, and infraspecific epithets. Examples: ["Panthera leo (Linnaeus, 1758)", "Puma concolor", "Quercus robur L."]. Maximum: 1000 names per request. Returns parsed components for each name including: genus, specificEpithet, scientificName, authorship, year, rank, and parsing quality indicators.'
    ),
  });

  private speciesService: SpeciesService;

  constructor(speciesService: SpeciesService) {
    super();
    this.speciesService = speciesService;
  }

  protected async run(input: { names: string[] }): Promise<any> {
    const parsedNames = await this.speciesService.parseNames(input.names);

    const parsed = parsedNames.filter(n => n.parsed).length;
    const unparsed = parsedNames.length - parsed;

    return this.formatResponse(parsedNames, {
      totalNames: input.names.length,
      successfullyParsed: parsed,
      failedToParse: unparsed,
      parseRate: `${Math.round((parsed / input.names.length) * 100)}%`,
    });
  }
}
