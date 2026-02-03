import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';

/**
 * Tool for getting detailed institution information from GRSciColl
 */
export class RegistryGetInstitutionTool extends BaseTool<{ key: string }, any> {
  protected readonly name = 'gbif_registry_get_institution';
  protected readonly description = 'Get complete details for a specific scientific institution from GRSciColl. Returns institutional metadata, collections housed, contacts, addresses, and identifiers. Use to understand institution profiles and their collection holdings.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Institution UUID from GRSciColl. The unique identifier for the institution. Example: UUID for Smithsonian Institution or Natural History Museum London. Get from gbif_registry_search_institutions.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const institution = await this.registryService.getInstitution(input.key);

    return this.formatResponse(institution, {
      institutionKey: input.key,
      code: institution.code,
      name: institution.name,
    });
  }
}
