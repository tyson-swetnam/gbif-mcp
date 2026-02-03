import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { ValidatorService } from '../../services/validator/validator.service.js';

/**
 * Tool for validating tabular data files (CSV/TSV) before DwC-A creation
 */
export class ValidatorValidateTabularTool extends BaseTool<{ fileUrl: string; fileType?: string }, any> {
  protected readonly name = 'gbif_validator_validate_tabular';
  protected readonly description = 'Validate tabular data files (CSV, TSV) against Darwin Core standards before creating archives. Checks column headers, data types, required fields, and format compliance. Useful for data preparation workflows, pre-publication validation, and quality assurance before creating Darwin Core Archives. Returns validation report with field-level issues.';

  protected readonly inputSchema = z.object({
    fileUrl: z.string().url().describe(
      'Public URL of the tabular file (.csv or .tsv). Must be publicly accessible. The file should have Darwin Core term headers (scientificName, decimalLatitude, etc.). Example: "https://example.com/occurrences.csv". Will be validated against DwC standards.'
    ),
    fileType: z.enum(['CSV', 'TSV']).optional().default('CSV').describe(
      'File format. CSV (comma-separated) or TSV (tab-separated). Default: CSV. Determines delimiter used for parsing.'
    ),
  });

  private validatorService: ValidatorService;

  constructor(validatorService: ValidatorService) {
    super();
    this.validatorService = validatorService;
  }

  protected async run(input: { fileUrl: string; fileType?: string }): Promise<any> {
    const result = await this.validatorService.validateFile(input.fileUrl, input.fileType || 'CSV');

    return this.formatResponse(result, {
      fileUrl: input.fileUrl,
      fileType: input.fileType || 'CSV',
      valid: result.valid,
      issueCount: result.issues?.length || 0,
    });
  }
}
