# Forum Admin Smoke Test

## Goal

Verify that the repaired forum admin flow is not only visible, but functionally usable before merging into `main`.

Preview target:

- `codex-forum-auth-fix`
- `/forum/new`
- `/forum/admin`

## Login Flow

1. Open `/forum/new`
2. Enter a nickname and complete guest login
3. Confirm the navbar shows the current forum identity
4. Open `/forum/admin`
5. Enter the admin password
6. Confirm the admin backend loads successfully

Expected result:

- admin page is visible
- admin identity badge is visible
- no redirect loop
- no blank state caused by missing auth

## Topic Management

Test on one disposable thread first.

### Pin

1. Click `設為置頂`
2. Confirm success feedback appears
3. Refresh the page
4. Confirm the thread still shows as pinned

Expected result:

- UI state changes
- refresh preserves state

### Lock

1. Click `鎖定主題`
2. Confirm success feedback appears
3. Refresh the page
4. Confirm the thread still shows as locked

Expected result:

- UI state changes
- refresh preserves state

### Delete

1. Click `刪除`
2. Confirm the delete prompt
3. Confirm deletion
4. Refresh the page
5. Confirm the thread no longer appears

Expected result:

- item disappears from the list
- refresh does not bring it back

## Post Management

If a thread contains replies:

1. Open `留言管理`
2. Delete one disposable reply
3. Refresh the page
4. Confirm the reply stays deleted

Expected result:

- reply disappears
- state persists after refresh

## Failure Handling

1. Enter a wrong admin password
2. Confirm a visible error appears
3. Retry with the correct password
4. Confirm the page still recovers correctly

Expected result:

- wrong password does not grant access
- correct password still works afterwards

## Merge Gate

Ready to merge into `main` only if all conditions below are true:

1. guest login works
2. admin verification works
3. pin works and persists
4. lock works and persists
5. delete works and persists
6. no obvious console/runtime breakage appears during the flow

## Notes

If any action appears to succeed in the UI but does not persist after refresh, the next fix target is the Supabase schema or policy layer rather than the frontend state layer.
