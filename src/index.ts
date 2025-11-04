#!/usr/bin/env node

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

// Import services
import { SpeciesService } from './services/species/species.service.js';
import { OccurrenceService } from './services/occurrence/occurrence.service.js';
import { RegistryService } from './services/registry/registry.service.js';
import { MapsService } from './services/maps/maps.service.js';
import { LiteratureService } from './services/literature/literature.service.js';
import { VocabulariesService } from './services/vocabularies/vocabularies.service.js';
import { ValidatorService } from './services/validator/validator.service.js';

// Import tools
import {
  SpeciesSearchTool,
  SpeciesGetTool,
  SpeciesSuggestTool,
  SpeciesMatchTool,
} from './tools/species/species-search.tool.js';

/**
 * Main GBIF MCP Server
 */
class GBIFMCPServer {
  private server: Server;
  private client: GBIFClient;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new GBIFClient();
    this.toolRegistry = new ToolRegistry();
    this.initializeServices();
    this.registerTools();
    this.setupHandlers();
  }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    // Create service instances
    const speciesService = new SpeciesService(this.client);
    const occurrenceService = new OccurrenceService(this.client);
    const registryService = new RegistryService(this.client);
    const mapsService = new MapsService(this.client);
    const literatureService = new LiteratureService(this.client);
    const vocabulariesService = new VocabulariesService(this.client);
    const validatorService = new ValidatorService(this.client);

    // Register species tools
    this.toolRegistry.register(new SpeciesSearchTool(speciesService));
    this.toolRegistry.register(new SpeciesGetTool(speciesService));
    this.toolRegistry.register(new SpeciesSuggestTool(speciesService));
    this.toolRegistry.register(new SpeciesMatchTool(speciesService));

    // TODO: Register other service tools
    // this.toolRegistry.register(new OccurrenceSearchTool(occurrenceService));
    // this.toolRegistry.register(new DatasetSearchTool(registryService));
    // etc...

    logger.info('Services initialized', {
      servicesCount: 7,
      toolsCount: this.toolRegistry.getAll().length,
    });
  }

  /**
   * Register all tools with the MCP server
   */
  private registerTools(): void {
    const tools = this.toolRegistry.getAll();

    for (const tool of tools) {
      logger.debug(`Registering tool: ${tool.getDefinition().name}`);
    }

    logger.info(`Registered ${tools.length} tools`);
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.toolRegistry.getAll().map(tool => tool.getDefinition());

      logger.debug('Listing tools', { count: tools.length });

      return {
        tools,
      };
    });

    // Handle call tool request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info('Tool invocation', { tool: name, args });

      try {
        const tool = this.toolRegistry.get(name);
        if (!tool) {
          throw new Error(`Tool not found: ${name}`);
        }

        const result = await tool.execute(args);

        logger.info('Tool execution successful', { tool: name });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Tool execution failed', { tool: name, error });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: true,
                  message: (error as Error).message,
                  tool: name,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });

    // Handle errors
    this.server.onerror = (error) => {
      logger.error('Server error', { error });
    };

    logger.info('Request handlers configured');
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();

    logger.info('Starting GBIF MCP Server', {
      version: config.server.version,
      tools: this.toolRegistry.getAll().length,
    });

    await this.server.connect(transport);

    logger.info('GBIF MCP Server started successfully');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down GBIF MCP Server');

    try {
      await this.server.close();
      logger.info('Server shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown', { error });
    }

    process.exit(0);
  }
}

// Main execution
async function main() {
  const server = new GBIFMCPServer();

  // Handle shutdown signals
  process.on('SIGINT', () => server.shutdown());
  process.on('SIGTERM', () => server.shutdown());
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error });
    server.shutdown();
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
    server.shutdown();
  });

  try {
    await server.start();
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  logger.error('Fatal error', { error });
  process.exit(1);
});