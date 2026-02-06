import { describe, it, expect, beforeAll } from 'vitest';
import { OccurrenceService } from '../../../src/services/occurrence/occurrence.service.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';

describe('GBIF Occurrence API Integration', () => {
  let service: OccurrenceService;

  beforeAll(() => {
    service = new OccurrenceService(new GBIFClient());
  });

  describe('Occurrence Search', () => {
    it('should search occurrences by taxon', async () => {
      const results = await service.search({
        taxonKey: 5219404, // Panthera leo
        limit: 10
      });

      expect(results.count).toBeGreaterThan(0);
      expect(results.results).toBeDefined();
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].taxonKey).toBeDefined();
    }, 15000);

    it('should filter by country', async () => {
      const results = await service.search({
        taxonKey: 5219404,
        country: 'KE', // Kenya
        limit: 10
      });

      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results.every(r => r.country === 'KE')).toBe(true);
    }, 15000);

    it('should filter by coordinates', async () => {
      const results = await service.search({
        hasCoordinate: true,
        decimalLatitude: '-1.5,1.5',
        decimalLongitude: '35,37',
        limit: 10
      });

      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results.every(r =>
        r.decimalLatitude !== undefined &&
        r.decimalLongitude !== undefined
      )).toBe(true);
    }, 15000);

    it('should filter by year', async () => {
      const results = await service.search({
        taxonKey: 212, // Birds
        year: '2020',
        limit: 10
      });

      expect(results.count).toBeGreaterThan(0);
      expect(results.results.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Occurrence Count', () => {
    it('should count occurrences', async () => {
      const count = await service.count({
        taxonKey: 212 // Birds
      });

      expect(count).toBeGreaterThan(1000000); // Millions of bird records
    }, 15000);

    it('should count with filters', async () => {
      const count = await service.count({
        taxonKey: 212,
        country: 'US'
      });

      expect(count).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Occurrence Get', () => {
    it('should get specific occurrence', async () => {
      // First search for an occurrence
      const searchResults = await service.search({
        taxonKey: 5219404,
        limit: 1
      });

      expect(searchResults.results.length).toBeGreaterThan(0);
      const occurrenceKey = searchResults.results[0].key;

      // Then get it by key
      const occurrence = await service.getByKey(occurrenceKey);

      expect(occurrence.key).toBe(occurrenceKey);
      expect(occurrence.scientificName).toBeDefined();
    }, 15000);
  });
});
