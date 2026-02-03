import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryGetInstallationTool } from '../../../../src/tools/registry/registry-get-installation.tool.js';
import { RegistryService } from '../../../../src/services/registry/registry.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('RegistryGetInstallationTool', () => {
  let tool: RegistryGetInstallationTool;
  let registryService: RegistryService;

  beforeEach(() => {
    const client = new GBIFClient();
    registryService = new RegistryService(client);
    tool = new RegistryGetInstallationTool(registryService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_registry_get_installation');
  });

  it('should get installation by UUID', async () => {
    const instKey = '1193638d-60b4-4d9f-9b9a-2a0e16f9e7d8';
    const mockInst = {
      key: instKey,
      type: 'IPT_INSTALLATION',
    };

    vi.spyOn(registryService, 'getInstallation').mockResolvedValue(mockInst);

    const result: any = await tool.execute({ key: instKey });
    expect(result.success).toBe(true);
    expect(result.data.type).toBe('IPT_INSTALLATION');
  });

  it('should reject invalid UUID', async () => {
    await expect(tool.execute({ key: 'invalid' })).rejects.toThrow();
  });
});
