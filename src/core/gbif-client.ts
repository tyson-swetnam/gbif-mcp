import axios, { AxiosInstance, AxiosError } from 'axios';
import { LRUCache } from 'lru-cache';
import PQueue from 'p-queue';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import type { GBIFError } from '../types/gbif.types.js';

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker for GBIF API requests
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly successThreshold = 2;
  private readonly timeout = 60000; // 1 minute

  /**
   * Check if request should be allowed
   */
  canRequest(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Check if timeout has elapsed
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        logger.info('Circuit breaker transitioning to HALF_OPEN');
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow request
    return true;
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        logger.info('Circuit breaker transitioning to CLOSED');
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      logger.warn('Circuit breaker transitioning to OPEN (failure during HALF_OPEN)');
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (this.failureCount >= this.failureThreshold) {
      logger.warn(`Circuit breaker transitioning to OPEN (${this.failureCount} failures)`);
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker reset');
  }
}

/**
 * GBIF API Client with rate limiting, caching, retry logic, and circuit breaker
 */
export class GBIFClient {
  private readonly client: AxiosInstance;
  private readonly cache: LRUCache<string, any>;
  private readonly requestQueue: PQueue;
  private readonly circuitBreaker: CircuitBreaker;
  private requestCount = 0;
  private requestWindow = Date.now();
  private backoffTime = 0;

