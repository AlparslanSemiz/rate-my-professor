# 0003 — The System Status *screen* is removed; the endpoint stays

**Status:** Accepted
**Date:** 2026-08-21

## Decision

There is no System Status page. `GET /system/status` is still called, by the
dashboard, for its record counts and its newest audit event.

## Context

The panel had a screen devoted to backend health: `status` (`OK`, `DEGRADED`,
`DOWN`), the database readiness check, live record counts and the most recent
audit event.

## Alternatives considered

**Keep the screen.** Rejected on the argument that decides this: **if the backend
is down, the panel cannot be reached either.** The panel is served by the same
host. A page whose job is to say "the backend is unreachable" answers a question
nobody in a position to read it can ask.

**Keep it as a degraded-mode screen** — reachable when the API is failing but the
static assets still serve. Rejected as a real but narrow window: the database can
fail while the API serves, which is exactly the `DEGRADED` case, and the dashboard
already reports that where the operator is already looking.

**Remove the endpoint too.** Rejected: the dashboard's counters come from it, and
counting users by paging the whole `/users` table on a timer would be worse in
every way.

## Rationale

The endpoint and the screen were solving different problems, and only one of them
was real. The status *value* matters — it is how the dashboard knows a successful
read with no counters is `DEGRADED` rather than empty. The status *page* only
mattered in the scenario where it could not be loaded.

## Consequences

**`/system-status` falls through to the dashboard**, pinned by a test in
`src/App.integration.test.tsx`. The same pattern was later reused for the Activity
Log ([0002](0002-delete-the-activity-log-screen.md)).

**`SystemStatusService` stays, tested and used.** A reader looking for the screen
that must go with it will not find one; this record is where they find out why.

**`counts: null` is handled explicitly and shows "no data", never `0`.** A
dashboard quietly rendering zeros claims nobody has signed up. That rule outlived
the screen and has its own test.

**Two counters the dashboard would like are still missing** — a total bug-report
count and a blocked-account count. They are `F1` and `F2` in
`docs/backend-tasks.md`, and the affected cards are not shown rather than shown
with a derived number that would be wrong.

## Sources

`README.md` §System status, which carries this reasoning verbatim; commits
`b60f691` and `9029551`.
