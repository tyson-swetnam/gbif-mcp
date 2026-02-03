import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { MapsService } from '../../services/maps/maps.service.js';

/**
 * Tool for generating occurrence map tile URLs
 */
export class MapsGetTileUrlTool extends BaseTool<any, string> {
  protected readonly name = 'gbif_maps_get_tile_url';
  protected readonly description = 'Generate a URL for occurrence map tiles with customizable styling and filters. Returns tile URLs in standard web Mercator projection (EPSG:3857) for use in web mapping applications, GIS software, or direct visualization.';

  protected readonly inputSchema = z.object({
    z: z.number().min(0).max(20).describe(
      'Zoom level (0-20). 0 shows the entire world, 20 shows street-level detail. Common values: 0-2 (world), 3-5 (continental), 6-10 (country/regional), 11-15 (city), 16-20 (neighborhood/street). Standard web Mercator zoom levels.'
    ),
    x: z.number().min(0).describe(
      'Tile column number (X coordinate). Horizontal position in the tile grid at the given zoom level. Valid range: 0 to (2^z - 1). Example: at zoom 0, only x=0 is valid; at zoom 1, x can be 0 or 1.'
    ),
    y: z.number().min(0).describe(
      'Tile row number (Y coordinate). Vertical position in the tile grid at the given zoom level. Valid range: 0 to (2^z - 1). Uses standard TMS (Tile Map Service) row numbering.'
    ),
    format: z.enum(['png', 'mvt']).optional().default('png').describe(
      'Tile format. PNG (raster image, best for visualization) or MVT (Mapbox Vector Tiles, best for interactive maps with client-side styling). Default: png.'
    ),
    style: z.string().optional().describe(
      'Map style name. Controls color scheme and visualization type. Common values: "classic.poly" (polygons), "purpleHeat.point" (heatmap), "green.poly", "fire.point", "glacier.point". Get available styles from gbif_maps_list_styles.'
    ),
    taxonKey: z.number().optional().describe(
      'Filter to specific taxon and all its children. GBIF taxon key. Example: 212 (all birds), 5231190 (Panthera leo - African lion). Only occurrences of this taxon will be shown on the map.'
    ),
    country: z.string().length(2).optional().describe(
      'Filter to specific country. 2-letter ISO country code. Example: "US", "BR", "KE". Only occurrences from this country will be mapped.'
    ),
    year: z.string().optional().describe(
      'Filter by observation year or year range. Format: "2024" (single year) or "2020,2024" (range from 2020-2024). Only occurrences from specified year(s) will appear.'
    ),
    basisOfRecord: z.string().optional().describe(
      'Filter by observation type. Values: HUMAN_OBSERVATION, MACHINE_OBSERVATION, PRESERVED_SPECIMEN, FOSSIL_SPECIMEN, LIVING_SPECIMEN, MATERIAL_SAMPLE, OCCURRENCE. Controls which types of records appear on map.'
    ),
    datasetKey: z.string().optional().describe(
      'Filter to specific dataset. Dataset UUID. Only occurrences from this dataset will be mapped. Get dataset UUIDs from gbif_registry_search_datasets.'
    ),
    scale: z.number().min(1).max(4).optional().describe(
      'Pixel density scale for retina displays. 1 = standard (256x256px), 2 = retina/2x (512x512px), 4 = ultra-high DPI. Higher values produce sharper images on high-DPI screens but larger file sizes. Default: 1.'
    ),
    srs: z.string().optional().describe(
      'Spatial Reference System. Default: EPSG:3857 (Web Mercator). Alternative: EPSG:4326 (WGS84 lat/long). Most web mapping libraries expect EPSG:3857.'
    ),
  });

  private mapsService: MapsService;

  constructor(mapsService: MapsService) {
    super();
    this.mapsService = mapsService;
  }

  protected async run(input: any): Promise<any> {
    const url = this.mapsService.getTileUrl(input);

    return this.formatResponse(url, {
      z: input.z,
      x: input.x,
      y: input.y,
      format: input.format || 'png',
      hasFilters: !!(input.taxonKey || input.country || input.year),
    });
  }
}
