#!/usr/bin/env node

/**
 * GBIF MCP Server - Main Entry Point
 *
 * Production-ready MCP server that provides programmatic access to GBIF API
 * with comprehensive error handling, correlation tracking, and monitoring.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { GBIFClient } from './core/gbif-client.js';
import { ToolRegistry } from './core/tool-registry.js';
import { RequestHandler } from './protocol/request-handler.js';
import { MCPError, MCPErrorCode, MCPErrorFormatter } from './protocol/mcp-errors.js';

// Import services
import { SpeciesService } from './services/species/species.service.js';

// Import tools
import {
  SpeciesSearchTool,
  SpeciesGetTool,
  SpeciesSuggestTool,
  SpeciesMatchTool,
} from './tools/species/species-search.tool.js';

/**
 * Server statistics for monitoring
 */
interface ServerStats {
  startTime: Date;
  requestCount: number;
  successCount: number;
  errorCount: number;
  toolExecutions: Map<string, number>;
}

/**
 * Main GBIF MCP Server
 */
class GBIFMCPServer {
  private server: Server;
  private client: GBIFClient;
  private toolRegistry: ToolRegistry;
  private transport?: StdioServerTransport;
  private stats: ServerStats;
  private isShuttingDown = false;

  constructor() {
    // Initialize statistics
    this.stats = {
      startTime: new Date(),
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      toolExecutions: new Map(),
    };

    // Create MCP server
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {},
          // Resources and prompts can be added here in future phases
        },
      }
    );

    // Initialize GBIF client
    this.client = new GBIFClient();

    // Initialize tool registry
    this.toolRegistry = new ToolRegistry();

    // Setup server components
    this.initializeServices();
    this.setupHandlers();
    this.setupErrorHandlers();

    logger.info('GBIF MCP Server initialized', {
      version: config.server.version,
      tools: this.toolRegistry.getAll().length,
    });
  }

  /**
   * Initialize all services and register tools
   */
  private initializeServices(): void {
    try {
      // Create service instances
      const speciesService = new SpeciesService(this.client);

      // Register species tools
      this.toolRegistry.register(new SpeciesSearchTool(speciesService));
      this.toolRegistry.register(new SpeciesGetTool(speciesService));
      this.toolRegistry.register(new SpeciesSuggestTool(speciesService));
      this.toolRegistry.register(new SpeciesMatchTool(speciesService));

      // TODO: Register other service tools as they are implemented
      // const occurrenceService = new OccurrenceService(this.client);
      // this.toolRegistry.register(new OccurrenceSearchTool(occurrenceService));

      const tools = this.toolRegistry.getAll();
      logger.info('Services initialized successfully', {
        toolCount: tools.length,
        tools: tools.map(t => t.getDefinition().name),
      });
    } catch (error) {
      logger.error('Failed to initialize services', { error });
      throw new MCPError(
        MCPErrorCode.INTERNAL_ERROR,
        'Failed to initialize services',
        { error }
      );
    }
  }

  /**
   * Setup MCP protocol request handlers
   */
  private setupHandlers(): void {
    // Handle list tools request
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => {
        return RequestHandler.withContext('ListTools', async (context) => {
          this.stats.requestCount++;

          try {
            const tools = this.toolRegistry
              .getAll()
              .map(tool => tool.getDefinition());

            logger.debug('Tools listed', {
              correlationId: context.correlationId,
              count: tools.length,
            });

            this.stats.successCount++;

            return { tools };
          } catch (error) {
            this.stats.errorCount++;
            logger.error('List tools failed', {
              correlationId: context.correlationId,
              error,
            });
            throw error;
          }
        });
      }
    );

    // Handle call tool request
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params;

        return RequestHandler.withContext(
          'CallTool',
          async (context) => {
            this.stats.requestCount++;

            // Update tool execution count
            const currentCount = this.stats.toolExecutions.get(name) || 0;
            this.stats.toolExecutions.set(name, currentCount + 1);

            logger.info('Tool invocation started', {
              correlationId: context.correlationId,
              tool: name,
              hasArgs: !!args,
            });

            try {
              // Check if tool exists
              const tool = this.toolRegistry.get(name);
              if (!tool) {
                throw new MCPError(
                  MCPErrorCode.TOOL_NOT_FOUND,
                  `Tool not found: ${name}`,
                  { availableTools: this.toolRegistry.getAll().map(t => t.getDefinition().name) }
                );
              }

              // Check circuit breaker state
              const circuitState = this.client.getCircuitState();
              if (circuitState === 'OPEN') {
                throw new MCPError(
                  MCPErrorCode.CIRCUIT_BREAKER_OPEN,
                  'Service temporarily unavailable due to high error rate',
                  { circuitState }
                );
              }

              // Execute tool
              const result = await tool.execute(args || {});

              this.stats.successCount++;

              logger.info('Tool execution successful', {
                correlationId: context.correlationId,
                tool: name,
                duration: Date.now() - context.startTime,
              });

              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                  },
                ],
              };
            } catch (error) {
              this.stats.errorCount++;

              logger.error('Tool execution failed', {
                correlationId: context.correlationId,
                tool: name,
                duration: Date.now() - context.startTime,
                error,
              });

              // Format error response
              return MCPErrorFormatter.formatToolError(error as Error, name);
            }
          },
          { toolName: name }
        );
      }
    );

    logger.info('Protocol handlers configured');
  }

  /**
   * Setup error handlers for the server
   */
  private setupErrorHandlers(): void {
    // Handle server errors
    this.server.onerror = (error) => {
      logger.error('MCP Server error', { error });
      this.stats.errorCount++;
    };

    // Handle unhandled protocol errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error,
        stack: error.stack,
      });
      if (!this.isShuttingDown) {
        this.shutdown();
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason,
        promise,
      });
    });

    logger.info('Error handlers configured');
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Server is shutting down');
    }

    try {
      // Create stdio transport
      this.transport = new StdioServerTransport();

      logger.info('Starting GBIF MCP Server', {
        version: config.server.version,
        tools: this.toolRegistry.getAll().length,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          cacheEnabled: config.features.enableCaching,
          rateLimitEnabled: true,
        },
      });

      // Connect server to transport
      await this.server.connect(this.transport);

      logger.info('GBIF MCP Server started successfully', {
        serverName: config.server.name,
        version: config.server.version,
        transport: 'stdio',
        capabilities: {
          tools: this.toolRegistry.getAll().length,
        },
      });

      // Log server statistics periodically (every 5 minutes)
      if (config.features.enableMetrics) {
        setInterval(() => this.logStatistics(), 5 * 60 * 1000);
      }
    } catch (error) {
      logger.error('Failed to start GBIF MCP Server', { error });
      throw error;
    }
  }

  /**
   * Log server statistics
   */
  private logStatistics(): void {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const uptimeMinutes = Math.floor(uptime / 60000);

    logger.info('Server statistics', {
      uptime: `${uptimeMinutes} minutes`,
      requests: {
        total: this.stats.requestCount,
        successful: this.stats.successCount,
        failed: this.stats.errorCount,
        successRate: this.stats.requestCount > 0
          ? ((this.stats.successCount / this.stats.requestCount) * 100).toFixed(2) + '%'
          : '0%',
      },
      topTools: Array.from(this.stats.toolExecutions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      circuitBreaker: {
        state: this.client.getCircuitState(),
      },
      cache: this.client.getCacheStats(),
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;

    logger.info('Initiating graceful shutdown', {
      finalStats: {
        totalRequests: this.stats.requestCount,
        successCount: this.stats.successCount,
        errorCount: this.stats.errorCount,
        uptime: Date.now() - this.stats.startTime.getTime(),
      },
    });

    try {
      // Log final statistics
      this.logStatistics();

      // Close server connection
      await this.server.close();

      logger.info('GBIF MCP Server shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown', { error });
    } finally {
      // Give logger time to flush
      await new Promise(resolve => setTimeout(resolve, 100));
      process.exit(0);
    }
  }

  /**
   * Get server health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    stats: ServerStats;
    circuitBreaker: string;
  } {
    const circuitState = this.client.getCircuitState();
    const successRate = this.stats.requestCount > 0
      ? this.stats.successCount / this.stats.requestCount
      : 1;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (circuitState === 'OPEN' || successRate < 0.5) {
      status = 'unhealthy';
    } else if (circuitState === 'HALF_OPEN' || successRate < 0.9) {
      status = 'degraded';
    }

    return {
      status,
      uptime: Date.now() - this.stats.startTime.getTime(),
      stats: this.stats,
      circuitBreaker: circuitState,
    };
  }
}

/**
 * Main execution function
 */
async function main() {
  // Create server instance
  const server = new GBIFMCPServer();

  // Setup signal handlers for graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  signals.forEach(signal => {
    process.on(signal, () => {
      logger.info(`Received ${signal}, initiating shutdown`);
      server.shutdown();
    });
  });

  // Start the server
  try {
    await server.start();

    // Health check logging (if metrics enabled)
    if (config.features.enableMetrics) {
      setInterval(() => {
        const health = server.getHealth();
        if (health.status !== 'healthy') {
          logger.warn('Server health degraded', { health });
        }
      }, 60000); // Check every minute
    }
  } catch (error) {
    logger.error('Fatal error during server startup', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error in main', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  });
}

// Export for testing
export { GBIFMCPServer };
