import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { ValidatorService } from '../../../src/services/validator/validator.service.js';

describe('ValidatorService', () => {
  let client: GBIFClient;
  let service: ValidatorService;

  beforeEach(() => {
    client = new GBIFClient();
    service = new ValidatorService(client);
  });

  describe('validateDwcArchive', () => {
    it('should validate DwC-A from URL', async () => {
      const mockResult = {
        valid: true,
        issues: [],
        url: 'https://example.com/archive.zip',
      };

      server.use(
        http.post('http://localhost:3000/validator/jobserver/submit', () => {
          return HttpResponse.json(mockResult);
        })
      );

      const result = await service.validateDwcArchive('https://example.com/archive.zip');
      expect(result.valid).toBe(true);
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post('http://localhost:3000/validator/jobserver/submit', () => {
          return HttpResponse.json({ error: 'Invalid URL' }, { status: 400 });
        })
      );

      await expect(service.validateDwcArchive('invalid-url')).rejects.toThrow();
    });
  });

  describe('getValidationStatus', () => {
    it('should get validation job status', async () => {
      const mockStatus = {
        jobId: 'job-123',
        status: 'FINISHED',
        result: {
          valid: true,
          issues: [],
        },
      };

      server.use(
        http.get('http://localhost:3000/validator/jobserver/job/job-123', () => {
          return HttpResponse.json(mockStatus);
        })
      );

      const result = await service.getValidationStatus('job-123');
      expect(result.status).toBe('FINISHED');
    });
  });
});
