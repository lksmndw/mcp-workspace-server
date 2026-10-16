# MCP Workspace Server
## Final project documentation

### 1. Project overview

MCP Workspace Server is a standalone file-server connector based on the Model Context Protocol. It exposes eight tools that allow Claude Desktop to inspect, create, modify, search, and delete files within a configured workspace. It is independent of any other application or coursework system.

### 2. Problem addressed

AI conversations do not automatically retain a reliable record of project files, completed actions, and unfinished tasks across independent sessions. This project provides controlled file access and four explicit handoff documents so a later conversation can recover the project state from persistent files.

### 3. Objectives

- Expose at least eight useful MCP tools.
- Restrict file operations to a configured workspace.
- Validate inputs and return clear operation results.
- Support Streamable HTTP for a remote MCP client.
- Document HTTPS exposure through ngrok and process management through PM2.
- Preserve project state through a documented handoff protocol.
- Provide a reproducible repository with setup instructions and automated tests.

### 4. Scope

The implementation handles small text files, directory listings, file metadata, exact text replacement, and recursive search. Claude Desktop is the intended user-facing client. A generic task-list sample illustrates continuity without coupling the server to another project.

The server does not include a database, website interface, shell execution tool, directory creation tool, OAuth implementation, or automated session recorder.

### 5. Architecture

| Component | Responsibility |
|---|---|
| Claude Desktop | Sends MCP tool requests and displays results |
| ngrok | Forwards a public HTTPS endpoint to the local server |
| Express application | Hosts health and MCP endpoints; validates Host and Origin |
| MCP SDK | Handles protocol messages, discovery, and tool calls |
| Zod schemas | Validate tool input fields |
| Workspace service | Resolves paths and performs restricted filesystem operations |
| Handoff documents | Preserve project progress across independent conversations |
| PM2 | Manages the compiled server process |

The request flow is: Claude Desktop sends a tool request through the HTTPS tunnel; the MCP server validates inputs; the workspace service validates the path and performs the requested operation; the result returns through MCP to Claude.

### 6. Technology stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js 22 or later | Supports the project dependencies and modern JavaScript |
| Language | TypeScript | Provides compile-time checking and readable interfaces |
| Protocol | Official MCP TypeScript SDK v1 | Provides tools and Streamable HTTP transport |
| HTTP | Express | Hosts the MCP endpoint and health check |
| Validation | Zod | Defines and checks tool input schemas |
| Configuration | dotenv | Loads local environment settings |
| Process management | PM2 | Restarts and monitors the server process |
| HTTPS exposure | ngrok | Provides a reachable endpoint for a remote connector |
| Version control | Git and GitHub | Stores source, configuration and documentation |
| Tests | Node test runner, tsx, MCP SDK client | Tests filesystem behavior and actual local HTTP protocol calls |

### 7. Tool design

| Tool | Purpose | Main inputs |
|---|---|---|
| list_files | List immediate folder contents | path |
| read_file | Read text content | path |
| write_file | Create a file or explicitly overwrite one | path, content, overwrite |
| str_replace | Replace exactly one literal match | path, old_text, new_text |
| delete_file | Delete one regular file | path |
| search_files | Search filename substrings recursively | path, query |
| search_text | Search literal text with line numbers | path, query |
| file_info | Return size, type and modified time | path |

Write defaults to exclusive creation. Exact replacement fails if the old text is missing or appears more than once. Deletion rejects folders and the workspace root. Filename search is case insensitive; text search is case sensitive. Detailed examples appear in docs/tools.md.

### 8. Workspace protection

The configured root is canonicalized on startup. Inputs must be relative paths. Each resolved target is checked for containment within the root, and existing path components are checked for symlinks or junctions. Outside traversal, absolute paths, Windows drives, alternate data streams, and selected Windows special-device aliases are rejected.

The implementation is intended for a controlled local workspace. It is not an operating-system security boundary. Hard links, a hostile local process swapping directories between checks and use, concurrent external writes, and stale agent updates are not fully addressed. Use a dedicated directory under a trusted local user.

