import { describe, it, expect, beforeAll } from 'vitest';
import { ToolRegistry } from '../../../src/core/tool-registry.js';
import { GBIFClient } from '../../../src/core/gbif-client.js';
import { SpeciesService } from '../../../src/services/species/species.service.js';
import { OccurrenceService } from '../../../src/services/occurrence/occurrence.service.js';
import { SpeciesSearchTool } from '../../../src/tools/species/species-search.tool.js';
import { OccurrenceSearchTool } from '../../../src/tools/occurrence/occurrence-search.tool.js';

describe('MCP Protocol Integration', () => {
  let toolRegistry: ToolRegistry;
  let client: GBIFClient;

  beforeAll(() => {
    toolRegistry = new ToolRegistry();
    client = new GBIFClient();

    // Register a subset of tools for testing
    const speciesService = new SpeciesService(client);
    const occurrenceService = new OccurrenceService(client);

    toolRegistry.register(new SpeciesSearchTool(speciesService));
    toolRegistry.register(new OccurrenceSearchTool(occurrenceService));
  });

  describe('Tool Discovery', () => {
    it('should register tools in the registry', () => {
      const tools = toolRegistry.getAll();
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should find species search tool', () => {
      const tool = toolRegistry.get('gbif_species_search');
      expect(tool).toBeDefined();
      expect(tool?.getDefinition().name).toBe('gbif_species_search');
    });

    it('should find occurrence search tool', () => {
      const tool = toolRegistry.get('gbif_occurrence_search');
      expect(tool).toBeDefined();
      expect(tool?.getDefinition().name).toBe('gbif_occurrence_search');
    });

    it('should have correct tool definitions', () => {
      const tools = toolRegistry.getAll();

      for (const tool of tools) {
        const def = tool.getDefinition();
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(def.inputSchema).toBeDefined();
      }
    });
  });

  describe('Tool Schemas', () => {
    it('should provide valid JSON schemas for all tools', () => {
      const tools = toolRegistry.getAll();

      for (const tool of tools) {
        const schema = tool.getDefinition().inputSchema;
        expect(schema).toBeDefined();
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
      }
    });

    it('should have detailed parameter descriptions', () => {
      const occurrenceTool = toolRegistry.get('gbif_occurrence_search');
      expect(occurrenceTool).toBeDefined();

      const schema = occurrenceTool!.getDefinition().inputSchema;
      const props = schema.properties as any;

      // Check that key parameters have descriptions
      expect(props.taxonKey?.description).toBeDefined();
      expect(props.taxonKey?.description.length).toBeGreaterThan(50);
      expect(props.country?.description).toContain('ISO');
    });

    it('should have proper schema types', () => {
      const speciesTool = toolRegistry.get('gbif_species_search');
      expect(speciesTool).toBeDefined();

      const schema = speciesTool!.getDefinition().inputSchema;
      const props = schema.properties as any;

      expect(props.q?.type).toBe('string');
      expect(props.limit?.type).toBe('number');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid limit', async () => {
      const tool = toolRegistry.get('gbif_occurrence_search');
      expect(tool).toBeDefined();

      await expect(
        tool!.execute({ limit: -1 })
      ).rejects.toThrow(/Invalid/);
    });

    it('should accept valid parameters', () => {
      const tool = toolRegistry.get('gbif_species_search');
      expect(tool).toBeDefined();

      // Just verify the tool exists and has the right schema
      const schema = tool!.getDefinition().inputSchema;
      expect(schema.properties).toHaveProperty('q');
      expect(schema.properties).toHaveProperty('limit');
    });

    it('should have optional parameters', () => {
      const tool = toolRegistry.get('gbif_occurrence_search');
      expect(tool).toBeDefined();

      const schema = tool!.getDefinition().inputSchema;
      // Most parameters should be optional
      expect(schema.required).toBeUndefined();
    });
  });
});
