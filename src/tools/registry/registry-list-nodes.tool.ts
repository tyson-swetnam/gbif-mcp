import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for listing GBIF participant nodes
 */
export class RegistryListNodesTool extends BaseTool<any, GBIFResponse<any>> {
  protected readonly name = 'gbif_registry_list_nodes';
  protected readonly description = 'List GBIF participant nodes (national/organizational participants). Nodes represent countries or organizations that participate in GBIF governance and data sharing. Essential for understanding GBIF network structure, national participation, and institutional membership.';

  protected readonly inputSchema = z.object({
    country: z.string().length(2).optional().describe('Filter to specific country node. 2-letter ISO code.'),
    limit: z.number().min(1).max(1000).default(20).describe('Maximum nodes to return. Range: 1-1000, default: 20.'),
    offset: z.number().min(0).default(0).describe('Pagination offset. Default: 0.'),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: any): Promise<any> {
    const response = await this.registryService.listNodes(input);

    return this.formatResponse(response, {
      totalNodes: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