### 9. Limits and error behavior

Text operations allow up to 1,000,000 bytes. Reads reject NUL-containing content; this is a basic binary check rather than full file-type detection. Search visits at most 2000 entries, traverses at most 20 levels, and returns at most 200 matches with truncation indicators. Text search reports skipped files and limits displayed line excerpts.

Tool failures return isError=true with a useful message. Missing paths, existing-file conflicts, access failures, and invalid operation targets are reported without exposing native filesystem error paths.

### 10. Handoff protocol

| Document | Purpose |
|---|---|
| PROJECT_STATE.md | Goal, current state, relevant paths, remaining work and next action |
| PLAN_LOG.md | Ordered steps and their status |
| CHECKPOINTS.md | Verified milestones and observed results |
| DECISIONS.md | Choices and their explanations |

At session start, an agent reads these documents. Before stopping, it records completed work, verification, unresolved items and a concrete next action. A new conversation then reads the same files. Persistence comes from the files, not from HTTP session memory.

### 11. Sample workflow

The sample workspace contains three generic tasks in demo/tasks.json. The first conversation inspects the data and creates explanatory notes. A separate conversation reads the handoff documents and produces a task summary. Expected counts are one done task, one in-progress task, and one pending task. docs/SESSION-TASK.md contains prompts and expected output. This is a workflow specification, not a transcript of executed conversations.

### 12. Installation and deployment

The complete Windows procedure is in docs/WINDOWS-SETUP.md. In brief:

1. Install Node.js, VS Code, Git and Claude Desktop.
2. Open the repository folder and run npm ci.
3. Copy .env.example to .env.
4. Run npm run check, then npm run dev.
5. Connect Inspector to http://127.0.0.1:3000/mcp.
6. Stop development mode, build, and start ecosystem.config.cjs with PM2.
7. Start ngrok with Host rewriting as specified in the setup guide.
8. Add the public HTTPS MCP URL in Claude Desktop Settings → Connectors.

PM2 manages the server only; the tunnel is a separate process. Windows reboot persistence requires additional setup. Claude's remote connector requires a public address rather than localhost.

### 13. Verification results

The TypeScript build passed. Seven automated tests passed with no failures or skips on Linux using Node.js v24.19.0 and MCP SDK 1.32.1. The tests verify filesystem operations, containment checks, symlink escape rejection, overwrite and replacement guards, byte limits, search result handling, and eight-tool discovery/calls using an SDK client over real local HTTP. A 200 KB write checks HTTP body parsing beyond Express's default limit.

Windows deployment, the Inspector UI, public HTTPS, PM2 restart behavior, and Claude Desktop conversations were not executed during this verification. CI is configured for Windows and Linux, but configuring a workflow is not evidence of a successful run. See docs/test-results.md.

### 14. Authentication and security tradeoffs

This teaching server has no caller authentication. HTTPS encrypts the connection but does not restrict who can call the tools. An ngrok account token authenticates the tunnel owner, not MCP callers. Use sample data and stop the tunnel when finished. A Claude-compatible authentication flow is needed before using private data or shared public deployment.

### 15. Future improvements

Future work includes authentication, optimistic version locking, stronger operating-system isolation, controlled directory creation, more complete binary detection, and managed tunnel lifecycle. These are proposed improvements, not implemented features.

### 16. Repository contents

The repository includes TypeScript source, automated tests, package-lock.json, environment and PM2 configuration, CI configuration, sample handoff files, generic task data, a setup guide, a tool reference, a design report, and verified local test results. Dependencies, compiled output, credentials and .env are excluded from the distributable package.

### 17. References

- Official MCP TypeScript SDK v1: https://ts.sdk.modelcontextprotocol.io/
- MCP Inspector: https://github.com/modelcontextprotocol/inspector
- Claude custom remote connectors: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- ngrok documentation: https://ngrok.com/docs/
- PM2 documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
