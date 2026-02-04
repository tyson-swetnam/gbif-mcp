import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, '../../.env') });

// Configuration schema
const ConfigSchema = z.object({
  // GBIF API Configuration
  gbif: z.object({
    baseUrl: z.string().url().default('https://api.gbif.org/v1'),
    username: z.string().optional(),
    password: z.string().optional(),
    userAgent: z.string().default('GBIF-MCP-Server/1.0.0'),
    timeout: z.number().default(30000),
    retryAttempts: z.number().default(3),
    retryDelay: z.number().default(1000),
  }),

  // Rate Limiting Configuration
  rateLimit: z.object({
    maxRequestsPerMinute: z.number().default(100),
    maxConcurrentRequests: z.number().default(10),
    backoffMultiplier: z.number().default(2),
    maxBackoffTime: z.number().default(60000),
  }),

  // Cache Configuration
  cache: z.object({
    enabled: z.boolean().default(true),
    maxSize: z.number().default(100), // MB
    ttl: z.number().default(3600000), // 1 hour in ms
    checkPeriod: z.number().default(600000), // 10 minutes
  }),

  // Response Size Limiting Configuration
  responseLimits: z.object({
    maxSizeBytes: z.number().default(250 * 1024), // 250KB
    warnSizeBytes: z.number().default(200 * 1024), // 200KB warning
    enableTruncation: z.boolean().default(true),
    enableSizeLogging: z.boolean().default(true),
  }),

  // Logging Configuration
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'simple']).default('json'),
    maskSensitive: z.boolean().default(true),
  }),

  // Server Configuration
  server: z.object({
    name: z.string().default('gbif-mcp-server'),
    version: z.string().default('1.0.0'),
    description: z.string().default('MCP server for GBIF biodiversity data'),
  }),

  // Feature Flags
  features: z.object({
    enableAuthentication: z.boolean().default(false),
    enableCaching: z.boolean().default(true),
    enableMetrics: z.boolean().default(true),
    enableValidation: z.boolean().default(true),
  }),
});

// Parse and validate configuration
const parseConfig = () => {
  const rawConfig = {
    gbif: {
      baseUrl: process.env.GBIF_BASE_URL,
      username: process.env.GBIF_USERNAME,
      password: process.env.GBIF_PASSWORD,
      userAgent: process.env.GBIF_USER_AGENT,
      timeout: process.env.GBIF_TIMEOUT ? parseInt(process.env.GBIF_TIMEOUT, 10) : undefined,
      retryAttempts: process.env.GBIF_RETRY_ATTEMPTS ? parseInt(process.env.GBIF_RETRY_ATTEMPTS, 10) : undefined,
      retryDelay: process.env.GBIF_RETRY_DELAY ? parseInt(process.env.GBIF_RETRY_DELAY, 10) : undefined,
    },
    rateLimit: {
      maxRequestsPerMinute: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : undefined,
      maxConcurrentRequests: process.env.RATE_LIMIT_CONCURRENT ? parseInt(process.env.RATE_LIMIT_CONCURRENT, 10) : undefined,
      backoffMultiplier: process.env.RATE_LIMIT_BACKOFF_MULTIPLIER ? parseFloat(process.env.RATE_LIMIT_BACKOFF_MULTIPLIER) : undefined,
      maxBackoffTime: process.env.RATE_LIMIT_MAX_BACKOFF ? parseInt(process.env.RATE_LIMIT_MAX_BACKOFF, 10) : undefined,
    },
    cache: {
      enabled: process.env.CACHE_ENABLED === 'true',
      maxSize: process.env.CACHE_MAX_SIZE ? parseInt(process.env.CACHE_MAX_SIZE, 10) : undefined,
      ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL, 10) : undefined,
      checkPeriod: process.env.CACHE_CHECK_PERIOD ? parseInt(process.env.CACHE_CHECK_PERIOD, 10) : undefined,
    },
    responseLimits: {
      maxSizeBytes: process.env.RESPONSE_MAX_SIZE_KB
        ? parseInt(process.env.RESPONSE_MAX_SIZE_KB, 10) * 1024
        : undefined,
      warnSizeBytes: process.env.RESPONSE_WARN_SIZE_KB
        ? parseInt(process.env.RESPONSE_WARN_SIZE_KB, 10) * 1024
        : undefined,
      enableTruncation: process.env.RESPONSE_ENABLE_TRUNCATION !== 'false',
      enableSizeLogging: process.env.RESPONSE_ENABLE_SIZE_LOGGING !== 'false',
    },
    logging: {
      level: process.env.LOG_LEVEL,
      format: process.env.LOG_FORMAT,
      maskSensitive: process.env.LOG_MASK_SENSITIVE !== 'false',
    },
    server: {
      name: process.env.SERVER_NAME,
      version: process.env.SERVER_VERSION,
      description: process.env.SERVER_DESCRIPTION,
    },
    features: {
      enableAuthentication: process.env.ENABLE_AUTH === 'true',
      enableCaching: process.env.ENABLE_CACHE !== 'false',
      enableMetrics: process.env.ENABLE_METRICS !== 'false',
      enableValidation: process.env.ENABLE_VALIDATION !== 'false',
    },
  };

  // Filter out undefined values
  const cleanConfig = JSON.parse(JSON.stringify(rawConfig));

  return ConfigSchema.parse(cleanConfig);
};

// Export validated configuration
export const config = parseConfig();

// Type export for use in other modules
export type Config = z.infer<typeof ConfigSchema>;