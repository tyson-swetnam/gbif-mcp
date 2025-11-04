import { GBIFClient } from '../../core/gbif-client.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/config.js';
import type { MapTileParams, GBIFError } from '../../types/gbif.types.js';

/**
 * Maps Service
 *
 * Provides tile generation URLs for GBIF occurrence map visualization.
 * Maps API supports both raster (PNG) and vector (MVT) tiles with various
 * styling options and filtering capabilities.
 */
export class MapsService {
  private readonly client: GBIFClient;
  private readonly baseUrl: string;
  private readonly apiVersion = 'v2';

  constructor(client: GBIFClient) {
    this.client = client;
    this.baseUrl = config.gbif.baseUrl.replace('/v1', ''); // Remove /v1 for maps API
    logger.info('Maps service initialized');
  }

  /**
   * Generate map tile URL
   *
   * Generates a URL for fetching map tiles (either raster PNG or vector MVT).
   * The Maps API uses standard web Mercator projection (EPSG:3857) and supports
   * extensive filtering options to visualize specific subsets of occurrence data.
   *
   * @param params - Tile coordinates and visualization parameters
   * @returns Complete tile URL
   *
   * @example
   * ```typescript
   * // Get PNG density map for birds in USA
   * const url = mapsService.getTileUrl({
   *   z: 4,
   *   x: 3,
   *   y: 5,
   *   format: 'png',
   *   taxonKey: 212, // Aves
   *   country: 'US',
   *   style: 'purpleHeat'
   * });
   * ```
   */
  getTileUrl(params: MapTileParams): string {
    try {
      logger.info('Generating tile URL', { params });

      const {
        z,
        x,
        y,
        format = 'png',
        scale,
        srs,
        style,
        ...filters
      } = params;

      // Validate tile coordinates
      this.validateTileCoordinates(z, x, y);

      // Build base URL path
      let urlPath: string;
      if (format === 'mvt') {
        // Vector tiles
        urlPath = `${this.baseUrl}/${this.apiVersion}/map/occurrence/${z}/${x}/${y}.mvt`;
      } else {
        // Raster tiles
        const scaleStr = scale ? `@${scale}x` : '';
        urlPath = `${this.baseUrl}/${this.apiVersion}/map/occurrence/density/${z}/${x}/${y}${scaleStr}.png`;
      }

      // Build query parameters
      const queryParams: string[] = [];

      if (srs) queryParams.push(`srs=${encodeURIComponent(srs)}`);
      if (style) queryParams.push(`style=${encodeURIComponent(style)}`);

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.push(`${key}=${encodeURIComponent(v)}`));
          } else {
            queryParams.push(`${key}=${encodeURIComponent(value)}`);
          }
        }
      });

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const fullUrl = `${urlPath}${queryString}`;

      logger.info('Tile URL generated', { url: fullUrl });

      return fullUrl;
    } catch (error) {
      logger.error('Failed to generate tile URL', { params, error });
      throw this.handleError(error, 'Failed to generate tile URL');
    }
  }

  /**
   * Get vector tile URL (MVT format)
   *
   * Generates URL for Mapbox Vector Tiles which provide better performance
   * for interactive maps and support client-side styling.
   *
   * @param z - Zoom level (0-20)
   * @param x - Tile column
   * @param y - Tile row
   * @param filters - Optional occurrence filters
   * @returns Vector tile URL
   *
   * @example
   * ```typescript
   * const url = mapsService.getVectorTileUrl(4, 3, 5, {
   *   taxonKey: 2435099, // Puma concolor
   *   year: 2024
   * });
   * ```
   */
  getVectorTileUrl(
    z: number,
    x: number,
    y: number,
    filters?: Record<string, any>
  ): string {
    return this.getTileUrl({
      z,
      x,
      y,
      format: 'mvt',
      ...filters,
    });
  }

  /**
   * Get raster tile URL (PNG format)
   *
   * Generates URL for pre-rendered PNG tiles with density visualization.
   * Supports various color schemes and retina display scaling.
   *
   * @param z - Zoom level (0-20)
   * @param x - Tile column
   * @param y - Tile row
   * @param options - Styling and filter options
   * @returns Raster tile URL
   *
   * @example
   * ```typescript
   * const url = mapsService.getRasterTileUrl(4, 3, 5, {
   *   scale: 2, // Retina display
   *   style: 'orangeHeat',
   *   taxonKey: 212,
   *   country: 'US'
   * });
   * ```
   */
  getRasterTileUrl(
    z: number,
    x: number,
    y: number,
    options: {
      scale?: 1 | 2 | 3;
      style?: string;
      srs?: 'EPSG:3857' | 'EPSG:4326';
      [key: string]: any;
    } = {}
  ): string {
    return this.getTileUrl({
      z,
      x,
      y,
      format: 'png',
      ...options,
    });
  }

  /**
   * Get map capabilities
   *
   * Retrieves metadata about the maps service including available
   * projections, styles, and tile schemes.
   *
   * @returns Capabilities metadata
   */
  async getCapabilities(): Promise<any> {
    try {
      logger.info('Fetching map capabilities');

      const response = await this.client.get<any>(
        `/${this.apiVersion}/map/occurrence/density/capabilities.json`
      );

      logger.info('Map capabilities retrieved');

      return response;
    } catch (error) {
      logger.error('Failed to get map capabilities', { error });
      throw this.handleError(error, 'Failed to get map capabilities');
    }
  }

  /**
   * Get available map styles
   *
   * Returns list of predefined color schemes and point styles available
   * for raster tile rendering.
   *
   * @returns Array of style names with descriptions
   *
   * @example
   * ```typescript
   * const styles = mapsService.getAvailableStyles();
   * // Returns: [
   * //   { name: 'purpleHeat', description: 'Purple density gradient', type: 'density' },
   * //   { name: 'classic.point', description: 'Classic yellow points', type: 'point' },
   * //   ...
   * // ]
   * ```
   */
  getAvailableStyles(): Array<{ name: string; description: string; type: 'density' | 'point' | 'poly' }> {
    return [
      // Density gradients
      { name: 'purpleHeat', description: 'Purple density gradient (default)', type: 'density' },
      { name: 'orangeHeat', description: 'Orange density gradient', type: 'density' },
      { name: 'greenHeat', description: 'Green density gradient', type: 'density' },
      { name: 'blueHeat', description: 'Blue density gradient', type: 'density' },
      // Point styles
      { name: 'classic.point', description: 'Classic yellow points', type: 'point' },
      { name: 'green.point', description: 'Green points', type: 'point' },
      { name: 'green2.point', description: 'Light green points', type: 'point' },
      { name: 'red.point', description: 'Red points', type: 'point' },
      { name: 'orange.point', description: 'Orange points', type: 'point' },
      { name: 'blue.point', description: 'Blue points', type: 'point' },
      // Multi-color
      { name: 'poly.point', description: 'Multi-color by kingdom', type: 'poly' },
    ];
  }

  /**
   * Validate tile coordinates
   *
   * Ensures tile coordinates are within valid ranges for the zoom level.
   *
   * @param z - Zoom level
   * @param x - Tile column
   * @param y - Tile row
   * @throws Error if coordinates are invalid
   */
  private validateTileCoordinates(z: number, x: number, y: number): void {
    if (z < 0 || z > 20) {
      throw new Error(`Invalid zoom level: ${z}. Must be between 0 and 20.`);
    }

    const maxTile = Math.pow(2, z);

    if (x < 0 || x >= maxTile) {
      throw new Error(`Invalid tile x coordinate: ${x}. Must be between 0 and ${maxTile - 1} for zoom ${z}.`);
    }

    if (y < 0 || y >= maxTile) {
      throw new Error(`Invalid tile y coordinate: ${y}. Must be between 0 and ${maxTile - 1} for zoom ${z}.`);
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, message: string): Error {
    if ((error as GBIFError).statusCode) {
      const gbifError = error as GBIFError;
      return new Error(`${message}: ${gbifError.message || gbifError.error} (HTTP ${gbifError.statusCode})`);
    }
    return new Error(`${message}: ${error.message || 'Unknown error'}`);
  }
}