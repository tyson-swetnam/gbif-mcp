import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { MapsService } from '../../services/maps/maps.service.js';

/**
 * Tool for generating raster tile URLs (PNG format)
 */
export class MapsGetRasterTileUrlTool extends BaseTool<any, string> {
  protected readonly name = 'gbif_maps_get_raster_tile_url';
  protected readonly description = 'Generate URL for pre-rendered PNG density map tiles. Raster tiles show occurrence density with various color schemes. Fast rendering, ideal for simple map displays. Use for quick visualization without client-side rendering overhead.';

  protected readonly inputSchema = z.object({
    z: z.number().min(0).max(20).describe('Zoom level (0-20). Standard web Mercator zoom.'),
    x: z.number().min(0).describe('Tile column. Valid: 0 to (2^z - 1).'),
    y: z.number().min(0).describe('Tile row. Valid: 0 to (2^z - 1).'),
    style: z.string().optional().describe(
      'Color scheme for density visualization. Common: "purpleHeat.point" (purple heatmap), "fire.point" (red/yellow), "glacier.point" (blue), "classic.poly" (traditional). Affects how occurrence density is visualized.'
    ),
    taxonKey: z.number().optional().describe('Filter to specific taxon. Example: 5231190 (lions).'),
    country: z.string().length(2).optional().describe('Filter to country. Example: "KE" (Kenya).'),
    year: z.string().optional().describe('Filter by year/range. Example: "2020,2024".'),
    scale: z.number().min(1).max(4).optional().describe(
      'Pixel density. 1=standard (256x256), 2=retina (512x512). Default: 1.'
    ),
  });

  private mapsService: MapsService;

  constructor(mapsService: MapsService) {
    super();
    this.mapsService = mapsService;
  }

  protected async run(input: any): Promise<any> {
    const { z, x, y, ...filters } = input;
    const url = this.mapsService.getRasterTileUrl(z, x, y, filters);

    return this.formatResponse(url, {
      z, x, y,
      format: 'png',
      style: input.style,
    });
  }
}
