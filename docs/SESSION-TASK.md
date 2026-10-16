# Session handoff workflow: a standalone task checklist

This exercise uses only a generic task list. It does not depend on any other project. Two separate Claude conversations act as Agent A and Agent B.

## Before starting

Connect the server and enable the connector in Claude. Keep the initial handoff documents. The supplied demo/tasks.json contains three sample tasks. Expected final counts: 1 done, 1 in_progress, 1 pending.

## Session 1 prompt

> Use the MCP Workspace Server connector for all project file operations. Read PROJECT_STATE.md, PLAN_LOG.md, CHECKPOINTS.md, DECISIONS.md, demo/requirements.md and demo/tasks.json. Create demo/task-notes.md explaining the JSON fields and how the final summary should be organized. Do not create the final summary yet. Update all four handoff documents with completed work, remaining work, relevant paths, and the exact next step. Record only checks you actually performed.

The first conversation leaves notes and updated handoff files for a later conversation.

## Session 2 prompt (new conversation)

> Continue the task using the MCP Workspace Server connector. First read PROJECT_STATE.md, PLAN_LOG.md, CHECKPOINTS.md and DECISIONS.md to recover progress. Read any relevant files they identify. Complete the unfinished task by creating demo/task-summary.md with counts by status, task titles grouped by status, and remaining actions. Verify each count against the JSON and update all four handoff documents. Do not claim to execute programs; this server exposes file tools only.

## Expected verification

| Status | Count | Task |
|---|---:|---|
| done | 1 | Write project outline |
| in_progress | 1 | Review reference notes |
| pending | 1 | Prepare final checklist |

The second conversation recovers context from the saved files. These prompts describe the intended workflow; they are not a record of executed Claude sessions.
