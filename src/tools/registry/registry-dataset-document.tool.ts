import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { RegistryService } from '../../services/registry/registry.service.js';

/**
 * Tool for getting dataset EML (Ecological Metadata Language) document
 */
export class RegistryDatasetDocumentTool extends BaseTool<{ key: string }, string> {
  protected readonly name = 'gbif_registry_dataset_document';
  protected readonly description = 'Get the EML (Ecological Metadata Language) metadata document for a dataset. Returns structured XML metadata including dataset description, contacts, geographic/taxonomic/temporal coverage, methods, and project information. Essential for proper dataset citation, understanding data collection methods, and accessing complete metadata.';

  protected readonly inputSchema = z.object({
    key: z.string().uuid().describe(
      'Dataset UUID. The unique identifier of the dataset whose EML document you want. EML is the standard metadata format for ecological datasets. Example: "50c9509d-22c7-4a22-a47d-8c48425ef4a7". Returns XML document.'
    ),
  });

  private registryService: RegistryService;

  constructor(registryService: RegistryService) {
    super();
    this.registryService = registryService;
  }

  protected async run(input: { key: string }): Promise<any> {
    const document = await this.registryService.getDatasetDocument(input.key);

    return this.formatResponse(document, {
      datasetKey: input.key,
      format: 'EML (XML)',
      hasMetadata: !!document,
    });
  }
}
