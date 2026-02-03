import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { MapsService } from '../../services/maps/maps.service.js';

/**
 * Tool for listing available map styles
 */
export class MapsListStylesTool extends BaseTool<Record<string, never>, Array<{ name: string; description: string; type: string }>> {
  protected readonly name = 'gbif_maps_list_styles';
  protected readonly description = 'List all available map visualization styles for occurrence tiles. Returns style names, descriptions, and types (density/point/poly). Use to discover visualization options before generating tile URLs with gbif_maps_get_tile_url.';

  protected readonly inputSchema = z.object({}).describe('No input parameters required. Returns complete list of available map styles.');

  private mapsService: MapsService;

  constructor(mapsService: MapsService) {
    super();
    this.mapsService = mapsService;
  }

  protected async run(_input: Record<string, never>): Promise<any> {
    const styles = this.mapsService.getAvailableStyles();

    return this.formatResponse(styles, {
      totalStyles: styles.length,
      types: [...new Set(styles.map(s => s.type))],
    });
  }
}
