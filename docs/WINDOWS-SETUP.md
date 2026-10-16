# Complete Windows setup

## 1. Install programs

Install Node.js LTS (22+), VS Code, Git and Claude Desktop. Create GitHub and ngrok accounts. Verify `node --version`, `npm --version`, and `git --version` in Command Prompt. Reopen your terminal after installation.

## 2. Open the repository

Extract the ZIP into Documents. Open the folder containing `package.json` in VS Code. Select Terminal → New Terminal → Command Prompt. All following commands run in that folder. Do not paste Markdown backticks into the terminal.

## 3. Install, configure and check

```bat
npm ci
copy .env.example .env
npm run check
```

Run commands individually. A passing check finishes without errors. Tests use temporary folders and do not alter the submitted sample workspace. Keep `.env` private; commit `.env.example`.

## 4. Run locally

```bat
npm run dev
```

Visit `http://127.0.0.1:3000/health`; expect status ok. In another terminal run `npx @modelcontextprotocol/inspector`. Choose Streamable HTTP, connect to `http://127.0.0.1:3000/mcp`, and list tools. Follow Inspector's displayed proxy/token instructions.

Test all eight tools using `docs/tools.md`. Stop the development server with Ctrl+C before starting PM2 on the same port.

## 5. Start the process manager

```bat
npm install -g pm2
npm run build
pm2 start ecosystem.config.cjs
pm2 status
```

Expect `mcp-workspace-server` to be online. `pm2 logs mcp-workspace-server` shows startup and tool success/error summaries. Press Ctrl+C to leave the log viewer; this does not stop the managed server.

After source changes, build again and run `pm2 restart mcp-workspace-server`. To stop it, run `pm2 stop mcp-workspace-server`.

PM2 restarts the server if it crashes while PM2 is active. Reboot persistence on Windows requires separate setup. Do not claim it is configured automatically. 

## 6. Start HTTPS exposure

Install ngrok using your dashboard's Windows instructions. Run its account authentication command locally. Never commit your account token.

```bat
ngrok http http://127.0.0.1:3000 --host-header=rewrite
```

The rewrite keeps the forwarded Host header compatible with local host validation. Copy the displayed HTTPS forwarding address. First check `https://YOUR-DOMAIN/health`, then connect Inspector to `https://YOUR-DOMAIN/mcp`.

Keep the tunnel terminal and PM2 running. This server has no caller authentication: use only the supplied sample files. The ngrok account token is not protection against people calling the public endpoint. Stop the tunnel with Ctrl+C after use. Update Claude if the public address changes.

The tunnel is a separate process. PM2 currently manages the server only. Document when/how you start the tunnel rather than claiming both are managed.

## 7. Connect Claude Desktop

Open Settings → Connectors → Add custom connector. Name it `MCP Workspace Server` and supply your HTTPS URL ending in `/mcp`. Complete the connection. If an authentication option is offered, match the server's no-auth configuration. Team/Enterprise account policy may require an owner to add custom connectors.

Start a conversation and enable the connector using the conversation's tools menu if needed. Ask: "Use the MCP Workspace Server connector to list the workspace files, then read PROJECT_STATE.md."

Verify actual tool calls. Claude's remote connector reaches the server from Anthropic infrastructure, so localhost alone will not work. No local JSON configuration is required for this remote connector route.

## 8. Understand session continuity

SESSION-TASK.md describes how a fresh conversation recovers progress from the saved documents. Session recording is not part of this documentation package.

## 9. Upload to GitHub

Create an empty GitHub repository named `mcp-workspace-server` without a generated README. In your project terminal:

```bat
git init
git add .
git status
git commit -m "Create standalone MCP file server"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mcp-workspace-server.git
git push -u origin main
```

Replace YOUR_USERNAME. Complete GitHub's sign-in prompt. If Git requests your author identity, set your own name/email using `git config user.name "Your Name"` and `git config user.email "your-email"`, then retry the commit. Do not use someone else's identity.

Confirm `.env` and node_modules are not uploaded. The generated `dist` directory is intentionally ignored; the grader runs the build command.

## 10. Final check

Have another group member clone the repository and follow README.md from the beginning. Submit the GitHub link according to your course instructions; do not submit credentials.

## Troubleshooting

- `node`/`npm` not recognized: reopen your terminal and check installation.
- `EADDRINUSE`: stop the development server before PM2, or inspect which process owns port 3000.
- `/mcp` returns 405 in browser: expected for a normal GET; use Inspector or `/health`.
- Claude cannot connect: check PM2, tunnel, current public URL and `/health`; inspect PM2 logs.
- Host validation rejects tunnel: use the documented `--host-header=rewrite` command.
- File parent not found: create the needed folder in workspace locally. `write_file` does not create folders.
- File already exists: use `overwrite:true` only when replacing it intentionally.
- Connector missing in Claude: check your app/account settings and organization policy.
