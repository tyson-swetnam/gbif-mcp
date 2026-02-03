import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { MapsService } from '../../services/maps/maps.service.js';

/**
 * Tool for generating vector tile URLs (MVT format)
 */
export class MapsGetVectorTileUrlTool extends BaseTool<any, string> {
  protected readonly name = 'gbif_maps_get_vector_tile_url';
  protected readonly description = 'Generate URL for occurrence vector tiles in Mapbox Vector Tile (MVT) format. Vector tiles enable client-side styling, interactivity, and dynamic rendering. Ideal for web mapping libraries like Mapbox GL JS, Leaflet with vector tile plugins, or OpenLayers.';

  protected readonly inputSchema = z.object({
    z: z.number().min(0).max(20).describe(
      'Zoom level (0-20). Controls detail level and tile grid size. Standard web Mercator zoom levels.'
    ),
    x: z.number().min(0).describe(
      'Tile column number. Horizontal position in tile grid. Valid range: 0 to (2^z - 1).'
    ),
    y: z.number().min(0).describe(
      'Tile row number. Vertical position in tile grid. Valid range: 0 to (2^z - 1).'
    ),
    style: z.string().optional().describe(
      'Style name for vector tiles. Common: "classic.poly", "green.poly". Get available styles from gbif_maps_list_styles.'
    ),
    taxonKey: z.number().optional().describe(
      'Filter to specific taxon. GBIF taxon key. Example: 212 (birds).'
    ),
    country: z.string().length(2).optional().describe(
      'Filter to specific country. 2-letter ISO code. Example: "US".'
    ),
    year: z.string().optional().describe(
      'Filter by year or year range. Format: "2024" or "2020,2024".'
    ),
    basisOfRecord: z.string().optional().describe(
      'Filter by record type. Example: HUMAN_OBSERVATION, PRESERVED_SPECIMEN.'
    ),
    datasetKey: z.string().optional().describe(
      'Filter to specific dataset. Dataset UUID.'
    ),
  });

  private mapsService: MapsService;

  constructor(mapsService: MapsService) {
    super();
    this.mapsService = mapsService;
  }

  protected async run(input: any): Promise<any> {
    const { z, x, y, ...filters } = input;
    const url = this.mapsService.getVectorTileUrl(z, x, y, filters);

    return this.formatResponse(url, {
      z, x, y,
      format: 'mvt',
      hasFilters: Object.keys(filters).length > 0,
    });
  }
}
