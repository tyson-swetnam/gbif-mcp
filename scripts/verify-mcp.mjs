#!/usr/bin/env node
/**
 * End-to-end MCP verification for the GBIF server.
 *
 * Spawns build/index.js over stdio with a real MCP v2 client and, for each
 * protocol era (2026-07-28 via server/discover, and the legacy 2025-11-25
 * initialize handshake):
 *   - lists tools and checks every inputSchema compiles as JSON Schema 2020-12
 *   - calls every tool with schema-derived arguments and expects a non-error result
 *   - checks unknown tools reject with -32602 and bad arguments return isError
 *
 * By default GBIF is replaced by a local stub that records the requested
 * paths. Pass --live to hit the real GBIF API (https://api.gbif.org/v1).
 *
 * Usage: npm run build && node scripts/verify-mcp.mjs [--live] [--only <tool>]
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/client/validators/ajv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = process.argv.includes('--live');
const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : undefined;

// Realistic sample values for argument names that GBIF validates server-side
const SAMPLES = {
  q: 'Puma',
  name: 'Puma concolor',
  scientificName: 'Puma concolor',
  key: 2435099,
  taxonKey: 2435099,
  usageKey: 2435099,
  speciesKey: 2435099,
  gbifId: 1258202889,
  country: 'US',
  publishingCountry: 'US',
  datasetKey: '50c9509d-22c7-4a22-a47d-8c48425ef4a7',
  organizationKey: '28eb1a3f-1c15-4a95-931a-4af90ecb574d',
  publishingOrg: '28eb1a3f-1c15-4a95-931a-4af90ecb574d',
  networkKey: '99d66b6c-9087-452f-a9d4-f15f2c2d0e7e',
  installationKey: '7182d304-b0a2-404b-baba-2086a325c221',
  nodeKey: '1f94b3ca-9345-4d65-afe2-4bace93aa0fe',
  vocabularyName: 'LifeStage',
  conceptName: 'Adult',
  downloadKey: '0000000-000000000000000',
  year: 2020,
  names: ['Puma concolor (Linnaeus, 1771)'],
};

const stubRequests = [];

function startStub() {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      stubRequests.push({ method: req.method, url: req.url, body });
      const url = new URL(req.url, 'http://stub');
      const p = url.pathname;
      // Upstream failures for the error-path checks below
      if (p.endsWith('/species/404404')) {
        res.writeHead(404, { 'content-type': 'application/json' });
        return res.end('{"message":"not found"}');
      }
      if (p.endsWith('/species/500500')) {
        res.writeHead(500, { 'content-type': 'text/plain' });
        return res.end('boom');
      }
      let payload;
      if (/\/(parents|parser\/name|enumeration\/basic\/.*)$/.test(p) || p.endsWith('/related')) {
        payload = [{ key: 1, scientificName: 'Stub' }];
      } else if (p.includes('/occurrence/counts/') || p.includes('/occurrence/count/')) {
        payload = { STUB: 1 };
      } else if (p.endsWith('/occurrence/count')) {
        payload = 1;
      } else if (p.endsWith('/occurrence/download/request')) {
        payload = '0000000-000000000000000';
      } else {
        payload = {
          key: 1,
          offset: 0,
          limit: 20,
          endOfRecords: true,
          count: 1,
          results: [{ key: 1, scientificName: 'Stub', title: 'Stub' }],
          facets: [],
        };
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** Build minimal valid arguments from a tool's JSON Schema. */
function sampleFor(propName, schema) {
  if (propName in SAMPLES) {
    const v = SAMPLES[propName];
    const t = schema.type;
    if (t === 'string' && typeof v !== 'string') return String(v);
    if ((t === 'number' || t === 'integer') && typeof v !== 'number') return Number(v) || 1;
    if (t === 'array' && !Array.isArray(v)) return [v];
    if (!t || typeof v === typeof (t === 'array' ? [] : t === 'integer' ? 0 : '') || Array.isArray(v) === (t === 'array')) {
      if (schema.enum && !schema.enum.includes(v)) return schema.enum[0];
      return v;
    }
  }
  if (schema.const !== undefined) return schema.const;
  if (schema.enum) return schema.enum[0];
  if (schema.anyOf) return sampleFor(propName, schema.anyOf[0]);
  if (schema.oneOf) return sampleFor(propName, schema.oneOf[0]);
  switch (schema.type) {
    case 'string':
      if (schema.format === 'uuid') return '50c9509d-22c7-4a22-a47d-8c48425ef4a7';
      if (schema.format === 'email') return 'test@example.org';
      if (schema.format === 'uri') return 'https://example.org/data.zip';
      if (schema.pattern) return undefined;
      return 'x'.repeat(Math.max(schema.minLength ?? 1, Math.min(3, schema.maxLength ?? 3)));
    case 'integer':
    case 'number':
      return schema.minimum ?? (schema.exclusiveMinimum !== undefined ? schema.exclusiveMinimum + 1 : 1);
    case 'boolean':
      return true;
    case 'array':
      return [sampleFor(propName, schema.items ?? { type: 'string' })];
    case 'object':
      return buildArgs(schema);
    default:
      return 'x';
  }
}

