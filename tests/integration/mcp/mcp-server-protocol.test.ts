import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { serveStdio, type StdioServerHandle } from '@modelcontextprotocol/server/stdio';
import { GBIFMCPServer } from '../../../src/index.js';

/**
 * Drives the real MCP protocol layer (GBIFMCPServer.createServer via serveStdio)
 * in-process, for both the 2026-07-28 era and the legacy initialize handshake.
 */
const eras = [
  { label: '2026-07-28', options: { versionNegotiation: { mode: { pin: '2026-07-28' } } }, era: 'modern' },
  { label: 'legacy', options: {}, era: 'legacy' },
] as const;

describe.each(eras)('MCP server protocol ($label)', ({ options, era }) => {
  let client: Client;
  let handle: StdioServerHandle;

  beforeAll(async () => {
    const gbif = new GBIFMCPServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    handle = serveStdio(() => gbif.createServer(), { transport: serverTransport });
    client = new Client({ name: 'vitest', version: '1.0.0' }, options);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await handle.close();
  });

  it('negotiates the expected protocol era', () => {
    expect(client.getProtocolEra()).toBe(era);
    if (era === 'modern') {
      expect(client.getNegotiatedProtocolVersion()).toBe('2026-07-28');
    }
  });

  it('lists every tool with an object input schema', async () => {
    const { tools } = await client.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(58);
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema).not.toHaveProperty('$schema');
    }
    const download = tools.find(t => t.name === 'gbif_occurrence_download_request');
    expect(download?.inputSchema.required).toContain('predicate');
  });

  it('rejects unknown tools with InvalidParams (-32602)', async () => {
    await expect(
      client.callTool({ name: 'definitely_not_a_tool', arguments: {} })
    ).rejects.toMatchObject({ code: -32602 });
  });

  it('returns isError for invalid arguments', async () => {
    const result = await client.callTool({ name: 'gbif_species_get', arguments: { key: 'not-a-number' } });
    expect(result.isError).toBe(true);
  });

  it('runs a tool that needs no GBIF request', async () => {
    const result = await client.callTool({ name: 'gbif_maps_list_styles', arguments: {} });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    expect(() => JSON.parse(content[0].text)).not.toThrow();
  });
});
