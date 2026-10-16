import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Workspace } from '../src/workspace.js';
import { createApp } from '../src/app.js';

test('real HTTP SDK client discovers eight tools and exercises operations', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-http-'));
  const app = createApp(new Workspace(root));
  const listener = app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const url = `http://127.0.0.1:${(listener.address() as AddressInfo).port}`;
  t.after(async () => {
    listener.closeAllConnections();
    await new Promise<void>(resolve => listener.close(() => resolve()));
    fs.rmSync(root, { recursive: true, force: true });
  });
  assert.equal((await fetch(`${url}/health`)).status, 200);
  assert.equal((await fetch(`${url}/mcp`)).status, 405);
  assert.equal((await fetch(`${url}/mcp`, { method: 'POST', headers: { Origin: 'https://untrusted.example' } })).status, 403);
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/mcp`)));
  t.after(() => client.close());
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 8);
  async function call(name: string, args: Record<string, unknown>) {
    return client.callTool({ name, arguments: args });
  }
  assert.equal((await call('write_file', { path: 'large.txt', content: 'x'.repeat(200_000) })).isError, undefined);
  assert.equal((await call('delete_file', { path: 'large.txt' })).isError, undefined);
  assert.equal((await call('write_file', { path: 'a.txt', content: 'hello' })).isError, undefined);
  assert.equal((await call('write_file', { path: 'a.txt', content: 'bad' })).isError, true);
  assert.equal((await call('read_file', { path: '../secret' })).isError, true);
  assert.equal((await call('read_file', {})).isError, true);
  for (const [name, args] of [
    ['list_files', { path: '.' }], ['read_file', { path: 'a.txt' }],
    ['str_replace', { path: 'a.txt', old_text: 'hello', new_text: 'updated' }],
    ['search_files', { query: 'a.txt' }], ['search_text', { query: 'updated' }],
    ['file_info', { path: 'a.txt' }], ['delete_file', { path: 'a.txt' }]
  ] as [string, Record<string, unknown>][]) {
    assert.notEqual((await call(name, args)).isError, true, name);
  }
});
