import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';

/**
 * Tool for getting detailed installation information
 */
export class RegistryGetInstallationTool extends BaseTool<{ key: string }, any> {
  protected readonly name = 'gbif_registry_get_installation';
  protected readonly description = 'Get complete details for a specific IPT or data server installation. Returns technical endpoint information, hosting organization, and datasets served by this installation.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Installation UUID. The unique identifier for the installation server. Get from gbif_registry_search_installations.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const installation = await this.registryService.getInstallation(input.key);

    return this.formatResponse(installation, {
      installationKey: input.key,
      type: installation.type,
    });
  }
}
