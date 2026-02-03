import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapsGetRasterTileUrlTool } from '../../../../src/tools/maps/maps-get-raster-tile-url.tool.js';
import { MapsService } from '../../../../src/services/maps/maps.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('MapsGetRasterTileUrlTool', () => {
  let tool: MapsGetRasterTileUrlTool;
  let mapsService: MapsService;

  beforeEach(() => {
    const client = new GBIFClient();
    mapsService = new MapsService(client);
    tool = new MapsGetRasterTileUrlTool(mapsService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_maps_get_raster_tile_url');
  });

  it('should generate raster tile URL', async () => {
    const mockUrl = 'http://api.gbif.org/v2/map/occurrence/density/0/0/0.png';
    vi.spyOn(mapsService, 'getRasterTileUrl').mockReturnValue(mockUrl);

    const result: any = await tool.execute({ z: 0, x: 0, y: 0 });
    expect(result.success).toBe(true);
    expect(result.data).toContain('.png');
  });
});
