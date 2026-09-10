# Live demo notes

For the Abnahme. Written from the code and from the backend's own
`docs/admin-api.md`, so every claim here is checkable rather than remembered.

Three sections: [what not to touch](#1-do-not-touch), [the order to walk
it](#3-the-order), and [what to say when something is deliberately missing](#4-questions-that-will-come).

---

## 1. Do not touch

### The catalogue's **Active** switch

**Safe to demonstrate in both directions, since 2026-09-10.** This section previously
said the opposite, and if you have read it before, read it again.

The panel reads `GET /data/lectures/all` and `GET /data/professor/all`, which return
every record, active or not, and filters on screen with an **All / Active / Inactive**
select in the filter bar. Switching a record off takes it out of the default view, as
the form warns; the **Inactive** filter finds it again and the same switch puts it
back.

**Walked end to end against the deployed instance on 2026-09-10**, on one lecture
(`Deep Learning and Neural Networks`) and one professor (`Tamim Asfour`): deactivate,
confirm it leaves the Active list, find it under Inactive, reactivate, confirm it is
back. Both records were returned to their original state.

**A good thing to show, and a good thing to say why.** The switch used to be a
one-way door — the panel read the public, active-only endpoints, so a deactivated
record was unreachable from every screen and had to be restored with a database
write. That was `F-006`, and it was closed by moving to two endpoints the backend had
already written for exactly this reason:

> The backend serves `/data/lectures/all` and `/data/professor/all` — the controller
> says it added them so a deactivated lecture or professor stays reachable from the
> panel to correct or reactivate. We read those now, and filter in the browser, so
> the default view still shows only active records and nothing is stranded.

If you have a moment, deactivating and reactivating one record is a better
demonstration than either half alone, because the round trip is the thing that was
missing.


### The login rate limit

**3 attempts per email address and 20 per source IP, in a 15-minute window.** The
code itself is six characters, single-use, and **expires after five minutes**.

Consequences for a rehearsal:

- Do not practise the login flow more than twice on the demo address in the
  quarter hour before the demo. The third failure locks it for the demo itself.
- Rehearse on a **different** admin address if you need to.
- If a code is more than five minutes old, request a new one rather than typing it
  and explaining the failure.
- A rate-limited request answers `429` with `Retry-After`, and the panel shows
  `CODE_RATE_LIMITED_ERROR` rather than a raw status. That is correct behaviour,
  but it is not what you want on screen.

**Have the mailbox already open on the demo machine**, signed in, before you start.

### Anything on your own account

Self-protection is unconditional: nobody blocks, deletes or demotes themselves. The
controls are not rendered on your own profile, so clicking for them looks like a
missing feature. Demonstrate moderation on a **student** account.

---

## 2. Expected behaviour that looks like a bug

Have the answer ready for each of these, because they will be seen.

| What is seen | Why it is correct |
| --- | --- |
| **No "Create issue" button** on a bug report | `gitlabEnabled` is `false`, so the control is not rendered at all (`BugReportIssueControl`). Offering a button that can only answer `503` is worse than not offering one. If an issue already exists, the link to it is still shown. |
| **No System Status screen**, though the endpoint is documented | Removed on purpose: if the backend is down the panel is unreachable too. The endpoint stays because the dashboard's counters come from it. [ADR 0003](../adr/0003-remove-the-system-status-screen.md). |
| **No Activity Log screen** | Deleted rather than merged with the audit log; the backend endpoints are untouched. [ADR 0002](../adr/0002-delete-the-activity-log-screen.md). |
| **The elevated operator looks exactly like any other admin** | By design — no badge, no label, no role. [ADR 0004](../adr/0004-elevated-operator-is-behaviour-not-a-role.md). |
| **Two dashboard cards are missing** (total bug reports, blocked accounts) | The counters do not exist on `/system/status`. `F1` and `F2` in [backend-tasks.md](../backend-tasks.md). Showing a derived number that would be wrong is the alternative. |
| **A professor with no ratings shows `—`, not `0.0`** | `averageRating 0` with `ratingCount 0` means "not rated", not "rated zero". |
| **"Undo this change" is greyed out** on some audit entries | Only field edits inside a 7-day window are revertible, and only if the value has not changed since. The entry says which of the five reasons applies. |
| **The Bug Reports History tab shows a filing date, not a closing date** | A bug report carries `reportedAt` only; there is no `statusChangedAt`. The subtitle says so rather than letting one pass for the other. `F3`. |

---

## 3. The order

Walk it as one case across several screens — that is what the panel is built for,
and it demonstrates the audit log without a detour.

### Before you start

- [ ] Signed in, on the dashboard, **before** the audience is watching. Do the login
      demo as a deliberate sign-out-and-back-in later, not as the first thing.
- [ ] Mailbox open in a second window.
- [ ] Browser at a normal zoom — the tables assume roughly 1100px of width.
- [ ] One student account you are willing to warn and block. **Not** an admin, and
      not yours.
- [ ] One comment with a report against it, status `OPEN`.
- [ ] One bug report with status `OPEN`.
- [ ] A lecture with at least one rating, so the Ratings tab is not empty.

### The walk

| # | Screen | What to do | What it shows |
| --- | --- | --- | --- |
| 1 | **Dashboard** | Land. Point at the counters and the "last updated" line. | Live data, and that the timestamp only moves when *both* reads succeeded — it never vouches for numbers that did not arrive. |
| 2 | **Users** | Search a name. Apply a status filter. Press **Load more**. | Server-side search and cursor paging — note that the list **appends**. |
| 3 | **Users → profile** | Open a student. Edit the biography. Save. | Only the changed field is sent; the list re-reads. |
| 4 | **Users → profile** | Warn the same student. Then block them. | The confirmation dialog names the account and says what cannot be undone. |
| 5 | **Comments** | Open the Reports tab. Set the report to **Action Taken**. Switch to the Content tab. | The reported comment is now hidden. Set the report back to **Reviewed** and it is restored — one status hides, every other restores. |
| 6 | **Bug Reports** | Open a report. Change severity and status. | It moves to the History tab. |
| 7 | **Audit Logs** | Filter by actor = you. Open the biography edit from step 3. | Who, what, which record, and the before/after values. |
| 8 | **Audit Logs** | Press **Undo this change** on that entry. | The field goes back, the log is re-read, and **the reversal's own entry appears** — that last part is the one worth pausing on. |
| 9 | **Help** | Open one section. | Every screen is documented in the panel itself. |
| 10 | **Sign out**, then visit `/users` directly. | You land on login; sign in; you arrive at `/users`, not the dashboard. | The attempted path travels in `state.from`. |

Steps 3 → 7 → 8 are the spine. If time is cut, cut steps 2, 6 and 9.

### If a screen is empty

An empty list is a legitimate state and each one has its own copy, but it makes a
poor demo. If the seeded data is not there, **say what the screen would show and
move on** — do not start creating records live, where a failed write becomes the
demonstration.

---

## 4. Questions that will come

Short answers. The long ones are in [`docs/adr/`](../adr/), and citing the record
by number is a better answer than improvising.

**"Why is the admin email list in the frontend?"**
It decides who is offered a login code, nothing more. The backend validates the
token and requires an `admins` row on every protected endpoint, and answers `403`
regardless of what the panel believes — deleting the list would change the error
messages and change no permission. The cost is accepted knowingly: six KIT
addresses are readable in the bundle. The alternative, an endpoint answering "may
this address sign in?" to an unauthenticated caller, is an address oracle over all
of KIT. [ADR 0010](../adr/0010-admin-email-list-in-the-bundle.md).

**"The session is in `localStorage` — isn't that an XSS risk?"**
Yes, and that is the honest answer: script on this origin can read it, and it is a
live admin session. An `httpOnly` cookie is the only thing that removes it, and it
needs a CSRF story the backend does not have — so it is a joint change, not a
frontend refactor. What is done here: no `dangerouslySetInnerHTML`, `innerHTML` or
`eval` anywhere in `src/`; the stored session is `zod`-validated on read; a `401`
clears it. What is not done and is on file: there is no Content-Security-Policy.
[ADR 0011](../adr/0011-session-in-browser-storage.md).

**"How do you know the refactor didn't break anything?"**
The page tests. The audit log's nine, the catalogue's twelve and the feedback
page's eleven passed **unchanged** through their migrations, including the awkward
ones — that "Load more" appends rather than replaces, and that a change the backend
accepted is reported as saved even when the re-read afterwards fails.

**"What is not tested?"**
Say it plainly, because the documents do: **no page test touches HTTP.** The
integration tests replace the service module, so what a screen *sends* is asserted
only in service unit tests. That is the gap `P1` and `P2` in
[`docs/TODO.md`](../TODO.md) exist to close, and it is the gap that let `F-002`
ship. Section 2 of [`docs/testplan.md`](../testplan.md) has the numbers.

**"Why two log screens became one."**
[ADR 0002](../adr/0002-delete-the-activity-log-screen.md). They were near clones —
1187 duplicated lines — and the second answered a question nobody was asking. The
backend endpoints are untouched, and the backend team was told as a notice rather
than a request.

**"Is the elevated operator verified?"**
No, and it is recorded as not verified: `F-001`, open. The backend reports
`isSuperAdmin`, the panel reads it, and the round trip against real admin accounts
has not been run. A scenario that was not run is written down as not run.
