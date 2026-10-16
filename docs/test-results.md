# Verification results

## Executed during repository preparation

Environment: Linux, Node.js v24.19.0, npm 11.9.0, MCP SDK 1.32.1.
Command: `npm run check`.

- TypeScript compilation: PASS.
- Automated tests: 7 PASS, 0 FAIL, 0 SKIP.

| Test | Result |
|---|---|
| Real HTTP SDK client discovers eight tools, exercises all eight operations, rejects invalid input and outside reads | PASS |
| Create/list/read/replace/info/search/delete filesystem behavior | PASS |
| Reject traversal, absolute paths, Windows drive/UNC paths and aliases | PASS |
| Reject symlink escape for read/write/delete; skip links in recursive search | PASS |
| Protect root/directories, reject accidental overwrite and ambiguous replacement | PASS |
| Enforce byte limits and reject NUL-containing binary reads | PASS |
| Report search truncation and skipped binary files | PASS |

The HTTP test includes a 200 KB write to verify request parsing beyond the default Express body limit. It also checks `/health`, the expected GET `/mcp` 405, and rejection of an unapproved Origin header. Tests use temporary workspaces and do not modify the sample task files.

## Verification boundaries

Windows execution, GitHub Actions, the Inspector UI, PM2 restart behavior, public ngrok access, and Claude Desktop conversations were not tested here. Their procedures are documented separately. Local HTTP SDK testing does not establish that external deployment has been completed.
