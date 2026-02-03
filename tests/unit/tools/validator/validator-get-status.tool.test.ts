import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidatorGetStatusTool } from '../../../../src/tools/validator/validator-get-status.tool.js';
import { ValidatorService } from '../../../../src/services/validator/validator.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('ValidatorGetStatusTool', () => {
  let tool: ValidatorGetStatusTool;
  let validatorService: ValidatorService;

  beforeEach(() => {
    const client = new GBIFClient();
    validatorService = new ValidatorService(client);
    tool = new ValidatorGetStatusTool(validatorService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_validator_get_status');
  });

  it('should get validation status', async () => {
    const mockStatus = {
      valid: true,
      indexeable: true,
      issues: [],
    };

    vi.spyOn(validatorService, 'getStatus').mockResolvedValue(mockStatus);

    const result: any = await tool.execute({ validationKey: 'job-123' });
    expect(result.success).toBe(true);
    expect(result.data.valid).toBe(true);
  });

  it('should handle service errors', async () => {
    vi.spyOn(validatorService, 'getStatus').mockRejectedValue(
      new Error('Not found')
    );

    await expect(tool.execute({ validationKey: 'invalid' })).rejects.toThrow();
  });
});
