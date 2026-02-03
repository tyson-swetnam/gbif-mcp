import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidatorValidateDwcaTool } from '../../../../src/tools/validator/validator-validate-dwca.tool.js';
import { ValidatorService } from '../../../../src/services/validator/validator.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('ValidatorValidateDwcaTool', () => {
  let tool: ValidatorValidateDwcaTool;
  let validatorService: ValidatorService;

  beforeEach(() => {
    const client = new GBIFClient();
    validatorService = new ValidatorService(client);
    tool = new ValidatorValidateDwcaTool(validatorService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_validator_validate_dwca');
    expect(definition.description).toContain('Darwin Core');
  });

  it('should validate archive URL', async () => {
    const mockResult = {
      valid: true,
      indexeable: true,
      issues: [],
    };

    vi.spyOn(validatorService, 'validateDwca').mockResolvedValue(mockResult);

    const result: any = await tool.execute({
      fileUrl: 'https://example.com/archive.zip',
    });
    expect(result.success).toBe(true);
    expect(result.data.valid).toBe(true);
  });

  it('should reject invalid URL', async () => {
    await expect(tool.execute({ fileUrl: 'not-a-url' })).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(validatorService, 'validateDwca').mockRejectedValue(
      new Error('Validation failed')
    );

    await expect(
      tool.execute({ fileUrl: 'https://example.com/bad.zip' })
    ).rejects.toThrow();
  });
});
