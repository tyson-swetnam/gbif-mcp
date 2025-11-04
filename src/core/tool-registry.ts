import { BaseTool } from '../tools/base-tool.js';
import { logger } from '../utils/logger.js';

/**
 * Registry for managing MCP tools
 */
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  /**
   * Register a new tool
   */
  register(tool: BaseTool): void {
    const definition = tool.getDefinition();

    if (this.tools.has(definition.name)) {
      logger.warn(`Tool already registered, overwriting: ${definition.name}`);
    }

    this.tools.set(definition.name, tool);
    logger.debug(`Tool registered: ${definition.name}`);
  }

  /**
   * Get a tool by name
   */
  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Remove a tool
   */
  remove(name: string): boolean {
    const result = this.tools.delete(name);
    if (result) {
      logger.debug(`Tool removed: ${name}`);
    }
    return result;
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
    logger.debug('All tools cleared from registry');
  }

  /**
   * Get registry statistics
   */
  getStats(): { totalTools: number; toolNames: string[] } {
    return {
      totalTools: this.tools.size,
      toolNames: Array.from(this.tools.keys()),
    };
  }
}