  constructor() {
    // Initialize HTTP client
    this.client = axios.create({
      baseURL: config.gbif.baseUrl,
      timeout: config.gbif.timeout,
      headers: {
        'User-Agent': config.gbif.userAgent,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Initialize cache
    this.cache = new LRUCache<string, any>({
      max: config.cache.maxSize * 1024 * 1024, // Convert MB to bytes
      ttl: config.cache.ttl,
      updateAgeOnGet: true,
      sizeCalculation: (value) => {
        return JSON.stringify(value).length;
      },
    });

    // Initialize request queue for concurrency control
    this.requestQueue = new PQueue({
      concurrency: config.rateLimit.maxConcurrentRequests,
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker();

    // Add request interceptor for authentication
    this.client.interceptors.request.use((request) => {
      if (config.gbif.username && config.gbif.password) {
        request.auth = {
          username: config.gbif.username,
          password: config.gbif.password,
        };
      }
      return request;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Make a GET request to GBIF API
   */
  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    // Check circuit breaker
    if (!this.circuitBreaker.canRequest()) {
      const error = new Error('Circuit breaker is OPEN - service temporarily unavailable');
      logger.warn('Request rejected by circuit breaker', { path, state: this.circuitBreaker.getState() });
      throw error;
    }

    const cacheKey = this.getCacheKey('GET', path, params);

    // Check cache if enabled
    if (config.features.enableCaching && this.cache.has(cacheKey)) {
      logger.debug('Cache hit', { path, params });
      return this.cache.get(cacheKey) as T;
    }

    // Add to queue and wait for rate limiting
    return this.requestQueue.add(async () => {
      await this.enforceRateLimit();

      try {
        logger.debug('Making GBIF API request', { path, params });
        const response = await this.client.get<T>(path, { params });

        // Record success with circuit breaker
        this.circuitBreaker.recordSuccess();

        // Cache successful responses
        if (config.features.enableCaching && response.data) {
          this.cache.set(cacheKey, response.data);
        }

        return response.data;
      } catch (error) {
        // Record failure with circuit breaker
        this.circuitBreaker.recordFailure();
        logger.error('GBIF API request failed', { path, params, error });
        throw error;
      }
    }) as Promise<T>;
  }

  /**
   * Make a POST request to GBIF API
   */
  async post<T>(path: string, data?: any, params?: Record<string, any>): Promise<T> {
    return this.requestQueue.add(async () => {
      await this.enforceRateLimit();

      try {
        logger.debug('Making GBIF API POST request', { path, data, params });
        const response = await this.client.post<T>(path, data, { params });
        return response.data;
      } catch (error) {
        logger.error('GBIF API POST request failed', { path, data, params, error });
        throw error;
      }
    }) as Promise<T>;
  }

  /**
   * Make a DELETE request to GBIF API
   */
  async delete(path: string, params?: Record<string, any>): Promise<void> {
    return this.requestQueue.add(async () => {
      await this.enforceRateLimit();

      try {
        logger.debug('Making GBIF API DELETE request', { path, params });
        await this.client.delete(path, { params });
      } catch (error) {
        logger.error('GBIF API DELETE request failed', { path, params, error });
        throw error;
      }
    }) as Promise<void>;
  }

  /**
   * Handle paginated requests
   */
  async *paginate<T>(
    path: string,
    params: Record<string, any> = {},
    pageSize = 20
  ): AsyncGenerator<T[], void, unknown> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.get<any>(path, {
        ...params,
        offset,
        limit: pageSize,
      });

      if (response.results && response.results.length > 0) {
        yield response.results as T[];
        offset += pageSize;
        hasMore = !response.endOfRecords;
      } else {
        hasMore = false;
      }
    }
  }

  /**
   * Download file from GBIF
   */
  async download(url: string): Promise<Buffer> {
    return this.requestQueue.add(async () => {
      await this.enforceRateLimit();

      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: config.gbif.timeout * 2, // Double timeout for downloads
        });
        return Buffer.from(response.data);
      } catch (error) {
        logger.error('GBIF download failed', { url, error });
        throw error;
      }
    }) as Promise<Buffer>;
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    // Check if we're in backoff period
    if (this.backoffTime > Date.now()) {
      const waitTime = this.backoffTime - Date.now();
      logger.debug(`Rate limit backoff: waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    // Reset window if needed
    const now = Date.now();
    if (now - this.requestWindow > 60000) {
      this.requestWindow = now;
      this.requestCount = 0;
    }

    // Check rate limit
    if (this.requestCount >= config.rateLimit.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.requestWindow);
      logger.debug(`Rate limit reached: waiting ${waitTime}ms`);
      await this.delay(waitTime);
      this.requestWindow = Date.now();
      this.requestCount = 0;
    }

    this.requestCount++;
  }

  /**
   * Handle API errors with retry logic
   */
  private async handleError(error: AxiosError): Promise<any> {
    const status = error.response?.status;
    const retryAfter = error.response?.headers['retry-after'];

    // Handle rate limiting (429)
    if (status === 429) {
      const backoffTime = retryAfter
        ? parseInt(retryAfter as string, 10) * 1000
        : Math.min(this.backoffTime * config.rateLimit.backoffMultiplier, config.rateLimit.maxBackoffTime);

      this.backoffTime = Date.now() + backoffTime;
      logger.warn(`Rate limited by GBIF API, backing off for ${backoffTime}ms`);

      // Retry the request after backoff
      await this.delay(backoffTime);
      return this.client.request(error.config!);
    }

    // Handle server errors with retry (5xx)
    if (status && status >= 500 && status < 600) {
      const attempt = (error.config as any)?._retryCount || 0;

      if (attempt < config.gbif.retryAttempts) {
        const delay = config.gbif.retryDelay * Math.pow(2, attempt);
        logger.warn(`Server error ${status}, retrying in ${delay}ms (attempt ${attempt + 1})`);

        await this.delay(delay);
        (error.config as any)._retryCount = attempt + 1;
        return this.client.request(error.config!);
      }
    }

    // Transform error for better handling
    const responseData = error.response?.data as any;
    const gbifError: GBIFError = {
      error: error.code || 'UNKNOWN_ERROR',
      message: responseData?.message || error.message,
      statusCode: status,
    };

    throw gbifError;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(method: string, path: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `${method}:${path}:${paramStr}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; itemCount: number; hits: number; misses: number } {
    return {
      size: this.cache.calculatedSize || 0,
      itemCount: this.cache.size,
      hits: 0, // Would need to track this separately
      misses: 0, // Would need to track this separately
    };
  }

  /**
   * Get circuit breaker state
   */
  getCircuitState(): string {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}