function buildArgs(schema) {
  const args = {};
  for (const req of schema.required ?? []) {
    args[req] = sampleFor(req, schema.properties?.[req] ?? {});
  }
  return args;
}

async function runEra(label, clientOptions, env, toolOverrides) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, 'build/index.js')],
    env: { ...process.env, ...env },
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', d => (stderr += d));
  const client = new Client({ name: 'gbif-mcp-verify', version: '1.0.0' }, clientOptions);
  await client.connect(transport);

  const failures = [];
  const ok = [];
  const era = client.getProtocolEra?.();
  const version = client.getNegotiatedProtocolVersion();
  console.log(`\n=== ${label}: era=${era} version=${version} server=${JSON.stringify(client.getServerVersion())}`);

  const { tools } = await client.listTools();
  console.log(`tools/list -> ${tools.length} tools`);

  // Same validator (and dialect selection) the SDK client uses
  const ajv = new AjvJsonSchemaValidator();
  const names = new Set();
  for (const tool of tools) {
    if (names.has(tool.name)) failures.push(`${tool.name}: duplicate tool name`);
    names.add(tool.name);
    if (!/^[A-Za-z0-9_.-]{1,128}$/.test(tool.name)) failures.push(`${tool.name}: invalid tool name`);
    if (tool.inputSchema?.type !== 'object') failures.push(`${tool.name}: inputSchema root is not an object`);
    try {
      ajv.getValidator(tool.inputSchema);
    } catch (e) {
      failures.push(`${tool.name}: inputSchema does not compile: ${e.message}`);
    }
  }

  for (const tool of tools) {
    if (only && tool.name !== only) continue;
    const args = toolOverrides[tool.name] ?? buildArgs(tool.inputSchema);
    const check = ajv.getValidator(tool.inputSchema)(args);
    if (!check.valid) {
      failures.push(`${tool.name}: generated args do not satisfy its own inputSchema: ${check.errorMessage}`);
      continue;
    }
    const before = stubRequests.length;
    try {
      const result = await client.callTool({ name: tool.name, arguments: args });
      const text = result.content?.[0]?.text ?? '';
      const paths = stubRequests.slice(before).map(r => `${r.method} ${r.url.split('?')[0]}`);
      if (result.isError) {
        failures.push(`${tool.name}(${JSON.stringify(args)}): isError ${text.slice(0, 300)}`);
      } else {
        JSON.parse(text);
        ok.push(`${tool.name} ${live ? '' : paths.join(', ') || '(no HTTP)'}`);
      }
    } catch (e) {
      failures.push(`${tool.name}: threw ${e.code ?? ''} ${e.message}`);
    }
  }

  // Adversarial protocol checks
  try {
    await client.callTool({ name: 'definitely_not_a_tool', arguments: {} });
    failures.push('unknown tool: expected a -32602 protocol error, call succeeded');
  } catch (e) {
    if (e.code !== -32602) failures.push(`unknown tool: expected code -32602, got ${e.code} ${e.message}`);
  }
  const bad = await client.callTool({ name: 'gbif_species_get', arguments: { key: 'not-a-number' } }).catch(e => e);
  if (!(bad && bad.isError === true)) {
    failures.push(`invalid arguments: expected isError tool result, got ${JSON.stringify(bad).slice(0, 200)}`);
  }

  if (!live) {
    for (const [key, expect] of [[404404, /not found/i], [500500, /unavailable|error/i]]) {
      const r = await client.callTool({ name: 'gbif_species_get', arguments: { key } }).catch(e => e);
      const text = r?.content?.[0]?.text ?? '';
      if (!(r?.isError === true && expect.test(text))) {
        failures.push(`GBIF HTTP error for key ${key}: expected isError matching ${expect}, got ${JSON.stringify(r).slice(0, 200)}`);
      }
    }
  }

  await client.close();
  ok.forEach(o => console.log(`  ok   ${o}`));
  failures.forEach(f => console.log(`  FAIL ${f}`));
  if (failures.length && stderr) console.log(`--- server stderr (tail) ---\n${stderr.split('\n').slice(-20).join('\n')}`);
  return { failures, ok, era, version };
}

