import 'dotenv/config';
import path from 'node:path';
import { createApp } from './app.js';
import { Workspace } from './workspace.js';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
const workspace = new Workspace(path.resolve(process.env.WORKSPACE_ROOT || './workspace'));
const app = createApp(workspace, (tool, success) => {
  console.log(JSON.stringify({ time: new Date().toISOString(), tool, success }));
});
const listener = app.listen(port, '127.0.0.1', () => {
  console.log(`MCP endpoint: http://127.0.0.1:${port}/mcp`);
  console.log('Demo server has no authentication. Use sample files only.');
});
const shutdown = () => { listener.close(() => process.exit(0)); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
