import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapsListStylesTool } from '../../../../src/tools/maps/maps-list-styles.tool.js';
import { MapsService } from '../../../../src/services/maps/maps.service.js';
import { GBIFClient } from '../../../../src/core/gbif-client.js';

describe('MapsListStylesTool', () => {
  let tool: MapsListStylesTool;
  let mapsService: MapsService;

  beforeEach(() => {
    const client = new GBIFClient();
    mapsService = new MapsService(client);
    tool = new MapsListStylesTool(mapsService);
  });

  it('should have correct name', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBe('gbif_maps_list_styles');
  });

  it('should list available styles', async () => {
    const mockStyles = [
      { name: 'classic.poly', description: 'Classic polygons', type: 'poly' },
      { name: 'purpleHeat.point', description: 'Purple heatmap', type: 'point' },
    ];

    vi.spyOn(mapsService, 'getAvailableStyles').mockReturnValue(mockStyles);

    const result: any = await tool.execute({});
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });
});
