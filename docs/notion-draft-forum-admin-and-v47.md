# Notion Draft

## Page 1

Title:

`Forum Admin Repair Spec`

### Objective

Restore a usable forum admin workflow for Idol Platform so that a moderator or admin can:

- enter the admin backend
- manage topics and replies
- verify actions through preview before production rollout

### Current Problem

- forum login is nickname-based rather than full account auth
- the old admin flow depended on missing or incompatible profile persistence
- admin UI visibility and admin action execution were broken
- some Supabase schema and RLS assumptions still target `auth.users`, which does not match the current guest-token runtime

### Scope

- repair guest login to forum identity flow
- repair admin verification flow
- route admin actions through server APIs
- align Supabase schema and policies with current runtime
- define smoke-test gates for merge into `main`

### Non-goals

- full Supabase Auth migration
- production-grade RBAC redesign
- replacing nickname login with email/password in this phase

### Implementation Notes

- branch: `codex-forum-auth-fix`
- recent commits:
  - `1e80200`
  - `5d115a4`
  - `ad87e83`
- new API routes:
  - `/api/forum/admin/login`
  - `/api/forum/admin/moderate`
- schema alignment migration:
  - `supabase/migrations/004_forum_runtime_alignment.sql`

### Acceptance Criteria

- `/forum/new` allows guest nickname login
- `/forum/admin` accepts admin verification and loads backend
- topic actions use server-side admin API instead of direct client-side Supabase writes
- pin, lock, and delete can be smoke-tested in preview
- schema notes are documented for follow-up rollout

### Risks

- legacy `user_profiles` shape may still differ across environments
- some operations may appear successful in preview while production schema lags behind
- permissive policies in this phase are transitional and should be tightened in a future auth cleanup

### QA Checklist

1. guest login works
2. admin password validation works
3. pin persists after refresh
4. lock persists after refresh
5. delete persists after refresh
6. no blank auth state returns after reloading admin page

## Page 2

Title:

`v4-7 Recommendation and Homepage Merge Spec`

### Objective

Prepare the v4-7 workstream for merge into `main` by restoring homepage quality, making recommendation flow usable, and ensuring the new deterministic ranking formula is represented in UI and generated data.

### Current Problem

- homepage and feature pages contained damaged Traditional Chinese copy
- recommendation flow was partially wired and not fully trustworthy
- ranking data formula changed, but output and UX explanation needed alignment

### Scope

- restore homepage rich layout
- clean Traditional Chinese copy
- wire recommendation UI to `/api/recommendations`
- regenerate ranking JSON with deterministic formula
- produce a clean merge-ready preview

### Non-goals

- full cloud-auth rollout
- full Supabase persistence for favorites
- final recommendation algorithm expansion beyond MVP

### Working Branch

- `fix/vercel-activity`

### Current Local Work

- homepage updates
- recommendation API route
- account / favorites / recommendation page copy cleanup
- formula v2 explanation
- ranking pipeline updates

### Acceptance Criteria

- homepage is readable and visually complete
- recommendation page uses actual recommendation API flow
- generated ranking JSON reflects formula v2
- production build passes
- preview is reviewed before merge

### Initial Ticket Split

1. Clean v4-7 Traditional Chinese copy
2. Restore homepage rich layout
3. Wire recommendation page to recommendation API
4. Regenerate ranking JSON with formula v2
5. Review preview and merge
