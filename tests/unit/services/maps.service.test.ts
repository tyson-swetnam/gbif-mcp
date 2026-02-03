import { describe, it, expect, beforeEach } from 'vitest';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { MapsService } from '../../../src/services/maps/maps.service.js';

describe('MapsService', () => {
  let client: GBIFClient;
  let service: MapsService;

  beforeEach(() => {
    client = new GBIFClient();
    service = new MapsService(client);
  });

  describe('getTileUrl', () => {
    it('should generate basic tile URL', () => {
      const url = service.getTileUrl({
        z: 0,
        x: 0,
        y: 0,
        style: 'classic.poly',
      });

      expect(url).toContain('/map/occurrence/density/0/0/0');
      expect(url).toContain('.png');
      expect(url).toContain('style=classic.poly');
    });

    it('should include taxon key in URL', () => {
      const url = service.getTileUrl({
        z: 0,
        x: 0,
        y: 0,
        taxonKey: 5231190,
      });

      expect(url).toContain('taxonKey=5231190');
    });

    it('should include year range', () => {
      const url = service.getTileUrl({
        z: 0,
        x: 0,
        y: 0,
        year: '2020,2024',
      });

      expect(url).toContain('year=2020');
    });

    it('should support scale parameter', () => {
      const url = service.getTileUrl({
        z: 0,
        x: 0,
        y: 0,
        scale: 2,
      });

      expect(url).toContain('@2x.png');
    });
  });

  describe('getVectorTileUrl', () => {
    it('should generate vector tile URL', () => {
      const url = service.getVectorTileUrl(0, 0, 0, {
        style: 'classic.poly',
      });

      expect(url).toContain('.mvt');
      expect(url).toContain('style=classic.poly');
    });
  });

  describe('getRasterTileUrl', () => {
    it('should generate raster tile URL', () => {
      const url = service.getRasterTileUrl(0, 0, 0, {
        style: 'purpleHeat.point',
      });

      expect(url).toContain('.png');
      expect(url).toContain('style=purpleHeat.point');
    });
  });

  describe('getAvailableStyles', () => {
    it('should list all available map styles', () => {
      const styles = service.getAvailableStyles();

      expect(styles).toBeInstanceOf(Array);
      expect(styles.length).toBeGreaterThan(0);
      // Check that styles have the expected structure
      expect(styles[0]).toHaveProperty('name');
      expect(styles[0]).toHaveProperty('description');
      expect(styles[0]).toHaveProperty('type');
    });
  });

  describe('parameter validation', () => {
    it('should validate zoom level', () => {
      expect(() => {
        service.getTileUrl({ z: 25, x: 0, y: 0 });
      }).toThrow('Invalid zoom level');
    });

    it('should validate tile coordinates', () => {
      expect(() => {
        service.getTileUrl({ z: 0, x: 2, y: 0 });
      }).toThrow('Invalid tile x coordinate');
    });
  });
});
