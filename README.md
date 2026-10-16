# MCP Workspace Server

A standalone course project: an MCP file-server connector that lets Claude Desktop work in one restricted folder and continue a task across separate conversations. This repository is independent of any other application or coursework project.

## Start here (Windows)

1. Install Node.js LTS (22 or later), VS Code, Git, and Claude Desktop.
2. Extract this repository ZIP. Open the extracted `mcp-workspace-server` folder in VS Code.
3. Select **Terminal → New Terminal** and choose **Command Prompt** from the dropdown.
4. Run these commands one at a time:

```bat
npm ci
copy .env.example .env
npm run check
npm run dev
```

`npm run check` builds the TypeScript source and runs automated tests. Keep the server terminal open. Visit http://127.0.0.1:3000/health and expect `{"status":"ok"}`.

5. In a second terminal run:

```bat
npx @modelcontextprotocol/inspector
```

Open Inspector using its terminal instructions. Select **Streamable HTTP**, enter `http://127.0.0.1:3000/mcp`, connect and list the tools. Prefer Inspector's proxy connection; the server does not provide direct browser CORS access.

6. Follow [the complete Windows guide](docs/WINDOWS-SETUP.md) to start PM2, ngrok, and connect Claude Desktop.
7. Read [the session handoff workflow](docs/SESSION-TASK.md) to understand how separate Claude conversations continue work.
8. Read [the complete project documentation](DOCUMENTATION.md) and use [the repository checklist](docs/SUBMISSION-CHECKLIST.md).

Opening `/mcp` in an ordinary browser returns 405; that endpoint expects MCP POST requests. Use `/health` for a browser check.

## Eight tools

| Tool | Purpose |
|---|---|
| list_files | List immediate directory contents |
| read_file | Read a text file |
| write_file | Create or explicitly overwrite a text file |
| str_replace | Replace one exact text match |
| delete_file | Delete one regular file |
| search_files | Recursively find filename substrings |
| search_text | Recursively find literal text with line numbers |
| file_info | Inspect file or folder metadata |

See [tool inputs and examples](docs/tools.md).

## Project layout

- `src/server.ts`: environment configuration and process startup.
- `src/app.ts`: local HTTP endpoint and stateless MCP transport.
- `src/mcp.ts`: tool schemas, registration, and error results.
- `src/workspace.ts`: shared path checks and file operations.
- `tests/`: automated filesystem and real HTTP MCP client tests.
- `workspace/`: the only folder agents can access.
- `docs/`: setup, design report, test results, session workflow, and repository checklist.
- `ecosystem.config.cjs`: PM2 configuration.
- `.github/workflows/check.yml`: Windows/Linux CI build and test matrix.

## Configuration

Copy `.env.example` to `.env`. `PORT` defaults to 3000 and `WORKSPACE_ROOT` to `./workspace`, relative to the project working directory. The server canonicalizes the configured root on startup. The four handoff files and sample task files are in the default workspace; copy them if you configure a different root.

## Commands

| Command | Purpose |
|---|---|
| npm ci | Install the locked dependencies |
| npm run dev | Run with automatic restart during edits |
| npm run build | Compile source into dist/ |
| npm start | Run compiled server |
| npm test | Run tests using disposable temporary workspaces |
| npm run check | Build and test |

## Handoff documents

`PROJECT_STATE.md`, `PLAN_LOG.md`, `CHECKPOINTS.md`, and `DECISIONS.md` live inside `workspace/`. Agents read them when starting and update them before stopping. They are persistent files; the HTTP server itself is stateless.

## Scope and limitations

This teaching implementation is unauthenticated. Anyone who reaches its public tunnel can call its tools. Use disposable sample files, and stop the tunnel afterward. OAuth or another Claude-compatible authentication method is future work; an ngrok account token authenticates the tunnel owner and does not authenticate MCP callers.

Relative-path containment and symlink/junction checks protect ordinary tool calls. This is not an operating-system security boundary. Do not allow untrusted local processes to modify the root or its directories during tool calls. Hard links, concurrent external path changes, multi-process writes, and stale agent updates are not fully handled. Use a dedicated workspace and OS user. Version locking is future work.

Text files have a 1,000,000-byte limit; binary detection rejects NUL-containing content but is not comprehensive. Search has entry, depth and output limits. There is no shell execution or directory creation tool; prepare needed folders locally.

## Verification scope

The TypeScript build and seven automated tests passed during preparation. See `docs/test-results.md`. Claude Desktop, ngrok, PM2, and Windows deployment are described as configuration procedures; they were not executed in this environment. This package contains finalized technical documentation, without session recordings, transcript templates, or live presentation materials.

## Official references

- https://ts.sdk.modelcontextprotocol.io/ (SDK v1; do not mix v2 imports)
- https://github.com/modelcontextprotocol/inspector
- https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- https://ngrok.com/docs/
- https://pm2.keymetrics.io/docs/usage/quick-start/
