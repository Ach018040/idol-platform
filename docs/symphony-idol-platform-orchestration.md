# Symphony to idol-platform Agent Orchestration

## What Symphony Contributes

Symphony frames an issue tracker as the control plane for coding agents. Each open task gets a dedicated workspace, a run loop, retry/reconciliation rules, and a proof-of-work handoff packet.

For idol-platform, the immediate value is not a full daemon. The useful v5.1 step is a lightweight orchestration layer for platform work:

- Work items with explicit state
- Agent role assignment
- Isolated workspace naming
- Success criteria
- Proof-of-work requirements
- Human review handoff

## idol-platform Mapping

| Symphony concept | idol-platform adaptation |
| --- | --- |
| Issue tracker | `/orchestration` work board |
| Isolated workspace | `workspaces/{work_item_id}` naming convention |
| Agent run | `agent_runs` row / local MVP run packet |
| Workflow states | `backlog`, `ready`, `running`, `human-review`, `done`, `blocked` |
| Proof of work | typecheck, build, smoke test, screenshots, deployment status |
| Handoff | Human Review before merge/deploy |

## MVP Scope

- Frontend route: `/orchestration`
- Static work items for current idol-platform v5 work
- Local run history using `localStorage`
- Supabase schema in `011_agent_orchestration.sql`

## Not Yet Included

- Real Codex App Server session spawning
- Linear/GitHub issue polling
- Automatic branch/worktree creation
- CI log reconciliation
- Automatic PR creation or merge

## Suggested Upgrade Path

1. Add `/api/orchestration/work-items`.
2. Persist local run packets into `agent_runs`.
3. Connect GitHub Issues or Linear as the tracker.
4. Add runner adapter for Codex App Server.
5. Require proof-of-work before a run can move to `done`.
