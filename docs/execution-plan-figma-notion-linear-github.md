# Idol Platform Execution Plan

## Purpose

This document is the working source of truth for cross-tool execution until Notion connectivity is stable again.

It maps the current project into a delivery flow across:

- Figma for UI and state design
- Notion for product/spec documentation
- Linear for execution tracking
- GitHub for implementation, review, and deployment

## Current Streams

### Stream A: Production Stabilization

Goal:

- Make forum login, admin backend, and deployment behavior stable enough for production rollout.

Current implementation branch:

- `codex-forum-auth-fix`

Recent commits:

- `1e80200` `fix: restore forum admin flow and refresh rankings`
- `5d115a4` `fix: allow forum admin fallback access`
- `ad87e83` `fix: route forum admin actions through server api`

Known remaining risks:

- Supabase `user_profiles` schema and RLS do not fully match the current nickname-based forum flow.
- Admin backend can now be entered, but some data-layer behaviors may still depend on legacy schema constraints.

### Stream B: v4-7 Merge Readiness

Goal:

- Prepare homepage, recommendation flow, copy cleanup, and formula explanation for merge into `main`.

Current working branch:

- `fix/vercel-activity`

Known local changes:

- homepage restoration
- recommendation API flow
- Traditional Chinese copy cleanup
- deterministic ranking formula updates

## Tool Responsibilities

### Figma

Use Figma only for visual and interaction states.

Required frames:

1. `Homepage v2`
2. `Recommendation MVP`
3. `Forum Admin Flow`

Each frame set must include:

- default state
- loading state
- empty state
- success state
- error state

For forum admin specifically, include:

1. guest nickname login
2. admin password verification
3. admin dashboard
4. action success toast
5. action failure toast

### Notion

Use Notion as the long-form product and engineering specification system.

Recommended databases:

1. `Epics`
2. `Specs`
3. `Decision Log`

Each spec should include:

- Objective
- Scope
- Non-goals
- API / schema impact
- Acceptance criteria
- Linked Figma
- Linked Linear
- Linked GitHub PR

Priority specs to create first:

1. `Forum Admin Repair Spec`
2. `v4-7 Recommendation and Homepage Merge Spec`

### Linear

Use Linear as the execution layer.

Recommended projects:

1. `Production Stabilization`
2. `v4-7 Merge Readiness`

Recommended labels:

- `frontend`
- `api`
- `data`
- `deploy`
- `schema`
- `blocked`

Ticket sizing rule:

- each ticket should fit within roughly 0.5 to 1.5 days of work

### GitHub

Use GitHub for code delivery only.

Rules:

1. one Linear issue per branch when practical
2. one clear PR per deliverable slice
3. every PR includes preview link and acceptance checklist

Recommended branch naming:

- `fix/forum-admin-session`
- `fix/forum-admin-actions`
- `fix/forum-schema-alignment`
- `feat/recommendation-api-flow`
- `feat/homepage-v2-copy`

## Execution Order

### Phase 1: Stabilize Production

1. Validate forum admin entry
2. Validate admin actions against live preview
3. Align Supabase schema and permission model with current forum APIs
4. Merge `codex-forum-auth-fix` into `main`
5. Deploy production and run smoke verification

Definition of done:

- `/forum/new` login works
- `/forum/admin` grants admin access after password verification
- admin actions execute through server API
- production preview and production deployment both pass

### Phase 2: Prepare v4-7 Merge

1. clean Traditional Chinese copy
2. finalize homepage rich layout
3. route recommendation UI through `/api/recommendations`
4. verify deterministic ranking formula output
5. produce preview for review
6. merge into `main`

Definition of done:

- homepage content is readable and complete
- recommendation flow is no longer a shallow string filter only
- build passes locally and on Vercel
- preview is reviewed before merge

### Phase 3: Productize Workflow

1. sync this execution plan into Notion
2. create Linear projects and tickets
3. link Figma frames to specs
4. link specs to PRs and previews

Definition of done:

- product, design, execution, and implementation have traceable links

## Initial Ticket Breakdown

### Production Stabilization

1. `Fix forum admin session persistence`
2. `Fix forum admin action authorization`
3. `Align forum user_profiles schema with runtime API`
4. `Smoke test forum admin preview and production`

### v4-7 Merge Readiness

1. `Clean v4-7 Traditional Chinese copy`
2. `Restore homepage rich layout`
3. `Wire recommendation page to recommendation API`
4. `Regenerate ranking JSON with formula v2`
5. `Review preview and merge v4-7`

## Handoff Notes

### Immediate Next Step

Validate the latest forum-admin preview on `codex-forum-auth-fix`, specifically:

1. guest login
2. admin verification
3. pin thread
4. lock thread
5. delete action response

### After Notion Is Back

Create two specs from this document:

1. `Forum Admin Repair Spec`
2. `v4-7 Recommendation and Homepage Merge Spec`

### After Linear Is Available

Create the two projects and the initial ticket breakdown exactly as listed above.
