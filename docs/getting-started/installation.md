# Installation

Get the GBIF MCP Server up and running in minutes with your preferred installation method.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- (Optional) Docker for containerized deployment

## Installation Methods

### Option 1: NPM (Recommended)

Install globally for system-wide access:

```bash
npm install -g gbif-mcp
```

Or install locally in your project:

```bash
npm install gbif-mcp
```

**Verify installation:**

```bash
gbif-mcp --version
```

### Option 2: Docker

Pull the official Docker image:

```bash
docker pull gbif-mcp:latest
```

Run the server:

```bash
docker run -i gbif-mcp:latest
```

With custom configuration:

```bash
docker run -i \
  -e GBIF_USERNAME=your_username \
  -e GBIF_PASSWORD=your_password \
  -e LOG_LEVEL=info \
  gbif-mcp:latest
```

### Option 3: From Source

Clone the repository:

```bash
git clone https://github.com/yourusername/gbif-mcp.git
cd gbif-mcp
```

Install dependencies:

```bash
npm install
```

Build the project:

```bash
npm run build
```

Start the server:

```bash
npm start
```

## Verify Installation

Test that the server is working:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | gbif-mcp
```

You should see JSON output listing all 57 available tools.

## Configuration

Create a `.env` file for custom configuration:

```bash
# Optional GBIF credentials (required for downloads)
GBIF_USERNAME=your_username
GBIF_PASSWORD=your_password

# API settings
GBIF_BASE_URL=https://api.gbif.org/v1
RATE_LIMIT_MAX_REQUESTS=100

# Cache settings
CACHE_ENABLED=true
CACHE_MAX_SIZE=100
CACHE_TTL=300000

# Logging
LOG_LEVEL=info
```

See [Configuration Guide](configuration.md) for all options.

## Troubleshooting

### Command not found

If `gbif-mcp` command is not found after global install:

```bash
# Check npm global bin path
npm bin -g

# Add to PATH if needed
export PATH="$(npm bin -g):$PATH"
```

### Port already in use

MCP uses stdio, not network ports. If you see port errors, check for other running processes.

### Permission errors

On macOS/Linux, you may need to use `sudo` for global installation:

```bash
sudo npm install -g gbif-mcp
```

## Next Steps

- [Quick Start Guide](quick-start.md) - Your first query
- [Configuration](configuration.md) - Customize settings
- [All Tools](../user-guide/overview.md) - Explore capabilities

## Upgrading

To upgrade to the latest version:

```bash
# NPM
npm update -g gbif-mcp

# Docker
docker pull gbif-mcp:latest

# From source
git pull origin main
npm install
npm run build
```

## Uninstallation

```bash
# NPM global
npm uninstall -g gbif-mcp

# Docker
docker rmi gbif-mcp:latest

# From source
rm -rf gbif-mcp/
```
