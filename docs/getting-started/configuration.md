# Configuration

Configure the GBIF MCP Server for your environment and use case.

## Environment Variables

### GBIF API Settings

```bash
# GBIF API endpoint (default: https://api.gbif.org/v1)
GBIF_BASE_URL=https://api.gbif.org/v1

# API timeout in milliseconds (default: 30000)
GBIF_TIMEOUT=30000

# User agent string
GBIF_USER_AGENT=GBIF-MCP-Server/1.0
```

### Authentication

Required for occurrence downloads:

```bash
# Your GBIF.org username
GBIF_USERNAME=your_username

# Your GBIF.org password
GBIF_PASSWORD=your_password
```

Get credentials at: [https://www.gbif.org/user/profile](https://www.gbif.org/user/profile)

### Rate Limiting

```bash
# Maximum requests per minute (default: 100)
RATE_LIMIT_MAX_REQUESTS=100

# Maximum concurrent requests (default: 5)
RATE_LIMIT_MAX_CONCURRENT=5

# Retry attempts for failed requests (default: 3)
GBIF_RETRY_ATTEMPTS=3

# Initial retry delay in ms (default: 1000)
GBIF_RETRY_DELAY=1000

# Backoff multiplier for retries (default: 2)
RATE_LIMIT_BACKOFF_MULTIPLIER=2

# Maximum backoff time in ms (default: 60000)
RATE_LIMIT_MAX_BACKOFF=60000
```

### Caching

```bash
# Enable response caching (default: true)
CACHE_ENABLED=true

# Cache size in MB (default: 100)
CACHE_MAX_SIZE=100

# Cache TTL in milliseconds (default: 300000 = 5 minutes)
CACHE_TTL=300000
```

### Logging

```bash
# Log level: error, warn, info, debug (default: info)
LOG_LEVEL=info

# Log format: json or text (default: json)
LOG_FORMAT=json
```

## Configuration File

Create a `.env` file in the project root:

```bash
# .env
GBIF_USERNAME=myusername
GBIF_PASSWORD=mypassword
CACHE_ENABLED=true
CACHE_MAX_SIZE=200
LOG_LEVEL=debug
```

## Docker Configuration

Pass environment variables to Docker:

```bash
docker run -i \
  -e GBIF_USERNAME=myusername \
  -e GBIF_PASSWORD=mypassword \
  -e CACHE_MAX_SIZE=200 \
  -e LOG_LEVEL=info \
  gbif-mcp:latest
```

Or use a `.env` file:

```bash
docker run -i --env-file .env gbif-mcp:latest
```

## Performance Tuning

### For High-Volume Usage

```bash
# Increase cache
CACHE_MAX_SIZE=500
CACHE_TTL=600000  # 10 minutes

# Higher rate limits
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_MAX_CONCURRENT=10

# Longer timeout for slow networks
GBIF_TIMEOUT=60000
```

### For Low-Memory Environments

```bash
# Reduce cache
CACHE_MAX_SIZE=20
CACHE_ENABLED=false

# Lower concurrency
RATE_LIMIT_MAX_CONCURRENT=2
```

### For Development

```bash
# Verbose logging
LOG_LEVEL=debug

# Disable cache for testing
CACHE_ENABLED=false

# Lower rate limits
RATE_LIMIT_MAX_REQUESTS=10
```

## Production Recommendations

```bash
# Balanced production config
CACHE_ENABLED=true
CACHE_MAX_SIZE=100
CACHE_TTL=300000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MAX_CONCURRENT=5
LOG_LEVEL=info
GBIF_RETRY_ATTEMPTS=3
```

## Monitoring

The server logs detailed statistics at shutdown:

```json
{
  "uptime": "2h 34m 12s",
  "totalRequests": 15234,
  "successfulRequests": 15102,
  "failedRequests": 132,
  "cacheStats": {
    "size": 89234567,
    "itemCount": 1234
  }
}
```

## Security

### Credential Management

!!! warning "Never commit credentials"
    Add `.env` to `.gitignore` to prevent credential leaks

!!! tip "Use environment-specific configs"
    ```bash
    # Development
    .env.development

    # Production
    .env.production
    ```

### API Keys

GBIF uses username/password (not API keys). Credentials are only needed for:
- Occurrence downloads
- Dataset publishing (not yet implemented)

All read operations work without authentication.

## Defaults Reference

| Setting | Default | Range |
|---------|---------|-------|
| Rate limit | 100/min | 1-1000 |
| Concurrent requests | 5 | 1-50 |
| Cache size | 100 MB | 10-1000 MB |
| Cache TTL | 5 min | 1 sec - 1 hour |
| Timeout | 30 sec | 5-120 sec |
| Retry attempts | 3 | 0-10 |
| Log level | info | error/warn/info/debug |

## Next Steps

- [Start using the server](quick-start.md)
- [Explore tools](../user-guide/overview.md)
- [See examples](../examples/basic-queries.md)
