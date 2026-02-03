import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';

/**
 * Tool for getting detailed collection information from GRSciColl
 */
export class RegistryGetCollectionTool extends BaseTool<{ key: string }, any> {
  protected readonly name = 'gbif_registry_get_collection';
  protected readonly description = 'Get complete details for a specific scientific collection from GRSciColl. Returns collection metadata, institutional affiliation, specimen holdings, contacts, and preservation methods. Essential for understanding physical specimen repositories.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Collection UUID from GRSciColl. The unique identifier for the collection. Example: UUID for USNM Entomology Collection or Kew Herbarium. Get from gbif_registry_search_collections.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const collection = await this.registryService.getCollection(input.key);

    return this.formatResponse(collection, {
      collectionKey: input.key,
      code: collection.code,
      name: collection.name,
    });
  }
}
