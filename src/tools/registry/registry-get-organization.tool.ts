import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { Organization } from '../../types/gbif.types.js';

/**
 * Tool for getting detailed organization information by UUID
 */
export class RegistryGetOrganizationTool extends BaseTool<{ key: string }, Organization> {
  protected readonly name = 'gbif_registry_get_organization';
  protected readonly description = 'Get complete details for a specific data-publishing organization. Returns contacts, addresses, datasets published, endorsement status, and institutional information.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Organization UUID. The unique identifier for the organization in GBIF registry. Example: "07f617d0-c688-11d8-bf62-b8a03c50a862" (GBIF Secretariat). Get from gbif_registry_search_organizations.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const organization = await this.registryService.getOrganization(input.key);

    return this.formatResponse(organization, {
      organizationKey: input.key,
      title: organization.title,
      country: organization.country,
      numDatasets: organization.numPublishedDatasets,
    });
  }
}
