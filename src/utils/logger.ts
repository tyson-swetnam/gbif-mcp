import winston from 'winston';
import { config } from '../config/config.js';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage for correlation IDs
const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Create format based on configuration
const createFormat = () => {
  const formats = [
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    // Add correlation ID to logs
    winston.format((info) => {
      const store = asyncLocalStorage.getStore();
      if (store && store.has('correlationId')) {
        info.correlationId = store.get('correlationId');
      }
      if (store && store.has('requestId')) {
        info.requestId = store.get('requestId');
      }
      return info;
    })(),
  ];

  if (config.logging.maskSensitive) {
    formats.push(
      winston.format.printf((info) => {
        // Mask sensitive information
        const masked = JSON.parse(JSON.stringify(info));
        const sensitiveFields = ['password', 'auth', 'authorization', 'token', 'key', 'secret'];

        const maskObject = (obj: any): any => {
          if (typeof obj !== 'object' || obj === null) return obj;

          for (const key in obj) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
              obj[key] = '[MASKED]';
            } else if (typeof obj[key] === 'object') {
              obj[key] = maskObject(obj[key]);
            }
          }
          return obj;
        };

        return JSON.stringify(maskObject(masked));
      })
    );
  }

  if (config.logging.format === 'json') {
    formats.push(winston.format.json());
  } else {
    formats.push(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    );
  }

  return winston.format.combine(...formats);
};

// Create the logger
export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: createFormat(),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  exitOnError: false,
});

// Create a child logger for specific contexts
export const createLogger = (context: string) => {
  return logger.child({ context });
};

/**
 * Set correlation ID for the current async context
 */
export const setCorrelationId = (correlationId: string): void => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set('correlationId', correlationId);
  }
};

/**
 * Set request ID for the current async context
 */
export const setRequestId = (requestId: string): void => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set('requestId', requestId);
  }
};

/**
 * Get current correlation ID
 */
export const getCorrelationId = (): string | undefined => {
  const store = asyncLocalStorage.getStore();
  return store?.get('correlationId');
};

/**
 * Run a function with a correlation context
 */
export const withCorrelation = <T>(correlationId: string, fn: () => T): T => {
  const store = new Map<string, any>();
  store.set('correlationId', correlationId);
  return asyncLocalStorage.run(store, fn);
};

/**
 * Generate a new correlation ID
 */
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};