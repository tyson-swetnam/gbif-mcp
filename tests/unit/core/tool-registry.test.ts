import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../../../src/core/tool-registry.js';
import { BaseTool } from '../../../src/tools/base-tool.js';
import { z } from 'zod';

// Mock tool for testing
class MockTool extends BaseTool<{ input: string }, { output: string }> {
  protected name = 'mock_tool';
  protected description = 'A mock tool for testing';
  protected inputSchema = z.object({
    input: z.string().describe('Test input parameter'),
  });

  protected async run(input: { input: string }): Promise<{ output: string }> {
    return { output: `Processed: ${input.input}` };
  }
}

class AnotherMockTool extends BaseTool<{ value: number }, { result: number }> {
  protected name = 'another_tool';
  protected description = 'Another mock tool';
  protected inputSchema = z.object({
    value: z.number().describe('Numeric value'),
  });

  protected async run(input: { value: number }): Promise<{ result: number }> {
    return { result: input.value * 2 };
  }
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockTool: MockTool;
  let anotherTool: AnotherMockTool;

  beforeEach(() => {
    registry = new ToolRegistry();
    mockTool = new MockTool();
    anotherTool = new AnotherMockTool();
  });

  describe('register', () => {
    it('should register a tool', () => {
      registry.register(mockTool);
      expect(registry.has('mock_tool')).toBe(true);
    });

    it('should register multiple tools', () => {
      registry.register(mockTool);
      registry.register(anotherTool);

      expect(registry.has('mock_tool')).toBe(true);
      expect(registry.has('another_tool')).toBe(true);
    });

    it('should overwrite existing tool with warning', () => {
      registry.register(mockTool);
      const firstTool = registry.get('mock_tool');

      // Register again with same name
      const duplicateTool = new MockTool();
      registry.register(duplicateTool);

      const secondTool = registry.get('mock_tool');
      expect(secondTool).not.toBe(firstTool);
    });
  });

  describe('get', () => {
    it('should retrieve registered tool by name', () => {
      registry.register(mockTool);
      const tool = registry.get('mock_tool');

      expect(tool).toBe(mockTool);
    });

    it('should return undefined for non-existent tool', () => {
      const tool = registry.get('nonexistent_tool');
      expect(tool).toBeUndefined();
    });

    it('should retrieve correct tool when multiple are registered', () => {
      registry.register(mockTool);
      registry.register(anotherTool);

      const tool1 = registry.get('mock_tool');
      const tool2 = registry.get('another_tool');

      expect(tool1).toBe(mockTool);
      expect(tool2).toBe(anotherTool);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no tools registered', () => {
      const tools = registry.getAll();
      expect(tools).toEqual([]);
    });

    it('should return all registered tools', () => {
      registry.register(mockTool);
      registry.register(anotherTool);

      const tools = registry.getAll();
      expect(tools).toHaveLength(2);
      expect(tools).toContain(mockTool);
      expect(tools).toContain(anotherTool);
    });

    it('should return array copy not affecting registry', () => {
      registry.register(mockTool);
      const tools = registry.getAll();

      // Modifying returned array shouldn't affect registry
      tools.pop();
      expect(registry.has('mock_tool')).toBe(true);
    });
  });

  describe('has', () => {
    it('should return true for registered tool', () => {
      registry.register(mockTool);
      expect(registry.has('mock_tool')).toBe(true);
    });

    it('should return false for non-existent tool', () => {
      expect(registry.has('nonexistent_tool')).toBe(false);
    });

    it('should return false after tool is removed', () => {
      registry.register(mockTool);
      registry.remove('mock_tool');
      expect(registry.has('mock_tool')).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove registered tool', () => {
      registry.register(mockTool);
      const result = registry.remove('mock_tool');

      expect(result).toBe(true);
      expect(registry.has('mock_tool')).toBe(false);
    });

    it('should return false when removing non-existent tool', () => {
      const result = registry.remove('nonexistent_tool');
      expect(result).toBe(false);
    });

    it('should only remove specified tool', () => {
      registry.register(mockTool);
      registry.register(anotherTool);

      registry.remove('mock_tool');

      expect(registry.has('mock_tool')).toBe(false);
      expect(registry.has('another_tool')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all tools', () => {
      registry.register(mockTool);
      registry.register(anotherTool);

      registry.clear();

      expect(registry.has('mock_tool')).toBe(false);
      expect(registry.has('another_tool')).toBe(false);
      expect(registry.getAll()).toHaveLength(0);
    });

    it('should work on empty registry', () => {
      registry.clear();
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics for empty registry', () => {
      const stats = registry.getStats();

      expect(stats.totalTools).toBe(0);
      expect(stats.toolNames).toEqual([]);
    });

    it('should return correct statistics with registered tools', () => {
      registry.register(mockTool);
      registry.register(anotherTool);

      const stats = registry.getStats();

      expect(stats.totalTools).toBe(2);
      expect(stats.toolNames).toContain('mock_tool');
      expect(stats.toolNames).toContain('another_tool');
      expect(stats.toolNames).toHaveLength(2);
    });

    it('should update statistics after adding tools', () => {
      let stats = registry.getStats();
      expect(stats.totalTools).toBe(0);

      registry.register(mockTool);
      stats = registry.getStats();
      expect(stats.totalTools).toBe(1);

      registry.register(anotherTool);
      stats = registry.getStats();
      expect(stats.totalTools).toBe(2);
    });

    it('should update statistics after removing tools', () => {
      registry.register(mockTool);
      registry.register(anotherTool);

      let stats = registry.getStats();
      expect(stats.totalTools).toBe(2);

      registry.remove('mock_tool');
      stats = registry.getStats();
      expect(stats.totalTools).toBe(1);
      expect(stats.toolNames).not.toContain('mock_tool');
    });

    it('should update statistics after clearing', () => {
      registry.register(mockTool);
      registry.register(anotherTool);

      registry.clear();
      const stats = registry.getStats();

      expect(stats.totalTools).toBe(0);
      expect(stats.toolNames).toEqual([]);
    });
  });

  describe('Tool Definition Integration', () => {
    it('should access tool definition through registry', () => {
      registry.register(mockTool);
      const tool = registry.get('mock_tool');

      expect(tool).toBeDefined();
      const definition = tool!.getDefinition();

      expect(definition.name).toBe('mock_tool');
      expect(definition.description).toBe('A mock tool for testing');
      expect(definition.inputSchema).toHaveProperty('type', 'object');
    });

    it('should execute tool retrieved from registry', async () => {
      registry.register(mockTool);
      const tool = registry.get('mock_tool');

      expect(tool).toBeDefined();
      const result = await tool!.execute({ input: 'test' });

      expect(result).toEqual({ output: 'Processed: test' });
    });
  });
});
