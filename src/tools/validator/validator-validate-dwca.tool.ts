import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { ValidatorService } from '../../services/validator/validator.service.js';

/**
 * Tool for validating Darwin Core Archives
 */
export class ValidatorValidateDwcaTool extends BaseTool<{ fileUrl: string }, any> {
  protected readonly name = 'gbif_validator_validate_dwca';
  protected readonly description = 'Validate a Darwin Core Archive (DwC-A) file against GBIF standards. Checks data structure, required fields, data quality, and format compliance. Returns validation report with issues, warnings, and recommendations. Essential before publishing datasets to GBIF.';

  protected readonly inputSchema = z.object({
    fileUrl: z.string().url().describe(
      'Public URL of the Darwin Core Archive (.zip file). Must be publicly accessible via HTTP/HTTPS. The archive should contain meta.xml, occurrence.txt or equivalent core file, and optional extension files. Example: "https://example.com/dataset.zip". File will be downloaded and validated asynchronously.'
    ),
  });

  private validatorService: ValidatorService;

  constructor(validatorService: ValidatorService) {
    super();
    this.validatorService = validatorService;
  }

  protected async run(input: { fileUrl: string }): Promise<any> {
    const result = await this.validatorService.validateDwca(input.fileUrl);

    return this.formatResponse(result, {
      fileUrl: input.fileUrl,
      valid: result.valid,
      issueCount: result.issues?.length || 0,
    });
  }
}
