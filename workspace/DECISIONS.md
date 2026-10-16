# Decisions

## Standalone sample
Use a generic task list so this MCP project is independent of other applications.

## Input format
Use JSON with id, title, and status. Allowed statuses are pending, in_progress, and done.

## Continuity
Agents read all four handoff files first and update them before stopping.
