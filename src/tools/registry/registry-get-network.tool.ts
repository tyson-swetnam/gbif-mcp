import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { Network } from '../../types/gbif.types.js';

/**
 * Tool for getting detailed network information
 */
export class RegistryGetNetworkTool extends BaseTool<{ key: string }, Network> {
  protected readonly name = 'gbif_registry_get_network';
  protected readonly description = 'Get complete details for a specific dataset network. Returns network metadata, constituent datasets, contacts, and description. Use to understand collaborative data initiatives and their scope.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Network UUID. The unique identifier for the network. Example: UUID for eBird network or iNaturalist network. Get from gbif_registry_search_networks.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const network = await this.registryService.getNetwork(input.key);

    return this.formatResponse(network, {
      networkKey: input.key,
      title: network.title,
      numConstituents: network.numConstituents,
    });
  }
}
