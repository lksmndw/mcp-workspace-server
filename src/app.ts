import express from 'express';
import { hostHeaderValidation } from '@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './mcp.js';
import { Workspace } from './workspace.js';

export function createApp(workspace: Workspace, audit: (name: string, success: boolean) => void = () => {}) {
  const app = express();
  app.use(hostHeaderValidation(['127.0.0.1', 'localhost']));
  // Reject browser cross-origin calls. Inspector's proxy and Claude cloud calls normally have no Origin.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !['http://localhost:6274', 'http://127.0.0.1:6274'].includes(origin)) {
      res.status(403).json({ error: 'Origin not permitted.' }); return;
    }
    next();
  });
  app.use(express.json({ limit: '2mb' }));
  app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });
  app.post('/mcp', async (req, res) => {
    const server = createMcpServer(workspace, audit);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { void transport.close(); void server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'MCP request failed.' });
    }
  });
  app.get('/mcp', (_req, res) => { res.status(405).end(); });
  app.delete('/mcp', (_req, res) => { res.status(405).end(); });
  return app;
}