const stub = live ? undefined : await startStub();
const env = {
  LOG_LEVEL: 'error',
  ENABLE_METRICS: 'false',
  ...(stub ? { GBIF_BASE_URL: `http://127.0.0.1:${stub.address().port}`, GBIF_RETRY_ATTEMPTS: '0' } : {}),
};
// Tools whose required arguments need values the generic generator cannot invent
const overrides = {
  gbif_occurrence_download_predicate_builder: { taxonKey: 2435099, country: 'US' },
  gbif_registry_get_dataset: { key: SAMPLES.datasetKey },
  gbif_registry_dataset_metrics: { key: '7ddf754f-d193-4cc9-b351-99906754a03b' },
  gbif_registry_dataset_document: { key: SAMPLES.datasetKey },
  gbif_registry_get_organization: { key: SAMPLES.organizationKey },
  gbif_registry_get_network: { key: SAMPLES.networkKey },
  gbif_registry_get_installation: { key: SAMPLES.installationKey },
  gbif_registry_get_collection: { key: 'dceb8d52-094c-4c2c-8960-75e0097c6861' },
  gbif_registry_get_institution: { key: 'a2e5b0f5-6e0d-4c6b-8e3f-0b1e6d9b6c34' },
  gbif_registry_get_node: { key: SAMPLES.nodeKey },
  gbif_vocabularies_get: { name: 'LifeStage' },
  gbif_vocabularies_get_concept: { vocabulary: 'LifeStage', concept: 'Adult' },
  gbif_literature_get: { doi: '10.1371/journal.pone.0102623' },
};

const modern = await runEra('2026-07-28', { versionNegotiation: { mode: { pin: '2026-07-28' } } }, env, overrides);
const legacy = await runEra('legacy', {}, env, overrides);
stub?.close();

// Raw stdio checks: stdout carries only JSON-RPC, and the server exits when stdin closes
const wire = await new Promise(resolve => {
  const child = spawn(process.execPath, [path.join(root, 'build/index.js')], {
    env: { ...process.env, ...env, LOG_LEVEL: 'debug' },
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  let out = '';
  child.stdout.on('data', d => (out += d));
  const problems = [];
  const timer = setTimeout(() => {
    problems.push('server did not exit within 5s of stdin closing');
    child.kill('SIGKILL');
  }, 8000);
  child.on('exit', () => {
    clearTimeout(timer);
    const lines = out.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        if (JSON.parse(line).jsonrpc !== '2.0') problems.push(`non JSON-RPC stdout line: ${line.slice(0, 120)}`);
      } catch {
        problems.push(`non-JSON stdout line: ${line.slice(0, 120)}`);
      }
    }
    const discover = lines.map(l => JSON.parse(l)).find(m => m.id === 1);
    if (!discover?.result?.supportedVersions?.includes('2026-07-28')) {
      problems.push(`server/discover did not advertise 2026-07-28: ${JSON.stringify(discover)}`);
    }
    resolve(problems);
  });
  child.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'server/discover',
    params: {
      _meta: {
        'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        'io.modelcontextprotocol/clientInfo': { name: 'raw-probe', version: '1.0.0' },
        'io.modelcontextprotocol/clientCapabilities': {},
      },
    },
  }) + '\n');
  setTimeout(() => child.stdin.end(), 3000);
});
wire.forEach(w => console.log(`FAIL ${w}`));
if (!wire.length) console.log('\nok   raw stdio: clean stdout, server/discover advertises 2026-07-28, exits on stdin close');

const total = modern.failures.length + legacy.failures.length + wire.length;
let eraProblem = false;
if (modern.era !== 'modern' || modern.version !== '2026-07-28') {
  console.log(`FAIL modern connection negotiated era=${modern.era} version=${modern.version}`);
  eraProblem = true;
}
if (legacy.era !== 'legacy') {
  console.log(`FAIL legacy connection negotiated era=${legacy.era}`);
  eraProblem = true;
}
console.log(`\nSummary: modern ${modern.ok.length} ok / ${modern.failures.length} failed; legacy ${legacy.ok.length} ok / ${legacy.failures.length} failed`);
process.exit(total || eraProblem ? 1 : 0);
