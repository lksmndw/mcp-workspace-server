module.exports = {
  apps: [{
    name: "mcp-workspace-server",
    script: "./dist/server.js",
    cwd: __dirname,
    autorestart: true,
    max_memory_restart: "250M",
    env: { NODE_ENV: "production" }
  }]
};
