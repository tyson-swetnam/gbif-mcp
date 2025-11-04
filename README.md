# GBIF MCP Server

A Model Context Protocol (MCP) server providing programmatic access to the Global Biodiversity Information Facility (GBIF) API.

## Overview

This MCP server enables AI assistants and applications to interact with GBIF's extensive biodiversity data through the Model Context Protocol. GBIF provides access to hundreds of millions of species occurrence records, taxonomic information, and biodiversity research data from around the world.

## What is GBIF?

The [Global Biodiversity Information Facility (GBIF)](https://www.gbif.org/) is an international network and data infrastructure that provides open access to biodiversity data. The GBIF API offers programmatic access to:

- **Species Data**: Taxonomic information, species discovery, and name-matching utilities
- **Occurrence Records**: Indexed records of species observations and specimens
- **Datasets**: Information about published datasets and their sources
- **Organizations**: Data about publishing organizations and institutions
- **Maps**: Visualization of biodiversity data
- **Literature**: Peer-reviewed papers citing GBIF datasets
- **Vocabularies**: Standardized terminology for biodiversity data

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open protocol that standardizes how AI applications interact with external data sources and tools. This server implements MCP to make GBIF's biodiversity data accessible to AI assistants like Claude.

## Features

This MCP server provides access to key GBIF API endpoints:

- **Species API**: Search for species, get taxonomic information, and match scientific names
- **Occurrence API**: Query species occurrence records with advanced filtering
- **Registry API**: Access information about datasets and publishing organizations
- **Maps API**: Generate visualizations of biodiversity data
- **Literature API**: Search for research papers citing GBIF data
- **Validator API**: Perform data quality checks

## Installation

```bash
# Clone the repository
git clone https://github.com/tyson-swetnam/gbif-mcp.git
cd gbif-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

## Configuration

Add this server to your MCP settings configuration file:

**For Claude Desktop:**

```json
{
  "mcpServers": {
    "gbif": {
      "command": "node",
      "args": ["/path/to/gbif-mcp/build/index.js"]
    }
  }
}
```

## Usage Examples

Once configured, you can use the MCP server through your AI assistant:

- "Search for occurrence records of Panthera tigris in India"
- "Find taxonomic information for the species Quercus robur"
- "List datasets published by the Natural History Museum"
- "Show me recent papers citing GBIF data about pollinators"
- "Validate this biodiversity dataset before publication"

## API Coverage

This MCP server implements the following GBIF API sections:

- ✅ Species API
- ✅ Occurrence API
- ✅ Registry API
- ✅ Maps API
- ✅ Literature API
- ✅ Vocabularies API
- ✅ Validator API

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Resources

- [GBIF API Documentation](https://techdocs.gbif.org/en/openapi/)
- [GBIF Website](https://www.gbif.org/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [GBIF API Base URL](https://api.gbif.org/)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Acknowledgments

This project uses the GBIF API to provide access to biodiversity data. GBIF is funded by governments and maintains a stable, version 1 API with backward compatibility guarantees.

## Support

- GBIF API Issues: [GBIF GitHub](https://github.com/gbif)
- GBIF Community Forum: [discourse.gbif.org](https://discourse.gbif.org/)
- MCP Issues: Open an issue in this repository
