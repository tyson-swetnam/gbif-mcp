import winston from 'winston';
import { config } from '../config/config.js';

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