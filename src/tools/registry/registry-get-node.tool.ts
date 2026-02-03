import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';

/**
 * Tool for getting GBIF node details
 */
export class RegistryGetNodeTool extends BaseTool<{ key: string }, any> {
  protected readonly name = 'gbif_registry_get_node';
  protected readonly description = 'Get complete details for a GBIF participant node. Returns node metadata, contacts, participation type, country information, and endorsement details. Use to understand national GBIF participation, governance structure, and institutional membership.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Node UUID. The unique identifier for the GBIF node. Get from gbif_registry_list_nodes.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const node = await this.registryService.getNode(input.key);

    return this.formatResponse(node, {
      nodeKey: input.key,
      title: node.title,
      country: node.country,
    });
  }
}
