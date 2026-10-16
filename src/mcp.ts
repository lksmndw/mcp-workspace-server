import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MAX_BYTES, Workspace, safeError } from './workspace.js';

export function createMcpServer(workspace: Workspace, audit: (name: string, success: boolean) => void = () => {}) {
  const server = new McpServer({ name: 'mcp-workspace-server', version: '1.0.0' });
  function tool<S extends z.ZodRawShape>(name: string, description: string, shape: S, action: (args: z.infer<z.ZodObject<S>>) => unknown) {
    server.registerTool(name, { description, inputSchema: shape as z.ZodRawShape }, async (args) => {
      try {
        const result = action(z.object(shape).parse(args));
        audit(name, true);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        audit(name, false);
        return { isError: true, content: [{ type: 'text' as const, text: safeError(error) }] };
      }
    });
  }
  const file = z.string().min(1).max(500);
  const folder = file.default('.');
  tool('list_files', 'List immediate workspace folder contents.', { path: folder }, a => workspace.list(a.path));
  tool('read_file', 'Read a text file, maximum 1 MB.', { path: file }, a => ({ path: a.path, content: workspace.read(a.path) }));
  tool('write_file', 'Create a text file. Existing files require overwrite=true. Parent folder must exist.',
    { path: file, content: z.string().max(MAX_BYTES), overwrite: z.boolean().default(false) }, a => {
      workspace.write(a.path, a.content, a.overwrite); return { success: true, path: a.path };
    });
  tool('str_replace', 'Replace one exact match. Missing or ambiguous matches are rejected.',
    { path: file, old_text: z.string().min(1).max(MAX_BYTES), new_text: z.string().max(MAX_BYTES) }, a => {
      workspace.replace(a.path, a.old_text, a.new_text); return { success: true, replacements: 1 };
    });
  tool('delete_file', 'Delete one regular file. Directories and workspace root are protected.', { path: file }, a => {
    workspace.delete(a.path); return { success: true, path: a.path };
  });
  tool('search_files', 'Recursively search filename substrings, case insensitive.',
    { path: folder, query: z.string().min(1).max(200) }, a => workspace.searchFiles(a.path, a.query));
  tool('search_text', 'Recursively search literal text, case sensitive. Return paths and line numbers.',
    { path: folder, query: z.string().min(1).max(200) }, a => workspace.searchText(a.path, a.query));
  tool('file_info', 'Return file or folder metadata.', { path: file }, a => workspace.info(a.path));
  return server;
}
