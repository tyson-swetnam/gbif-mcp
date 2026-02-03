import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapsGetVectorTileUrlTool } from '../../../../src/tools/maps/maps-get-vector-tile-url.tool.js';
import { MapsService } from '../../../../src/services/maps/maps.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('MapsGetVectorTileUrlTool', () => {
  let tool: MapsGetVectorTileUrlTool;
  let mapsService: MapsService;

  beforeEach(() => {
    const client = new GBIFClient();
    mapsService = new MapsService(client);
    tool = new MapsGetVectorTileUrlTool(mapsService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_maps_get_vector_tile_url');
  });

  it('should generate vector tile URL', async () => {
    const mockUrl = 'http://api.gbif.org/v2/map/occurrence/0/0/0.mvt';
    vi.spyOn(mapsService, 'getVectorTileUrl').mockReturnValue(mockUrl);

    const result: any = await tool.execute({ z: 0, x: 0, y: 0 });
    expect(result.success).toBe(true);
    expect(result.data).toContain('.mvt');
  });

  it('should reject invalid coordinates', async () => {
    await expect(tool.execute({ z: 25, x: 0, y: 0 })).rejects.toThrow();
  });
});
