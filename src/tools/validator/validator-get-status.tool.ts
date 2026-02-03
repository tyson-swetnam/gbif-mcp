import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { ValidatorService } from '../../services/validator/validator.service.js';

/**
 * Tool for getting validation job status
 */
export class ValidatorGetStatusTool extends BaseTool<{ validationKey: string }, any> {
  protected readonly name = 'gbif_validator_get_status';
  protected readonly description = 'Check the status of an asynchronous Darwin Core Archive validation job. Validation is processed asynchronously, so use this tool to poll for completion and retrieve results. Returns validation status, progress, and results when complete.';

  protected readonly inputSchema = z.object({
    validationKey: z.string().describe(
      'Validation job key/ID returned by gbif_validator_validate_dwca. Unique identifier for the validation task. Use to check progress and retrieve results. Example: validation key from previous validation request.'
    ),
  });

  private validatorService: ValidatorService;

  constructor(validatorService: ValidatorService) {
    super();
    this.validatorService = validatorService;
  }

  protected async run(input: { validationKey: string }): Promise<any> {
    const result = await this.validatorService.getStatus(input.validationKey);

    return this.formatResponse(result, {
      validationKey: input.validationKey,
      valid: result.valid,
      issueCount: result.issues?.length || 0,
    });
  }
}
