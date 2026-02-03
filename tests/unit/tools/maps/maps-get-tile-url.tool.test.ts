import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapsGetTileUrlTool } from '../../../../src/tools/maps/maps-get-tile-url.tool.js';
import { MapsService } from '../../../../src/services/maps/maps.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('MapsGetTileUrlTool', () => {
  let tool: MapsGetTileUrlTool;
  let mapsService: MapsService;

  beforeEach(() => {
    const client = new GBIFClient();
    mapsService = new MapsService(client);
    tool = new MapsGetTileUrlTool(mapsService);
  });

  it('should have correct tool definition', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_maps_get_tile_url');
    expect(definition.description).toContain('tile');
  });

  it('should generate tile URL', async () => {
    const mockUrl = 'http://api.gbif.org/v2/map/occurrence/density/0/0/0.png';
    vi.spyOn(mapsService, 'getTileUrl').mockReturnValue(mockUrl);

    const result: any = await tool.execute({ z: 0, x: 0, y: 0 });
    expect(result.success).toBe(true);
    expect(typeof result.data).toBe('string');
    expect(result.data).toContain('map');
  });

  it('should reject invalid zoom level', async () => {
    await expect(tool.execute({ z: 25, x: 0, y: 0 })).rejects.toThrow();
  });

  it('should handle service errors', async () => {
    vi.spyOn(mapsService, 'getTileUrl').mockImplementation(() => {
      throw new Error('Invalid coordinates');
    });

    await expect(tool.execute({ z: 0, x: 0, y: 0 })).rejects.toThrow();
  });
});
