import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { LiteratureService } from '../../services/literature/literature.service.js';

/**
 * Tool for getting literature by DOI
 */
export class LiteratureGetTool extends BaseTool<{ doi: string }, any> {
  protected readonly name = 'gbif_literature_get';
  protected readonly description = 'Get complete metadata for a scientific publication by its DOI. Returns title, authors, abstract, journal, citation info, and GBIF usage details. Use to get full details about a specific paper that used GBIF data.';

  protected readonly inputSchema = z.object({
    doi: z.string().describe(
      'DOI (Digital Object Identifier) of the publication. Standard format: "10.1234/example". Example: "10.1038/nature12345" or "10.1371/journal.pone.0123456". Get DOIs from gbif_literature_search results.'
    ),
  });

  private literatureService: LiteratureService;

  constructor(literatureService: LiteratureService) {
    super();
    this.literatureService = literatureService;
  }

  protected async run(input: { doi: string }): Promise<any> {
    const literature = await this.literatureService.getByDoi(input.doi);

    return this.formatResponse(literature, {
      doi: input.doi,
      title: literature.title,
      year: literature.year,
    });
  }
}
