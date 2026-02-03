import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { Dataset, GBIFResponse } from '../../types/gbif.types.js';

/**
 * Tool for listing datasets published by an organization
 */
export class RegistryOrganizationDatasetsTool extends BaseTool<any, GBIFResponse<Dataset>> {
  protected readonly name = 'gbif_registry_organization_datasets';
  protected readonly description = 'List all datasets published by a specific organization. Shows the complete catalog of datasets contributed by an institution. Useful for understanding an organization\'s data contributions and portfolio.';

  protected readonly inputSchema = z.object({
    organizationKey: z.string().uuid().describe(
      'Organization UUID. The unique identifier of the publishing organization. Example: "07f617d0-c688-11d8-bf62-b8a03c50a862". Get from gbif_registry_search_organizations or gbif_registry_get_organization.'
    ),
    type: z.enum(['OCCURRENCE', 'CHECKLIST', 'SAMPLING_EVENT', 'METADATA'])
      .optional()
      .describe(
        'Filter datasets by type. OCCURRENCE (specimen/observation records), CHECKLIST (species lists), SAMPLING_EVENT (survey data), METADATA (descriptions only). Omit to get all types.'
      ),
    limit: z.number().min(1).max(1000).default(20).describe(
      'Maximum number of datasets to return per page. Range: 1-1000, default: 20.'
    ),
    offset: z.number().min(0).default(0).describe(
      'Pagination offset. Number of datasets to skip. Default: 0.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: any): Promise<any> {
    const response = await this.registryService.getOrganizationDatasets(
      input.organizationKey,
      { type: input.type, limit: input.limit, offset: input.offset }
    );

    return this.formatResponse(response, {
      organizationKey: input.organizationKey,
      type: input.type,
      totalCount: response.count,
      returnedCount: response.results?.length || 0,
    });
  }
}
