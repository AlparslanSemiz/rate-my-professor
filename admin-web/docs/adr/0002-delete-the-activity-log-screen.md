# 0002 — The Activity Log screen is deleted, not merged into the audit log

**Status:** Superseded by [0016](0016-the-activity-log-screen-returns.md)
**Date:** 2026-09-09

## Decision

`src/features/activity-logs/` and its four services are removed from the panel.
The backend endpoints are untouched and keep being written to.

## Context

The panel had two log screens. `audit-logs` and `activity-logs` were near clones:
the same hook shape, the same table, the same filter bar, the same row and the same
details layout. They differed in their nouns, an icon, some column labels, and the
audit log's extra Revert action. Together they were 14 files, 1187 lines and 11
tests.

They read two halves of what is, on the backend, **one log table** separated by
`actor.type` — administrative actions on one side, what students did in the app on
the other.

## Alternatives considered

**Merge them into one screen with an actor-type filter.** The obvious move, and the
one the shared table invites. Rejected: the two halves are not read for the same
reason. An operator opens the audit log to answer "who changed this record, and can
I put it back"; the activity log answers "what has this student been doing". Merging
them produces a screen where the Revert column is meaningful for a minority of rows
and blank for the rest, and where the default view is dominated by login events.

**Keep both and factor out the duplication.** Rejected because it optimises the wrong
thing. The 1187 duplicated lines were the *symptom*; the cost was two screens to
keep true as the backend's vocabulary changed, for one of which nobody had a
question.

**Keep the screen, ask the backend to delete the endpoints.** Rejected outright, and
explicitly: the endpoints are the record of what students did, the Android client may
want them, and a panel that stopped reading them is no argument for removing them.

## Rationale

The duplicate was deleted rather than merged because **nobody was using the second
screen to answer anything**. Merging would have preserved a question that was not
being asked, at the cost of making the question that *was* being asked harder to
answer.

The domain vocabulary was pruned with care rather than by grep. `ACTIVITY_ACTIONS`
and the `ActivityAction` type went, because with one log left `LogAction` is simply
the administrative set. But `LOG_TARGET_TYPES` and `LOG_ACTOR_TYPES` were **kept
whole**, including `USER`, `USER_SESSION` and `ENDPOINT` — they mirror what
`/audit-logs/meta` may return, and the panel renders what the backend gives it
rather than narrowing the backend's vocabulary to its own.

## Consequences

**A screen an operator could use is gone.** That is the cost, stated plainly.

**The backend team was told, as a notice rather than a request.** It is `H1` in
`docs/backend-tasks.md`, worded so that nobody deletes a working endpoint on the
strength of this. The endpoints still serve, still record, and `/audit-logs/meta`
may still report actor type `USER` and target types like `USER_SESSION` — the panel
keeps accepting all of them.

**`/activity-logs` falls through to the dashboard** like any other unknown path,
and a test pins that, mirroring the one already there for `/system-status`
([0003](0003-remove-the-system-status-screen.md)).

**Restoring it means writing it again.** Accepted: the audit log is the reference
implementation, so the cost is a copy, not a design.

## Sources

`CHANGELOG.md` — "Removed — the Activity Log screen"; `docs/backend-tasks.md` §H1.
