# MCP Workspace Server — design report

## Purpose
A standalone MCP file-server connector provides restricted file operations and search to Claude Desktop. Four handoff documents let separate agent sessions share progress. A generic task-list exercise demonstrates continuity; the project has no integration with another system.

## Stack and choices
Node.js and TypeScript implement the server using the official v1 MCP SDK. Zod validates tool input. Streamable HTTP with JSON responses supports a remote connector without long-lived in-memory sessions. Express hosts `/mcp` and `/health`. PM2 manages the compiled server process; ngrok supplies external HTTPS. The group must run these deployment steps on its computer.

## Tool design
Eight tools expose list, read, write, exact replacement, delete, filename search, text search and metadata. Search was chosen instead of Git operations to keep the minimum implementation focused. Write defaults to exclusive creation; replacing an existing file requires an explicit flag. Replacement rejects zero or multiple matches. Delete accepts only regular files.

## Sandbox and security tradeoffs
All tool paths resolve against one canonical workspace root. Containment checks reject outside paths; existing path components are checked for symlinks and Windows junctions. Drive/UNC paths and special Windows device aliases are rejected. Tool errors avoid returning native filesystem paths. Search skips links and has size/depth/result limits. The app binds to loopback, validates Host using the SDK helper, and rejects unapproved Origin headers.

This is a controlled teaching implementation, not an OS sandbox. Another local process could replace directories between checks and use. Hard links and concurrent external writes are not fully defended. Keep a dedicated workspace under a trusted local user. Synchronous small-file operations simplify ordering within one process but do not prevent stale agent changes across requests. Version-based optimistic locking is future work.

The starter has no authentication. HTTPS encrypts traffic but does not authenticate callers. A public tunnel exposes all workspace tools to anyone who reaches it. Use sample files, stop exposure afterward, and add a Claude-compatible authentication flow before private/shared deployment. An ngrok account token authenticates the tunnel owner only.

## Handoff protocol
PROJECT_STATE describes current work and next action. PLAN_LOG tracks task status. CHECKPOINTS records actual verification evidence. DECISIONS explains choices. Agents read these first and update them before ending. No automatic hidden memory is assumed.

## Validation
See test-results.md for actual automated results. Tests cover file operations, overwrite and replacement guards, traversal/absolute-path rejection, symlink escape, size limits, result limits, and a real SDK client over local HTTP. Windows CI is configured but must actually run before claiming Windows verification.

## Deployment and session workflow
The Windows setup guide specifies PM2 process management, ngrok HTTPS exposure, and Claude Desktop connector configuration. SESSION-TASK.md specifies a two-conversation workflow based on shared handoff files. These external deployment and Claude procedures were not executed during local automated verification. The documentation describes their configuration and expected behavior, without claiming observed session results.
