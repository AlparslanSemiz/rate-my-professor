# 0006 — Long lists page on an opaque cursor, not on an offset

**Status:** Accepted
**Date:** 2026-09-09 *(recorded; the decision predates this folder and is
reconstructed from the code, `CHANGELOG.md` and the backend contract)*

## Decision

Users, ratings and the audit log page with `limit` plus an opaque `cursor`, and
append. The panel treats `nextCursor` as a token it does not interpret. `limit`,
`cursor`, `nextCursor`, `q`, `status`, `role` and `sort` are the parameter
vocabulary and do not change.

## Context

The backend pages these lists with stable keyset ordering — the audit log by
`(createdAt DESC, id DESC)` — and hands back an opaque `nextCursor`. It **rejects a
cursor sent without a limit**, with the message `A cursor requires a limit`.

## Alternatives considered

**Offset paging (`page` / `pageSize`).** Rejected because these lists change under
the reader. The audit log gains rows as the operator works, and a moderation action
taken on page 1 shifts everything after it — with an offset, page 2 either repeats a
row or skips one. Keyset ordering does not have that failure.

**Numbered pages in the UI over a cursor transport.** Rejected as not
expressible: a cursor gives you "the next page", not "page 7", and faking the
numbers means holding every cursor seen so far and still being unable to jump.

**Load everything and page in the browser.** Rejected on the audit log, which grows
without bound. It is what the catalogue does, deliberately — those lists are small
and bounded, and their search is an in-memory `Array.filter`.

## Rationale

The contract is the backend's, and the panel follows it rather than adapting it.
Two consequences of that were expensive to learn and are now pinned by tests:

**The first page is fetched with one argument.** The service has two signatures
because the backend refuses a cursor with no limit, so the `queryFn` branches on the
page parameter rather than passing an explicit `undefined`.

**`placeholderData: keepPreviousData` is mandatory.** Without it the rows vanish
while a new filter runs — and a *refused* filter would leave the operator with an
empty page, when the whole point of a `400` like `Invalid user status` is to be read
next to the list it failed to change.

## Consequences

**"Load more", not page numbers.** There is no jump-to-page and there will not be
one.

**Appending is the behaviour most worth guarding**, and every migration of a cursor
list kept a test asserting that a second page *appends* rather than replaces.

**A table only needs to know whether there is more.** `AuditLogsTable` and
`RatingsTable` originally took `nextCursor` and used it solely to ask that question;
both take `hasMore` now. The cursor is the hook's business.

**Re-applying an unchanged filter had to be handled explicitly.** Keying the list on
its filters meant that pressing *Apply filters* without changing anything produced no
request at all — the query key was identical. Re-applying is still a read the
operator asked for, so both list hooks refetch in that case.

**Total counts do not come from these lists.** With the users table paginated, a
blocked-account count cannot be computed on screen; it is asked of `/system/status`
instead, and is `F2` in `docs/backend-tasks.md` until it exists.

## Sources

`CHANGELOG.md` — refactor steps 5 and 6; `README.md` §Audit Log Design; the backend
repository's `docs/admin-api.md` §Audit.
