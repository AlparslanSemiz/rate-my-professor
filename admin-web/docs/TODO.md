# TODO

## Notebook

<!--
  Alparslan's space. Agents: never edit, reorder, summarise or delete anything in
  this section. Write your own entries under "Blocking" or "Follow-up" below.
-->
DESING.md oluşturalım.
diğer pc'den docsları alalım.
gitlabte ya da orada burada benim yapmam gereken şeyler de dokümente edilsin.
_Empty._

---


Open work. What already shipped is in [CHANGELOG.md](../CHANGELOG.md); *why* it is
built this way is in [docs/adr/](adr/).

Three lists, kept separate on purpose: **[done](#done)**, **[handed
over](#handed-over)** and **[deliberately not done](#deliberately-not-done)**. A
thing that is not in one of them is not tracked.

## For the maintainer

Work that needs a person: a browser, GitLab access, the deployed backend, or a
decision. An agent cannot close any of these.

- [ ] **Give me `/v3/api-docs`.** `P1` is the only package blocked on something, and
      this is it. The exact procedure is in [docs/api/README.md](api/README.md); it
      needs a running backend and an admin token, so it cannot be automated. Commit
      the body **unchanged** — no reformatting.
- [ ] **Decide `F-005`: does the panel move to the `/admin` path prefix?** The
      backend serves every admin route under it and will remove the legacy paths
      once we have moved. Today we call the legacy ones exclusively, so the day they
      go the panel stops working entirely. Mechanical to fix, but it is a behaviour
      change and therefore yours. It also unblocks `F-006`.
- [ ] **Verify the elevated operator end to end.** `F-001`, and the one item holding
      a released feature as unverified. See **Blocking**.
- [ ] **Run the manual scenarios.** [testplan.md](testplan.md) §7, E2E-1 … E2E-13.
      None has been executed against the deployed backend. Record each result in
      [testfindings.md](testfindings.md) — a scenario not run is recorded as not run.
- [ ] **Look at the panel after the theme refactor.** 386 replaced colour literals
      are asserted but have never been *seen*. Playwright's Chromium is available on
      this machine, so this is doable rather than blocked — the per-platform cache path
      and the pinned revision are now in [README.md](../README.md#prerequisites), which
      is where somebody setting up will actually look.
- [ ] **Push `hard-refactoring` and open the merge request.** The branch has not
      been pushed.
- [ ] **Paste [wiki.md](../wiki.md) into the GitLab wiki.** It is written to be
      self-contained for exactly this and is kept in step with `README.md`.
- [ ] **Hand [backend-tasks.md](backend-tasks.md) to the backend team.** It now
      carries two notices they need before they act: `H1` (we no longer call
      `/activity-logs`) and `H2` (we have **not** moved to `/admin`, so do not drop
      the legacy paths yet).
- [ ] **Put the coursework material into [docs/coursework/](coursework/).** The
      folder, its README and the demo notes are there; the Kolloquium notes and the
      presentation draft do not exist in this repository. They are the last thing
      missing from a complete delivery.
- [ ] **Decide the two open questions** in **Deliberately not done**: what happens
      to self protection, and whether `metadata.elevated` is surfaced. Both need a
      person's call, not a default.

## Blocking

- [ ] **Verify the elevated operator end to end (`F-001`).** The backend
      counterpart is deployed (`ADMIN_SUPERUSER_EMAILS`, reported as `isSuperAdmin`
      on `/auth/me`) and the panel reads it. Sign in as `unzhz@student.kit.edu`;
      warn, block, unblock and delete a real admin account; edit its status and
      credibility score; confirm the audit log records the action with the right
      actor. Confirm too that the session survives a reload — the `/auth/me` field
      names were wrong until recently, which signed the operator out on every load.
      Scenario E2E-1; record the result as `F-001` in
      [testfindings.md](testfindings.md).

## Known, measured, deliberately deferred

The list to read first. Every item here was **found, reproduced and measured**, and then
left undone on purpose. Each says what it is, how it was measured, why it was not fixed
now, and roughly what fixing it costs — the estimate is the part that makes this a
decision rather than a backlog.

Nothing in this section is a surprise waiting to happen. The surprises are in
[testfindings.md](testfindings.md) until they move here or get fixed.

### Someone believes something untrue

One item is in a class of its own, because the others degrade the panel while this one
**misinforms the operator**.

- [ ] **A `415` on sign-out is swallowed, so the operator believes they signed out while
      the token stays live on the backend.** Severity: **Major — and the only deferred
      item where the panel tells the operator something false.** Everything else here is
      a screen that breaks visibly.

      *What.* `AuthContext.logout` catches every failure from `POST /auth/logout` and
      clears the session locally regardless. The panel then shows the login screen. If
      the backend refused the request — a `415` on the missing `Content-Type`, per
      `F-023` — the token was never revoked and remains valid until it expires on its own.

      *How measured.* Pinned by a test in `bodylessWrites.integration.test.ts` that
      answers `415` and asserts the failure reaches the service, plus the existing
      `AuthContext` test showing local state is cleared either way.

      *Why not fixed.* The catch is deliberate and the reasoning still holds: signing out
      locally is safer than staying signed in when the backend is unreachable. The two
      cases are genuinely indistinguishable from inside `logout` — a refusal and an
      outage both arrive as a rejected promise — so telling them apart means branching on
      the error type and deciding what a half-completed sign-out should look like. That
      is a behaviour decision about a security-adjacent path, and it is not one to take
      on the last day. **Changing it was offered and declined for this round.**

      *Cost.* Roughly half a day: branch on `ApiError.transient` in `logout`, decide the
      wording for "signed out here, but the server did not confirm it", and a manual pass
      against the deployed backend — which is the only place the real behaviour can be
      confirmed.

### Crashes that need a type change

- [ ] **`actor: null` and `author: null` take their whole table down** — `F-022`.

      *What.* `AuditEntry.actor` is declared non-null and read without a guard in four
      places, while `target` — nested identically, in the same interface — is nullable and
      guarded at both of its. `ModeratedItem.author` is the same shape while
      `ratingMapper` and `userWarningMapper` both defend theirs. The asymmetry is the
      sharpest finding in [consumer-findings.md](consumer-findings.md) (C-07).

      *How measured.* Two tests serve a wire payload with the key absent and record what
      happens: the row never arrives at all, because both row components read the name
      into their accessible label and throw before anything is painted. Not a missing cell.

      *Why not fixed.* **The backend has confirmed the actor columns are five `NOT NULL`s**,
      so this is a recorded risk rather than a live defect. The fix is a nullable domain
      type, and `tsc` then names every read site across the audit and moderation features —
      a wide, mechanical change, which is exactly the kind that should not land the day
      before delivery.

      *Cost.* Half a day: two type changes, roughly ten guarded reads, one shared `'—'`
      render so the marker is decided once, and the two tests above inverted from
      "records the crash" to "renders the dash".

### Screens that behave wrongly but visibly

- [ ] **A refused filter empties the users table instead of appearing above it** —
      `F-020`.

      *What.* `UsersPage` renders `tableError` under a comment reading "a refused filter
      is a `400` with a usable message — it belongs on screen, above the rows that are
      still the last good answer". It does not. `tableError` is gated on `hasLoaded`,
      which reads the current query's data; applying a filter changes the query key, so
      there is no data, and the screen falls through to the whole-page `LoadError` with
      the rows discarded.

      *How measured.* Seen in Chromium with a `400` injected on a filtered read, via the
      `?fault=users-filter` hook. Screenshot taken.

      *Why not fixed.* The fix touches the query-key and `hasLoaded` logic that every
      paged table's loading path runs through. Get it wrong and tables come up empty at
      the Abnahme, which is a far worse failure than the one being fixed.

      *Cost.* Half a day, most of it verification: keeping the previous page's data across
      a key change is a TanStack Query option, but every table has to be walked afterwards
      to confirm nothing renders stale rows as though they were current.

- [ ] **Below the `sm` breakpoint the sidebar covers the whole viewport** — `F-019`.

      *What.* `AdminLayout`'s `AppShell` declares a navbar breakpoint with no `collapsed`
      configuration and no burger, so under 768px the navbar takes the full width and
      nothing can close it. No page header, no table, no way back.

      *How measured.* Screenshotted in Chromium at 320px and 768px while checking the
      `A2` alert region. Both widths show the sidebar and nothing else.

      *Why not fixed.* It is a design decision about what the navigation *becomes* on a
      narrow screen — a burger, a drawer, a collapsed rail — not a bug with one right
      answer, so [DESIGN.md](DESIGN.md) §Method applies. The panel is an internal desktop
      tool and nobody has reported it.

      *Cost.* About a day, most of it the design pass rather than the code.

- [ ] **The REASON column truncates every badge to five or six characters** — `F-012`.
      Measured in Chromium; the column's share of a fixed layout lives in `ContentTable`'s
      `COLUMN_WIDTHS`, so widening it moves every other column. Deferred because that is a
      visual change and [DESIGN.md](DESIGN.md) §Method applies. **Cost: two to three hours,
      nearly all of it the visual pass over every column at three widths.**

- [ ] **The Ratings tab shows its empty state while still loading** — `F-011`, and
      **Feedback's page-level error** — `F-010`. Both are loading- and error-state changes.
      `F-010` now has a home: the alert region added for `F-013` is the page-level region
      it was missing. **Cost: two hours together.**


### Crashes on a payload the panel did not expect

Three findings from the resilience layer, in one place because they are one habit: a field is
declared non-optional, so it is read without a guard, and the read happens during render.

- [ ] **An enum value the panel does not know takes the whole screen down** — `F-028`.
      Severity: **Major**, and the likeliest of the three to happen.

      *What.* Fourteen cases across five screens, through three unguarded mechanisms with one
      cause. `enumLabel(value)` calls `value.split('_')` — ten of them, on users `role` and
      `status`, comments `status`, lectures `lectureType`, bug reports `severity`.
      `auditActionColor(log.action)` calls `action.endsWith(…)` at `AuditLogRow.tsx:48` — two.
      And `reportStatusIcon[report.status]` at `ReportQueueItem.tsx:38` is used as a JSX element
      type, so an unknown key yields `undefined` and React raises "Element type is invalid" —
      two. The operator does not get a blank page: `AdminRoutes`' boundary catches it, so the
      sidebar and sign-out survive, but the screen becomes "This page could not be displayed."
      and *Try again* re-renders the same payload and fails again.

      *How measured.* Every field of every list payload removed one at a time, and every scalar
      given the wrong type, against each of six rendered screens
      (`src/features/degradedPayloads.integration.test.tsx`). The three mechanisms were told
      apart by guarding `enumLabel` and watching only ten of the fourteen turn green.

      *Why not fixed.* Not hypothetical and not urgent in the same breath, which is an awkward
      pair to hold: `docs/consumer-findings.md` **C-10** already records that the compiled-in
      audit action list is **three values behind** the backend, so mechanism 2 is a live gap with
      a crash on it — and the fix is a decision about what an unknown enum should *read* as
      (`'—'`, the raw value, or the screen refusing the row), which is a wording decision across
      five screens rather than three `??`s.

      *Cost.* Three hours: one fallback in `enumLabel`, one in `auditActionColor`, one default
      icon, and the wording decision, which is most of it.

- [ ] **Two unguarded `.length` reads** — `F-029`.
      `ContentCell.tsx:28` reads `item.content.length` and `LectureTableRow.tsx:56` reads
      `lecture.professors.length`; a payload without either throws during render. Measured the
      same way as `F-028`. Same family as `F-022`, and it wants the same commit: the guards are
      trivial, the value is doing them once with a shared `'—'` rather than three times with
      three answers. **Cost: one hour, on top of `F-022`'s half day.**

- [ ] **A `204 No Content` throws a `TypeError` in four services** — `F-026`.

      *What.* `ApiResponseParser` returns `undefined` for a 204, and four services read a
      property straight off it: `TokenLoginService.login` (`response.authToken`),
      `AuthSessionService.me` (`response.user`), `UserAccountsService.getById` (via
      `withRequiredAdminRole`, `subject.email`) and `SystemStatusService.getStatus` (via
      `toSystemStatus`, `response.status`). The asymmetry is the part worth keeping:
      `UserAccountsService.list`, three methods above `getById` in the same class, goes through
      `expectArray`, which guards with `?.[key]` and raises a `ContractError`.

      *How measured.* All forty-two endpoints asked (`src/api/responseShapes.integration.test.ts`).
      Thirty-eight either accept an empty answer or raise an `ApiError`; four throw. Pinned by a
      list that goes red in **both** directions — a fifth unguarded read, or one of these four
      being fixed.

      *Why not fixed.* The backend envelopes every endpoint, so a 204 is a recorded risk rather
      than a live defect — the same standing as `F-022`. And each of the four wants a different
      error: a login that returned no token is already a `ContractError`, while a session check
      that returned nothing is closer to "no correction", which is a behaviour decision on the
      session path.

      *Cost.* Two hours: four guards, and deciding what each should raise.

### Accessibility, measured and left

The first accessibility measurements this panel has ever had. `docs/testplan.md` §6.4 called this
"the largest single gap in the suite"; it is measured now. It found four things; the cheapest of
them, `F-030`, **is fixed** — see `CHANGELOG.md`. These three are what is left.

- [ ] **Touch targets under 24x24, everywhere except the one control `A2` measured** — `F-037`.
      Severity: **Major**.

      *What.* `A2` measured `ErrorAlert`'s dismiss button, found 20x20, raised it to 24x24 and
      wrote the WCAG 2.2 SC 2.5.8 rule in a comment above it. The rule was applied to nothing
      else. `Sign out` is **61x21** and lives in the sidebar, so it is on all seven signed-in
      routes; the dashboard's `See everyone →` is **90x17**; and **every row action on Comments
      is 22x22** — expand, edit and delete, on every row, which are the panel's actual moderation
      controls.

      *How measured.* `getBoundingClientRect` on every visible `<button>` on all eight routes, in
      Chromium at 1440px (`e2e/focus.spec.ts`). Worth knowing: **axe's own `target-size` rule
      passes all eight routes**, because it grants exceptions for spacing and inline targets. The
      blunt measurement found what the standard tool permitted.

      *Why not fixed.* Each of the three sizes moves a row's height, so it is a visual change and
      [DESIGN.md](DESIGN.md) §Method applies — and it wants the same pass as `F-012` and `F-036`,
      which are the other two things waiting on somebody looking at these tables.

      *Cost.* Three hours, nearly all of it the visual pass.

- [ ] **The actions column has an empty header, in four tables** — `F-032`.
      `ContentTable`, `LecturesTable`, `ProfessorsTable` and `RatingsTable` end `TABLE_COLUMNS`
      with `''`, so `TableHeaderRow` renders `<th scope="col"></th>` and a screen reader
      announces nothing for that column. Not the one-line fix it looks like: the panel has **no
      visually-hidden utility**, so naming the column means adding one or showing a word the
      design does not have. **Cost: two hours, most of it agreeing what the column is called.**

- [ ] **A refused sign-in address is not tied to the field it refuses** — `F-031`.
      Measured: the email input carries no `aria-invalid` and no `aria-describedby` reaching the
      message, which is rendered in the page-level `ErrorAlert` above the form. It is announced
      once when the alert appears; a screen-reader user who tabs back to the input hears nothing
      about why it was rejected. Invisible to a sighted operator, which is why it needed a test
      rather than a look. **Cost: one hour, plus deciding whether the sentence should appear in
      both places.**

### Layers that were not built, and why

- [ ] **Mutation testing — not installed, and this is the decision rather than a backlog item.**

      *What.* Stryker, over `src/domain/**` and `src/features/**/model/**` only. Those are the
      directories with no DOM and no network, which is the only place a mutation run is cheap
      enough to finish; pointing it at the feature layer would restart jsdom per mutant.

      *Why not done.* Setup cost is high and the delivery return is low. The suite it would
      grade is 1138 tests across five layers built this round, and every one of them was already
      shown to fail on a deliberate break — which is the property mutation testing exists to
      check, obtained more cheaply and recorded in `CHANGELOG.md` per layer.

      *And the reading rule matters more than the tool.* If it is ever run, read the report the
      way the backend's `P-7` says to — *A surviving mutant is not a finding*, in that
      repository's `docs/test-findings.md`. Its first run scored
      67% and one survivor read as serious — a deleted authorization guard — and three tests were
      written to close it before anyone checked: the guard was covered all along, by two
      integration tests with stronger assertions. The table it produced:

      | Status | Means | Does **not** mean |
      | --- | --- | --- |
      | `SURVIVED` | these files do not kill it | that the suite misses it |

      A survivor is a *candidate*, worth opening and not worth a test until it has been checked
      against the other layers. Scoping the run to two directories makes that reading mandatory,
      not optional.

      *Cost.* Half a day to install and scope, plus an unknown triage — which is the reason it is
      recorded rather than scheduled.

- [ ] **The contract layer — not built, for want of the artefact.**
      `docs/api/openapi.json` is still not in this repository, so there is no
      `src/types/api.generated.ts`, no generated type is imported anywhere, and no MSW fixture is
      checked against a schema. Nothing was attempted and no new estimate is invented here:
      [ADR 0008](adr/0008-generated-schema-is-the-contract-authority.md) already carries the
      procedure, the cost (`P1`, 3–4 h) and the one genuinely unknown thing — whether
      `openapi-typescript`'s output type-checks under TypeScript 6. **This round changes nothing
      about that record except to confirm it is still true.**

### Measured in the browser, waiting on the same visual pass

- [ ] **Contrast fails inside six of the eleven dialogs** — `F-038`. Severity: Major.
      **This is the half of `F-035` the gradient was hiding.** A modal is painted on a flat
      `chrome.surface` rather than on `interactive.css`'s gradient, so axe can decide it — and
      does: **9 failing nodes in the user profile, 9 in the audit detail panel, 10 in the undo
      confirmation, 6 in the activity detail panel, 3 in the bug report, 1 in the content
      editor.** Five dialogs pass clean on the same surface, so this is specific text on
      specific components rather than the palette as a whole. Numbers are only stable because
      the measurement waits for the modal to finish animating; taken mid-fade they move by
      several nodes per run. **Cost: goes with `F-034`'s theme pass — same tokens, same
      afternoon; on its own it would be re-reading the same 37 files twice.**

- [ ] **Touch targets under 24x24 inside the two catalogue editors** — `F-040`.
      The lecture editor has `22x22`, `24x17`, `24x22`, `327x22` and `586x20`; the professor
      editor has `22x22`, `24x22`, `488x22` and `586x20`. Identical at 800, 1024 and 1440,
      because the dialog is a fixed width the viewport does not reach. The `22x22` is the
      `MultiSelect` pill's remove button, the short-and-wide ones are the selected-value pills
      and the `Active` switch. **Cost: goes with `F-037` — the same rule, applied to the
      surfaces `F-037` could not see.**

- [ ] **Three controls per catalogue editor have no accessible name** — `F-039`.
      What is left after the fix: the two `NumberInput` steppers on Semester year and the
      `MultiSelect` pill's remove button. **`NumberInputProps` exposes no naming prop for the
      steppers at all**, unlike `closeButtonProps` and `clearButtonProps` — which is exactly why
      the eleven modal close buttons and the `Select` clear buttons were fixed on 2026-09-10 and
      these were not. **Cost: two hours, and it needs a decision — the Styles API's `attributes`
      escape hatch, or wrapping the control.**

- [ ] **Escape stops closing the lecture editor once the `Professors` field has been focused**
      — `F-042`. Severity: Major. Measured press by press: the first Escape closes the combobox
      dropdown, correctly; **the second puts focus on `document.body` and leaves the modal
      open**; the third and fourth do nothing but let the trap pull focus back. Not a trap —
      `Cancel` and the close button still work — but the key that dismisses every other dialog
      in the panel stops working, silently, and one press drops the operator out of the dialog.
      The professor editor has a `MultiSelect` too and does not show this; its tab loop ends
      elsewhere, which is a statement about what was measured rather than a claim it is safe.
      **Cost: unknown until the interaction between Mantine's `Modal` and its `Combobox` is
      read. Budget half a day and expect to spend it in `node_modules`.**

- [ ] **Every table needs horizontal scrolling below roughly 1300px** — `F-036`.
      At **1440px all four tables fit exactly** (they need 1134 and get 1134). At **1024px all
      four overflow**: Comments +382, Lectures & Professors +282, Audit Logs +182, Users +162.
      The holder is the viewport minus 306 (a 240px navbar and 66px of gutters), so Comments
      needs roughly a **1406px** viewport before it stops scrolling sideways. Nothing is
      unreachable — the holders scroll — so this is a cost rather than a defect, and `F-012`, the
      REASON column clipped to five characters, lives in the worst of them.
      **Extended 2026-09-10:** at **800px** every table overflows — Comments +606, Lectures &
      Professors +506, Audit Logs and Activity Logs +406, Users +386 — and the catalogue's
      1024px figure of +282 was measured against a table with **no rows** (`F-041`), so it is
      larger than recorded. **Cost: half a day together with `F-012`, `F-037` and `F-040`, which
      want the same pass over the same tables and the two dialogs.**

- [ ] **A colour-contrast failure on the dashboard, at 3.56:1** — `F-034`. Severity: Major.
      "Head straight to any section." is `chrome.textDim` (`#6b7280`) on the panel gradient
      (`#171b23`) at 12px, where WCAG AA asks 4.5:1. One element fails as the eight routes first
      render — but the token is used **60 times across 37 files, 30 of them at `size="xs"`**, so
      what was measured is one element and what is at risk is far wider. A theme change, so
      [DESIGN.md](DESIGN.md) §Method applies. **Cost: half a day, nearly all of it looking at the
      37 files.**

- [ ] **The panel waits forever on a backend that never answers** — `F-027`.
      There is no request timeout anywhere: `ApiClient.fetchResponse` calls `fetch` with no
      `AbortSignal`, `fetch` has no default, TanStack Query adds none. Measured, not read off the
      source — a handler that never answers leaves the promise pending and nothing settles it. On
      screen that is `PageLoader` for as long as the tab is open, with no way to tell a hung
      backend from a slow one. Like `F-013`'s silence, this was not decided; it is the absence of
      a decision. **Cost: three hours — an `AbortSignal.timeout`, a duration to agree on, a new
      `ApiError` subclass so `transient` can say a timeout is retryable, and a pass over the
      loading states.**

### From the screenshot round, 2026-09-10

Eleven observations taken from screenshots, all measured at 1440x900 before anything was
written down. **Three did not survive the measurement** and are recorded as refutations at the
end of this block, because a report that turns out to be wrong is worth as much as one that
does not. Numbers for every row are in
[coursework/layout-audit.md](coursework/layout-audit.md) §10.

- [ ] **The profile shows `3 warnings` beside `Warning history (0)`** - `F-076`. Severity:
      **Major**, and the only item in this round where the operator is told something untrue
      about a real account.

      *What.* The badge and the list come from two endpoints and nothing compares them.
      `useUserProfile.ts:22-33` fires `GET /users/{id}` and `GET /users/{id}/warnings` in
      parallel; the badge renders `user.warnings`, the list renders the array. Any disagreement
      between the two renders exactly as this one does.

      *How measured.* The modal's rendered text, captured for `Mira Kowalski`: `3 warnings`
      appears 40px above `Warning history (0)` and `No warnings issued.`. It reproduces every
      time, because the demo seed is inconsistent: `demoData.ts:44-55` gives `user-3`
      `warnings: 3` while `demoData.ts:70-81` seeds a list for `user-1` only. The **write**
      handlers do keep the two in step, so `user-3` is the single offender.

      *Why not fixed.* Two halves with different answers. The seed is a one-line change and is
      safe. The panel having no cross-check is a behaviour decision - whether a count that
      disagrees with its own list should be suppressed, footnoted or shown as-is - and it is
      the kind of decision that should not be taken silently on a moderation screen.

      *Cost.* Ten minutes for the seed. Two hours for the panel, most of it agreeing what the
      screen should say when the backend contradicts itself.

- [x] **The STATUS badge clips its own text** - `F-075`. **Done 2026-09-10.**

      *What it turned out to be.* Not a badge difference and not `table-layout` weighing the
      other columns against Status - the column is never asked for the room in the first place.
      Mantine's badge label carries `text-overflow: ellipsis`, which makes its **min-content
      contribution zero**, so auto layout is free to size Status from its `STATUS` header alone.

      *The fix, and why it is one line in the theme.* `Badge.styles.root.minWidth = 'max-content'`
      restores that contribution. In `src/theme/components.ts` beside the Modal decision rather
      than at the three table rows that show it, because it is one decision about how a badge
      sizes itself, and the three inline copies drifting apart is how the catalogue and Users
      ended up different in the first place.

      *What this entry got wrong, and it is worth keeping.* It said "a `min-width` on the badge
      would push the overflow back into the cell rather than remove it". Measured on the live
      catalogue: the column grows (88 to 96, 96 to 107), the cost lands on the two columns that
      wrap (Lecture 3-5px, Professors 6px), and **the table stays at its `minWidth` - nothing
      starts scrolling that did not scroll before**. The claim was plausible and untested, and it
      is the reason this sat deferred for a round while `ACTI...` was on screen at every width.

      *Blast radius, measured before choosing the scope.* All eight routes at 1024: no route
      gained an overflowing cell or document overflow, Comments included - and Comments was the
      real risk, because `table-layout: fixed` cannot widen a column and would have pushed the
      overflow outwards instead.

      *Pinned by.* `theme.integration.test.tsx` for the declaration, and an `e2e/layout.spec.ts`
      sweep of every badge **label** on every route at all three widths. The label, not the root:
      the root is `width: fit-content` and never overflows, which is what made every earlier
      sweep answer "nothing is clipped" about a screen full of `ACTI...`.

- [ ] **Three fields on one row sit 33px apart** - `F-077`. `Credibility score` at y=667 with no
      description, `Status` at 686 with one line, `Role` at 700 with two. Mantine stacks label,
      description, input, so a taller description moves only its own field, and
      `UserModerationFields.tsx:26` sets `align="flex-start"`. **Not a defect in the copy** -
      the component argues that a locked field should say why, and it is right. **Cost: one
      hour**, and it needs a decision first: reserve a description slot on every field in the
      row, or bottom-align the inputs and let the text hang.

- [ ] **Raw backend field names reach the screen** - `F-078`. `enumLabel` splits on `_` and
      preserves the first character's case, so a camelCase key passes through as one lowercased
      word: `credibilityScore` renders as **`credibilityscore`** in the Audit Logs column and in
      the detail panel, and `contentPreview` as `Contentpreview` in activity metadata. Three
      call sites hand the function something its own doc comment says it does not take.
      `F-073` was the fourth member of this family. **Cost: two hours**, and the decision is
      whether to teach `enumLabel` camelCase or to give field names their own map - the second
      is more honest, because a field name is not an enum value.

- [ ] **The catalogue counts two of its three tabs** - `F-079`. `["Lectures (3)",
      "Professors (3)", "Ratings"]`. The reason is real and invisible: ratings are paged
      server-side, so the only number available is how many have been loaded, which is a
      different kind of number to put beside two totals. **Cost: 30 minutes**, and it is a
      wording decision rather than a code one.

- [ ] **The page title sits between the two strips** - `F-080`. The shell renders its session
      notice before the routes and the page renders its own error after `PageHeader`, so one
      alert is above the `h1` and the other below. Measured: notice at y=32 h=58, `h1` at
      y=102. `AdminLayout`'s comment already defends the split, but it defends it against
      displacing the **sidebar**, which is a different question from where the title goes.
      **Cost: one hour**, and it is a decision about what a page-level alert belongs to.

- [ ] **The `Person` placeholder is truncated by 39px, and `Person` and `Who` are two vague
      names** - `F-082`. Canvas-measured against the input's own font: `Everyone the backend
      lists` needs 175px and has 136. The other six fields fit. The naming is the larger half:
      `ActorFilter` sends `actorId`, `ActorTypeFilter` sends `actorType`, and `Who` is also the
      second **column heading** on the same screen. **Cost: one hour**, nearly all of it naming
      two controls in a way that says which is which.

- [ ] **Bug Reports is the one screen with no table, and two of its fields commit with no
      Cancel or Save** - `F-081`. Both differences are deliberate and both are documented where
      they live: `ReportQueue` is a card list by design, and the status and severity selects are
      fire-and-forget because the queue is re-read after every write
      (`useFeedbackReportActions.ts:99-106`). Recorded rather than opened as a defect. What is
      not written anywhere is that closing this dialog decides nothing, unlike every other
      dialog in the panel. **Cost: 30 minutes** to say so on screen, if that is wanted.

- [ ] **Two of seven tables have rows that open nothing** - `F-083`. `RatingTableRow` is
      deliberate and says so in the component. `ReportRow` keeps `row-interactive`, so it
      **lights up on hover and then does nothing**, and carries no note. **Cost: 15 minutes** to
      drop the hover class from the reports row; longer if the answer is that the row should
      open something.

**Refuted by measurement, and recorded so nobody re-reports them:**

- **The Comments columns are not clipped.** At 1440 the seven column widths sum to exactly
  **1134**, which is the table's width and the holder's, and every first-row cell reports
  `needs == gets`. What is visible is `ContentCell`'s deliberate two-line clamp with a tooltip,
  which has a comment on it. Refuted at 1440 only; `F-036` still holds below 1300.
- **The Dashboard no longer has a mismatched pair of panels.** Step 1 removed `SystemPulse`,
  which was the right-hand one, so `Newest members` now spans the full 1136px alone and the four
  cards are 116px each to the pixel. The report predates the fix.
- **`From` and `To` are the same width now.** That was `F-067`'s 838.5px against 413.2px, and
  both are **170** since the filter bar shell landed.

### Recorded divergences, not defects

- [ ] **`ErrorAlert` breaks two theme rules in seventeen places at once.** Its red is the
      hand-written literal `rgba(239,68,68,…)` — not `KIT.red`, not a `chrome` token — and
      Mantine colours the message `#ffffff`, against [DESIGN.md](DESIGN.md)'s "no pure
      white". Measured by reading the computed styles in Chromium. This is the one place a
      *component* rather than a stylesheet breaks the no-hex-literal rule, so it is the one
      somebody will ask about. Deferred because both are one-line changes that restyle
      seventeen call sites at once, which is a visual change of its own.
      **Cost: one hour to change, half a day to look at all seventeen.**

- [ ] **One flaky run, not reproduced** — `F-024`. `npx vitest run .integration.test.`
      reported `1 failed | 165 passed` once; nine consecutive runs of the same command
      afterwards were green and the failing test was never identified. Recorded rather
      than dismissed: a suite that fails once in ten is not a green suite, and saying so is
      worth more than a number that looks clean. **Cost: unknown until it reproduces —
      which is the reason it is recorded rather than scheduled.**

---

## Follow-up

**From the 2026-09-10 real-backend round.** Three things were seen on screen against the live
instance and left, each for a stated reason.

- [ ] **The Comments table's LECTURE column names nothing, and AUTHOR collides with it.**
      `F-012`/`F-036`. Seen at 1024 against the live backend: the column renders `KAK -...`
      and `AFR -...`, which identify no lecture, and `MustafaTester3456789` in AUTHOR runs
      into the cell beside it - **11 overflowing cells**, unchanged by this round's badge
      rule and unrelated to it. `ContentTable.tsx` is the panel's one `table-layout: fixed`
      table with `COLUMN_WIDTHS` percentages, so this is the column pass itself rather than
      a value inside it. **Rolls into `F-036`; no separate estimate.**

- [ ] **The Ratings table's SCORES column is four lines of fourteen categories.** Seen at
      1440 against the live backend: each cell reads `Overall 3.05 · Room 4 · Organization 4
      · Materials 2 · Workload 5 · Lecture Understandability 0 · ...` and carries every
      category the rating has, which makes the rows ~100px tall and the column the widest
      thing on the screen. The data is correct - this is `F-089` working - and the detail
      view already lists all fourteen properly, which is the argument for the row showing a
      summary instead. **Not done because it is a content decision**: which of the fourteen
      belongs in a list, and whether `Overall` alone is enough, is not a call to make from a
      screenshot. **~1 h once decided.**

- [ ] **The e2e suite still has never run against the real backend.** `testplan.md` §3a
      Layer 6 says so and it remains true: what ran against the live instance on 2026-09-10
      was a headed session driven by hand, with a real token seeded into `localStorage`, and
      none of it is committed - the harness lives outside the repository on purpose, because
      it carries a session. What that round established that no committed test can is in the
      run log. **Deciding whether any of it should become a committed spec needs a decision
      about credentials in CI first.**

Found while doing the Entwurf pass, and deliberately left. Each is a change that
needs either a design decision or a visual pass, so none of them belonged in a
behaviour-preserving refactor.

### From the release-readiness audit, 2026-09-10

Measured in [testfindings.md](testfindings.md) as `F-046`…`F-060`; the audit's scope and
what it deliberately left out is [testplan.md §11](testplan.md). Four fixes shipped in that
round (`F-031`, `F-043`, `F-044`, `F-045`); everything below is what was measured and not
done. Grouped by what a fix would actually cost, because that is the decision.

**Needs the visual pass [DESIGN.md](DESIGN.md) asks for.** Seven items — the six design-rule
violations from `A7`, plus the brand mark's payload, which is a byte problem whose fix changes
a rendered asset. None is a behaviour change and none is safe during a freeze:

- [ ] **Two accent ramps outside the KIT palette reach the screen.** `F-055`.
      `constants/colors.ts:203,204,212` map activity-log actions to `violet` and `teal`,
      which are not among the ten ramps `theme/palette.ts` defines, so Mantine falls back
      to its stock ramps at full saturation. Found by listing every token reachable
      through the maps in that file and diffing against the palette. Choosing what they
      become is a palette decision, not a rename. **~30 min once decided.**

- [ ] **Twenty-seven colour literals outside the theme, one of them the yellow the palette
      rejected by name.** `F-056`. Six hex in `src/index.css` and 21 hand-written `rgba()`
      across 11 component files, encoding five off-palette colours — four of them
      Tailwind's. `InactiveVisibilityNotice.tsx:7-8` reintroduces `#fce500`, the exact
      value `palette.ts:27-28` says was pulled down "because the published value reads as
      a highlighter". Twenty of the 21 are undocumented. **~3 h**, most of it deciding
      what each wash and border should be rather than typing.

- [ ] **Five shadows on chrome that does not float, and none on the surfaces the rule
      reserves them for.** `F-057`. `.panel` in `interactive.css:27-29` carries a
      `0 10px 28px` drop shadow that duplicates `theme.shadows.md` byte for byte; the
      modals and dropdowns the rule is written for carry none. The Mantine `shadow=` prop
      appears zero times, so this is entirely hand-written CSS. **~2 h**, and it changes
      how every surface in the panel reads.

- [ ] **Nineteen radius sites are off the theme scale.** `F-058`. The values written are
      2, 4, 8, 10 and 14; the scale is 6/9/12/16/22. `10` appears at nine sites and `14`
      is on `.panel`, the panel's most-rendered surface. Nothing exceeds the `xl` limit
      except a pill and a circle, which are meant to be shapes. **~1 h.**

- [ ] **The theme and the stylesheet disagree on which font comes first.** `F-059`.
      `theme/index.ts:15` puts Inter first, `index.css:2` puts `system-ui` first, and
      there is no webfont link — so on a machine with Inter installed, Mantine components
      and raw elements render in different families. Invisible on a machine without Inter,
      which is why reading the two files found it and looking did not. **~15 min to
      align, then a look at every screen.**

- [ ] **A fifth font weight and a size below the panel's own floor.** `F-060`.
      `SidebarNavButton.tsx:37` uses `fw={400}` against a rule naming 500/600/700+650;
      `SessionFooter.tsx:16` sets 11px where `xs` is 12. **~15 min**, but both move
      rendered type.

- [ ] **A 136 KB launcher icon draws a 34 px mark.** `F-054`. `BrandMark` renders
      `ic_launcher-playstore.png` (139,062 bytes, 512x512) at 34-36 px, and it is fetched
      on the sign-in screen. `F-043` gave the browser tab its own 32 px icon, which is why
      that is no longer the favicon — **but it did not fix this, and cost ~1.5 KB rather
      than saving 135 KB**, because `BrandMark` still fetches the large file. The remedy
      is a ~128 px source (~10 KB), which covers 34 px at 3x DPR. It wants a look on a
      HiDPI display before it ships. **~20 min plus the look.**

**From the layout audit, section 2 (2026-09-10).** Measured in
[coursework/layout-audit.md](coursework/layout-audit.md); nothing here was changed:

- [ ] **Both log filter bars take two control rows at every width, and the documented reason is
      wrong.** `F-088`.
      *What.* Audit's second row at 1440 holds one 170px control with **923px** of empty space
      beside it; Activity's holds two with 741px. `F-067`'s record says both wrap "row one the
      selects, row two the dates" - true of Activity, false of Audit, which keeps `From` on row
      one and wraps `To` alone.
      *How measured.* Every filter bar at 1024, 1152, 1280, 1366 and 1440; §11.6 and §11.7.
      Break points follow control count: one to three controls never wrap, four wrap only at
      1024, six and seven wrap everywhere.
      *What was done instead, 2026-09-10.* Neither bar was collapsed to one row - that is the
      part still deferred - but the **dead space is gone**: the log fields lost their
      `maxWidth` so a wrapped row fills the width it is given, and the two dates became one
      flex item that never splits. Right-hand gap is now **0 at all five widths on both bars**,
      down from 923 and 741 at 1440. The documentation error is closed with it: both bars now
      wrap the date pair, which is the shape §Step 6 wrongly claimed. Cost recorded: each date
      box is about 541px, wider than its content needs.
      *Why the rest is not fixed.* Four options are costed with measured widths in
      [coursework/layout-audit.md](coursework/layout-audit.md) §11.7. Each either reverses part
      of `F-067` or adds a control the panel does not have; only one - a range control plus
      narrower fields - fits **both** bars on one row. **~20min for the cheapest, ~3h for the
      one that actually fits.**

- [ ] **Reaching a row action at 1024 scrolls its table sideways and leaves it there.**
      `F-086`.
      *What.* The Edit and Delete controls sit in the last column of tables that are wider than
      their holder at 1024, so activating one scrolls the holder fully right - Comments 0 to
      **382**, the catalogue 0 to **282** - and closing the dialog does not scroll it back. The
      operator returns to a table whose Content and Lecture columns are off the left edge.
      *How measured.* The holder's own `scrollLeft`, before, during and after, at 1024 and 1440.
      Users and Audit Logs stay at 0 because they have no row-action column; at 1440 every
      holder overflows by 0 and nothing moves.
      *Why not fixed.* It is downstream of `F-036`: while a table is wider than its holder,
      reaching its last column means scrolling. Restoring `scrollLeft` on close is code rather
      than one CSS value and would paper over the cause. The honest fix is the column-width pass
      `F-036` and `F-012` are already waiting for. **Rolls into that pass; no separate estimate.**

- [x] **`scrollbar-gutter` is `auto` while overflow differs per route.** `F-062`.
      **Done 2026-09-10**, once the confirmation this entry asked for arrived. The machine
      this round ran on has classic scrollbars: `window.innerWidth - clientWidth` is **9**,
      not 0, and Mantine's body lock hands that 9px back on every dialog open and takes it
      away again on close - `documentElement.clientWidth` **1015 -> 1024 -> 1015** on the
      live catalogue at 1024.

      *What the operator actually sees, which the gutter measurement could not report.*
      Every panel's right edge and the tab strip's travel **+10px out and back** on every
      open and every close, while the left edges hold - so the right-hand side of the screen
      jumps and the left does not. That asymmetry is the "shift when a detail screen opens"
      the brief reports, and it is not the dialog: the dialog is innocent, as three earlier
      rounds correctly found.

      *The cost, stated because it is real.* The gutter is now reserved on every route
      whether it scrolls or not, so a non-scrolling page is 10px narrower than its viewport.
      That is the trade `stable` makes, and it turned 82 e2e assertions red - all of them
      asserting `scrollWidth === clientWidth` where the question is `<=`. The assertions were
      wrong, not the pages.

      *Pinned by* an `e2e/layout.spec.ts` test that records every panel's right edge before,
      during and after a dialog - **edges, not the gutter**, so it still holds on a browser
      with overlay scrollbars where there is nothing for the gutter to report.

- [ ] **The loading state is a fixed 200px box where 900 to 1123px of content goes.**
      `F-063`. There is no skeleton at all, which is why the brief's "make the skeleton
      match the content" fix has no subject. Matching would need a per-route height, which
      is not one CSS value. Note the spinner could not be captured live: MSW answers from
      a service worker that Playwright's request interception does not sit in front of, so
      the 200 is source-derived and the content heights are browser-measured. **~2 h** for
      real skeletons, and it is a visual design decision.

- [ ] **The Dashboard renders no `h1`.** `F-064`. The other seven routes agree to 0.00px
      at x=288.00, y=32.00; the Dashboard has none because it uses `DashboardHeader`
      rather than `PageHeader`, the only component that emits one. Fixing it means either
      a visible title where there is none or a hidden one, and the panel still has no
      visually-hidden utility - the same gap `F-032` hit. **~30 min**, after that
      utility exists.

- [ ] **The tab strip starts 102.79px lower on two routes than on Comments.** `F-065`.
      y=117.80 on Comments, y=220.59 on Lectures & Professors and Bug Reports; x, width
      and height are identical on all three. Caused by what sits above it, so moving it
      rearranges two screens. **~1 h**, and a visual pass.

**From the layout audit, sections 3 to 8 (2026-09-10).** Every one has a single proposed
standard in [coursework/layout-audit.md](coursework/layout-audit.md); none was applied.

- [ ] **The Dashboard renders four facts eight times.** `F-066`. It overflows by 223px at
      1440 and 642px at 1024. Three costed options are in the report, and each answers
      "where does this information still live". **`Last updated` exists nowhere else** and
      must move rather than be dropped. **Option 2 (drop the two bars and "Jump to") saves
      249.2px and loses nothing**, which clears the overflow at 1440. ~1 h.

- [ ] **Five screens, five filter layouts.** `F-067`, and the most visible of these.
      Standard: one filter-bar shell, search always first at x=293, Apply and Clear pinned
      to the bar's last line so control count never moves them, Catalog's search moved in
      from the table panel. **~6 files, ~4 h**, breaks the two filter-bar tests in
      `e2e/surfaces.spec.ts` and the Catalog search tests.

- [ ] **The Users card row ends early; two screens have no cards.** `F-068`. The three
      cards are **not** wider - all cards everywhere are 273.5px. Standard: a fixed
      four-column row, Users gains a fourth card, the two log screens keep zero because an
      event stream has nothing to count. **~2 files, ~1 h**, breaks the Users stat tests.

- [ ] **The tab strip sits above the cards on Comments and below them everywhere else.**
      `F-065`, now with its mechanism measured: the 102.79px is the card row plus margin.
      Standard: cards first, tabs second, so the strip is at y=220.6 on every screen.
      **1 file, ~30 min**, breaks the Comments tab tests.

- [ ] **Five row heights across seven tables, and two right gutters for row actions.**
      `F-069` and `F-070`. 51.8 to 94.4px; actions end at 1361.6 on Comments and 1387 on
      the catalogue. Numeric alignment and the empty-cell glyph are already consistent and
      need nothing. **~7 files, ~2 h**, breaks assertions in `e2e/layout.spec.ts`.

- [ ] **The Dashboard heading has no accent bar and no `h1`.** `F-071` and `F-064`.
      Standard: every route uses `PageHeader`, the greeting becomes its title, which fixes
      both at once. **2 files, ~45 min**, breaks the dashboard header test.

**Needs a new screen or a markup change.** Both are visual by definition:

- [ ] **An address that does not exist takes the operator to the dashboard silently.**
      `F-046`. `AdminRoutes.tsx:37` redirects `*` to the dashboard with `replace`, so a
      typo or a stale bookmark lands somewhere real with nothing said and no way back.
      Verified in the same pass that there is **no broken internal link**: the route table
      was generated from `constants/routes.ts` and cross-checked against every navigation
      target — 9 declared, 9 mounted, 15 targets, no orphans either way. So this is the
      only wrong-path behaviour there is. A 404 screen is a new screen. **~2 h.**

- [ ] **Nine routes and not one anchor.** `F-048`. There is no `<Link to=` or `<NavLink>`
      anywhere in `src/`; every navigation is an imperative `navigate()` on an
      `UnstyledButton`. So nothing can be middle-clicked, opened in a new tab or
      bookmarked from the control that leads to it, and a screen reader hears "button"
      where a link is meant. Turning them into anchors changes focus and hover styling on
      every nav control. **~3 h.**

**Accessibility, measured and left:**

- [ ] **No form has field-level validation, so nine more fields are untied from their
      messages.** `F-049`. `F-031` is fixed for the sign-in email field only. Measuring
      the rest showed the finding was never specific to sign-in: `useForm` is called five
      times and **never with a `validate` config**, so `form.errors` is always empty and
      Mantine's `error` prop — the thing that wires `aria-invalid` and `aria-describedby`
      — is never populated anywhere. Related: `withAsterisk` appears zero times and
      `required` twice, both on sign-in, so eight of ten forms mark nothing as required.
      Note the route taken for `F-031` **duplicates the sentence in the DOM** and forced
      six test queries to be scoped; doing that nine more times is the wrong answer, and
      the right one is probably a real `validate` config per form. **~4 h, and a decision
      first.**

- [ ] **Every decorative icon is unnamed rather than hidden.** `F-051`. Tabler v3 emits
      `<svg>` with no `aria-hidden`, across 39 icons in 50 files, and the panel never
      passes one. axe does not flag it and it costs nothing measurable today, because
      every icon-only control already carries an `aria-label` — all 14 `ActionIcon`s,
      verified. A mechanical edit across 50 files with no symptom is the wrong shape of
      change for a freeze. **~1 h.**

- [ ] **Four edit modals can be dismissed mid-save.** `F-050`. `ConfirmModal.tsx:74-76`
      seals itself during a request and the four editors do not, so Escape or a click
      outside abandons the answer — including the error sentence if it failed. Nothing is
      corrupted; the request still settles. The shape to copy already exists. **~45 min.**

**Not this repository's to change** — see [backend-tasks.md](backend-tasks.md):

- [ ] **Hashed assets are served with no security headers, and no CSP or HSTS exists
      here.** `F-052`. `nginx.prod.conf.template:23-25` sets `nosniff`, `X-Frame-Options`
      and `Referrer-Policy`, but only in `location ${ADMIN_BASE_PATH}`; the `assets/`
      block is a more specific prefix with its own `add_header`, and nginx does not
      inherit — so every JS, CSS and image goes out with none of the three. **What cannot
      be established from here:** the config is `listen 80;` only, because TLS terminates
      on a host proxy outside this repository, so whether HTTPS is enforced and whether
      HSTS is set is unverifiable from the codebase. That is this audit's largest blind
      spot and the reason the finding is Major. **Handed over on 2026-09-10 as
      [backend-tasks.md §J3](backend-tasks.md)** — four specific questions rather than a
      general concern, so it can be answered: the exact `Strict-Transport-Security` value,
      whether `http://` redirects, which `server` block both sit in, and whether that
      proxy already sets the three headers host-wide. **Delegated, not out of scope**, and
      the row stays open until the answer arrives. Two halves depend on it: if the proxy
      sets the headers host-wide the `assets/` half closes with no work, and if it does
      not, that half is ours (§J1) and is a two-line nginx change. **~15 min once
      answered**, plus whatever the answer itself costs.

- [ ] **`robots.txt` is served where no crawler reads it.** `F-047`. `F-043` added it, and
      the Dockerfile copies `dist/` under `${VITE_BASE_PATH}` — so in production it is at
      `/admin/robots.txt` and a crawler only reads the domain root. The meta tag added in
      the same change is the half that actually works at `/admin/`. Serving a file at the
      domain root is the host proxy's job. **~10 min, on someone else's box.**

- [ ] **Three dead or dev-only files ship in the production image.** `F-053`.
      `public/mockServiceWorker.js` (9,666 B) is served at `/admin/mockServiceWorker.js`;
      the MSW *library* is correctly tree-shaken out, so this is the script alone.
      `public/icons.svg` (5,031 B) and `src/assets/hero.png` (13,057 B) are referenced by
      nothing at all. Removing the worker means changing how MSW is wired for the browser
      layer, which is [ADR 0009](adr/0009-msw-slice-by-slice.md)'s territory. **~30 min.**

- [ ] **Request assertions still type `/api` by hand, and `apiUrl` still derives it.**
      `F-025` is fixed by pinning the base in `test.env`, so the two cannot disagree
      today. The duplication that made the failure possible is still there: roughly a
      hundred assertions across six files spell out `/api/auth/login` while the
      handlers are registered through `apiUrl('/auth/login')`. One decision, written
      in two places. The fix is to let `requestsTo`/`requestTo` take the path *below*
      the base and prefix it themselves, as `bodylessWrites.integration.test.ts`
      already does with its own `BASE` — which is exactly why that file was the only
      one green in the red pipeline. Not done here: it rewrites every request
      assertion in the suite, and the pipeline needed to go green first.

- [ ] **A clickable `<tr>` is the wrong shape, and `role="button"` is not the fix.**
      `ClickableRow` now holds the contract and requires an accessible name, so the
      four rows that announced themselves as "row, eight columns" no longer do. The
      *correct* markup is an ordinary control inside the first cell, which keeps the
      table's row semantics and announces itself as a button. Adding `role="button"`
      to the row would trade one defect for another. Changing the markup is a visual
      change and wants the pass [DESIGN.md](DESIGN.md) asks for.
- [ ] **`useRatings.loading` and the Feedback error region** — `F-011` and `F-010`
      in [testfindings.md](testfindings.md). Both are loading- and error-state
      changes and belong with `P4`, which also owns the missing `Skeleton`s.
- [ ] **The icon scale records drift rather than fixing it.** `IconPencil` appears at
      13, 14 and 15 depending on the file, and two empty-state icons sit at 20 and 34
      beside a scale step of 32. Naming them was behaviour-preserving; reconciling
      them is a design decision, and `docs/DESIGN.md` §Method applies.
- [ ] **Style duplication that is not a duplicated *decision*.** The "sunken card"
      style is written out four times — including twice in
      `audit-logs/components/details/`, where one of them ignores the
      `detailStyles.ts` that exists solely to hold it. `panelStyle` appears six
      times, `panelHeaderStyle` four. Mechanical, but it touches how every panel is
      drawn, so it wants to be seen.
- [ ] **One empty state, not nine.** Fourteen empty-state strings across four
      different layouts, with `No users found` the only one lacking a full stop and
      `No field changes` / `No field changes recorded.` saying the same thing two
      ways. Also `P4`.
- [ ] **Two enum-label mechanisms and three sort-label tables.**
      `users/model/userEdit.ts` spells out `Active`/`Blocked` and `Student`/`Admin`
      by hand, in the same package that uses `enumLabel` two files over — they agree
      by coincidence. `USER_SORTS` has the vocabulary and no labels, while
      `UsersPage` and `UserFilters` each carry their own.
- [ ] **Dead public surface.** `isAuditActorType` is used only by its own test,
      `normalizeEmail` only inside its own file, and `SYSTEM_HEALTH_VALUES` is
      exported and never consumed. Kept rather than deleted: removing production code
      and its tests mid-refactor risks more than it buys.
- [ ] **`ContentTab` and `ReportsTab` take `ReturnType<typeof useModerationContent>`
      as a prop.** A component's public contract is a foreign hook's entire return
      surface, so adding a field to the hook widens the component's interface without
      anyone editing it — and the components cannot be tested without constructing
      that whole shape.
- [ ] **`useSelectedId.close()` leaves `selectedId` set.** Deliberate, so a modal
      does not flash empty while it animates shut, and now documented — but it means
      callers must read `selectedId` together with `opened`. `CatalogPage` does;
      `FeedbackPage` resolves a report from the id alone and is saved only by a
      separate guard on the modal.
- [x] **The Playwright cache path in these docs was wrong, and so was the revision.**
      Both said `~/Library/Caches/ms-playwright`, the macOS path, as though it were the
      only one. Corrected in [DESIGN.md](DESIGN.md) and moved to
      [README.md](../README.md#prerequisites), which is where somebody setting up
      looks. The revision was also wrong: this note said `chromium-1234`, and Playwright
      1.63 requires **1243** — read from `playwright-core/browsers.json` rather than
      from either guess. Both directories are present on this machine, which is exactly
      how the wrong one came to be written down. The MCP Playwright server is still
      configured for a `chrome` channel that is not installed, so it has to be driven
      directly.
- [ ] **`actor: null` and `author: null` take their whole table down** — `F-022`. Measured in
      the suite, not reasoned about: two tests record that the row never arrives, because both
      row components read the name into their accessible label and throw before anything is
      painted. The backend has confirmed the actor columns are five `NOT NULL`s, so this is a
      **recorded risk, not a live defect**. The fix is a nullable domain type, and its `tsc`
      consequences reach every read site — deliberately not a last-day change. Full entry
      under *Known, measured, deliberately deferred*.
- [ ] **`ErrorAlert` breaks two theme rules, in seventeen places at once.** Its red is the
      hand-written literal `rgba(239,68,68,…)` — not `KIT.red`, not a `chrome` token — and
      Mantine colours the message `#ffffff`, against `docs/DESIGN.md`'s "no pure white, the
      brightest text is `chrome.textBright`". This is the one place a component, rather than a
      stylesheet, breaks the no-hex-literal rule, so it is the one somebody will ask about at
      the Abnahme. Both are one-line changes to the component and neither is small in effect:
      seventeen call sites are restyled at once. The `warning` level added for the session
      notice already goes through `withAlpha(KIT.yellow, …)`, so the fix is to bring the older
      half up to the newer one. Recorded in [DESIGN.md](DESIGN.md).
- [ ] **The panel is unusable below `sm` — the sidebar covers the whole screen.** `F-019`.
      Found while screenshotting the session notice at 320px and 768px, which is the width the
      check was asked for and the width at which there is nothing to check.
- [ ] **A refused filter empties the users table instead of sitting above it.** `F-020`.
      `UsersPage` says in a comment that a `400` belongs "above the rows that are still the
      last good answer"; the rows are gone by then. Seen in the browser, not reasoned about.
- [ ] **The REASON column truncates its badges** — `F-012`. Found by looking at the
      moderation screen in a browser, which the end-to-end layer made reachable. The
      *filter* clipping is fixed and measured; this is the table column, whose share
      of a fixed layout is set in `ContentTable`'s `COLUMN_WIDTHS`, so widening it
      moves every other column. A visual change, and [DESIGN.md](DESIGN.md) §Method
      applies.
- [ ] **Catalogue, feedback and the dashboard are still on `vi.mock`.** A decision,
      not a backlog — [ADR 0009](adr/0009-msw-slice-by-slice.md) — and the handlers
      they would need already exist. They move when something touches them.

---

## Done

### The refactor — all twelve steps, on `hard-refactoring`

Module by module, behaviour-preserving except where stated. Each step kept
`npm run check` and `npm test` green before the next started and has its own
`CHANGELOG.md` entry. Decisions taken up front are now
[ADR 0001](adr/0001-tanstack-query-as-the-data-layer.md),
[0002](adr/0002-delete-the-activity-log-screen.md) and
[0005](adr/0005-central-theme-no-hex-literals.md).

| Step | What landed |
| --- | --- |
| 0 | Coverage tooling, the `@/` alias across 161 files, and the pre-existing red test fixed (`F-004`) |
| 1 | The activity log deleted — 14 files, 1187 lines, 11 tests |
| 2 | The theme: 386 hex literals across 67 files down to two, and 44 hand-passed style props into `src/theme/` |
| 3 | TanStack Query client, provider and test helper; `react-error-boundary`; two dead files wired up |
| 4 | `src/api` into eight packages with barrels, an `HttpService` base, the Comment/Answer twins collapsed, `zod` for the stored session — 531 lines lighter |
| 5 | Audit logs on `useInfiniteQuery`; revert as a mutation; `AuditLogDetails` split five ways |
| 6 | Users: `model/` package, `useInfiniteQuery`, `@mantine/form`. **`useCursorLogPage` deleted** |
| 7 | Moderation: the 24-field hook split three ways; `ContentRow` split; `useSet` |
| 8 | Dashboard on two queries with `refetchInterval`. **`useVisibleInterval` deleted** |
| 9 | Catalogue: `model/` package, one `CatalogEditModal` instead of two, `useRatings` on `useInfiniteQuery` |
| 10 | Feedback: `model/` package, three mutations replacing an injected setter. **`useAsyncData` deleted** |
| 11 | Auth, layouts and help: `useLoginFlow` on `@mantine/form`, `helpContent.ts` split six ways, `AdminRoutes` split out of `AdminLayout` |

Two bugs were found while running the suite rather than by reading it, and fixed:
`@/api/logs` had no barrel because a bare `logs` pattern in `.gitignore` hid the
directory at any depth, so the branch did not typecheck from a clean checkout; and a
refused bug-report deletion removed the row locally and let the rejection escape.

**Where it ended: 37 files / 273 tests green, coverage 91.23 / 84.16 / 89.03 /
93.49** — up on every axis against the pre-refactor baseline (88.56 / 81.24 / 84.27
/ 91.63). Production build clean.

### `P0` — cleanup and delivery hygiene

- [x] **The activity-log sweep found one thing.** A full search of `src/`, `docs/`,
      `README.md`, `wiki.md` and CI config turned up no dead route, sidebar entry,
      type, import or test. The one stale artefact was `LogMeta`'s doc comment,
      which justified capping `actors` by reasoning from the deleted screen. The cap
      is real and the reason survives — `/audit-logs` is backed by a log table
      shared with the student-side record — so the comment says that now. Everything
      else that mentions "activity" is either a false positive or an intentional
      regression guard.
- [x] **`.gitignore` had a real bug.** The opening comment lost its `#` on the
      second line, making an English sentence an active ignore pattern. Nothing
      matched it, so it never did damage; `git check-ignore -v` reported it as a
      rule all the same. `playwright-report/` and `test-results/` added, because
      `P3` writes them. `coverage/`, `.env.local` and `dist` were already there.
      **`docs/coursework/` is deliberately not ignored.**
- [x] **`strict` is on.** `README.md` and `wiki.md` both claimed "TypeScript strict
      checks"; `strict` was unset in both tsconfigs, so `strictNullChecks` and
      `noImplicitAny` were off. Running the project under `--strict` produced **zero
      errors**, in app and build config alike, so the flag was set rather than the
      claim softened.
- [x] **Zero warnings.** `npm run check`, `npm test`, `npm run test:coverage` and
      `npm run build` all clean; the real output is in the run log in
      [testfindings.md](testfindings.md).

### `P6` — documentation

- [x] **[docs/adr/](adr/) — eleven records.** Decision, context, alternatives
      considered, rationale, consequences. Every one cites where its reasoning
      already existed; two are new decisions
      ([0008](adr/0008-generated-schema-is-the-contract-authority.md),
      [0009](adr/0009-msw-slice-by-slice.md)) and say so.
      [0010](adr/0010-admin-email-list-in-the-bundle.md) and
      [0011](adr/0011-session-in-browser-storage.md) are written as defences.
- [x] **[class-diagram.md](class-diagram.md) redrawn** — five UML diagrams instead
      of one, against the code as it now is. The no-cycles claim is checked, not
      asserted.
- [x] **[testplan.md](testplan.md) made honest about HTTP.** Three levels of
      substitution, not one; counts demoted to dated snapshots of the coverage
      artefact; the manual scenarios bound to the `P3` specs that will cover them.
- [x] **[testfindings.md](testfindings.md)** — current per-directory coverage beside
      the baseline, the run log, and `F-005` / `F-006` opened.
- [x] **`README.md` and `wiki.md` reconciled**, and both gained the documentation
      table neither had in full.
- [x] **[backend-tasks.md](backend-tasks.md)** — `G1` is no longer a request, and
      `H2` warns against dropping the legacy paths.
- [x] **This file**, restructured into done / handed over / not done.

### `P7` — demo safety

- [x] **[coursework/demo-notes.md](coursework/demo-notes.md)** — what not to touch
      (the Active switch, the login rate limit, your own account), what looks like a
      bug and is not, the order to walk the panel, and short answers to the
      questions that will come.

---

## Handed over

Five packages, specified to be executed on another machine. Each carries what to
build, how to know it is done, and where it stops. They **replace** the twelve-phase
test strategy this file used to carry: Phase 1 landed in refactor step 0, and the
rest is superseded.

**Two of the five have since landed here rather than elsewhere, and the specifications
below are kept as written.** `P2` and `P3` are done — see `CHANGELOG.md` and the
amendments to [ADR 0009](adr/0009-msw-slice-by-slice.md). The specs are left in place
unedited because they are the record of what was asked for, and reading them against
what shipped is how the difference stays visible; each now opens with what actually
happened. `P5` was not started.

Order matters only in one place: `P2` is easier after `P1`, because its fixtures are
typed against the generated schema. That ordering **did not hold** — `P2` ran first,
so its fixtures are typed against the panel's own types instead, which is the
limitation [ADR 0008](adr/0008-generated-schema-is-the-contract-authority.md)'s
amendment records: a fixture cannot drift from what the panel believes, and both can
be wrong together.

### `P1` — the contract artefact *(3–4 h, blocked on the schema)*

**Why:** the panel's types are hand-written and nothing checks them against the
backend. A renamed field passes every test here and fails in the browser — that is
`F-002`, which shipped.
[ADR 0008](adr/0008-generated-schema-is-the-contract-authority.md).

- [ ] Pull `/v3/api-docs` per [api/README.md](api/README.md) and commit it as
      `docs/api/openapi.json`, **byte for byte**. The diff between two pulls is the
      record of what the backend changed; a reformat destroys it.
- [ ] `npm i -D openapi-typescript`; generate `src/types/api.generated.ts`. Add a
      `schema:types` script so the regeneration is one command and not a remembered
      incantation.
- [ ] Bind the hand-written types in `src/api/*` to the generated ones — start with
      `users`, `logs` and `moderation`, which carry the cursor contract.
- [ ] **List every mismatch. Resolve none of them unilaterally.** The schema may be
      wrong (springdoc infers, and a controller taking `Object` becomes an unhelpful
      open type) and the panel may be wrong. Write them up and ask.
- [ ] Two mismatches are known before you start and are *not* P1's to fix: `F-005`
      (the `/admin` prefix) and `F-006` (the `…/all` catalogue reads).
- [ ] Record anything the backend is missing or contradicts in
      [backend-tasks.md](backend-tasks.md).

**Done when:** `docs/api/openapi.json` is committed, `src/types/api.generated.ts`
is generated and imported by at least one service, `npm run check` is clean, and the
mismatch list exists.

### `P2` — MSW, the Comments slice *(4–5 h)* — **landed, and went further**

> **What happened.** Delivered, then extended: eight files run on MSW rather than the
> one this specifies, because ADR 0009's rule — a module being worked on moves — kept
> applying. The handlers also grew a second job the spec did not foresee, serving the
> browser under `VITE_MOCK_BACKEND`, which is what made `P3` affordable. Five files
> still replace their service, by decision. `docs/testplan.md` §2 names both lists.

**Why:** no page test touches HTTP. [ADR 0009](adr/0009-msw-slice-by-slice.md)
explains why this is one feature rather than all nine.

- [ ] `npm i -D msw`. Two environments: `src/test/msw/server.ts` for Vitest and
      `src/test/msw/browser.ts` plus `public/mockServiceWorker.js` for the dev
      server and `P3`.
- [ ] Handlers under `src/test/msw/handlers/`, one file per resource. They must
      **actually implement** the contract, not return a fixed blob:
      - the `{ success, message, … }` envelope on every response;
      - `limit` / `cursor` / `nextCursor` paging that really slices, and a `400`
        `A cursor requires a limit` when a cursor arrives without one;
      - `q`, `status`, `role` and `sort` applied, so a test can assert a filter
        changed the result rather than merely that a request was sent.
- [ ] Error paths, because they are where the interesting behaviour is: `401`
      (session end), `403`, `400` with a usable message (`Invalid user status`),
      `409` with all five audit `reason` codes (`ACTION_NOT_REVERTIBLE`,
      `WINDOW_EXPIRED`, `VALUE_CHANGED`, `ALREADY_REVERTED`, `TARGET_MISSING`), `429`
      with `Retry-After`, and `503` for `gitlabEnabled: false`.
- [ ] Fixtures typed against `src/types/api.generated.ts`, so **a fixture that
      drifts from the schema fails `tsc`** rather than passing a test that proves
      nothing.
- [ ] Migrate `src/features/comments/CommentsPage.integration.test.tsx` only. Drop
      its `vi.mock('@/api/moderation')`. Assert the real request: path, query
      string, body, and the `Authorization` header.
- [ ] `server.listen({ onUnhandledRequest: 'error' })` **for the migrated file
      only** — the other eight legitimately make no requests, and a global setting
      would fail them all.
- [ ] Three tests for the three behaviours that are documented as decisions rather
      than implemented in one place:
      1. a `401` ends the session **and** the attempted path travels in `state.from`;
      2. an unreachable backend does **not** end the session;
      3. `ACTION_TAKEN` hides content; every other status restores it.

**Done when:** the comments page test passes with no service mock, the three
behaviour tests exist, coverage has not fallen, and
[testplan.md](testplan.md) §2 names which feature is on MSW.

**Where it stops:** the other eight integration files stay on `vi.mock`. That is a
decision, not an omission — say so in the changelog.

### `P3` — Playwright *(3 h, cuttable)* — **landed**

> **What happened.** Delivered in full: four specs, 11 tests, Chromium only, against
> the browser-mode handlers rather than a deployment. Not cut. The cache-path note
> below was wrong twice over — it gives the macOS path and the wrong revision — and is
> corrected in [README.md](../README.md#prerequisites); it is left here as written
> because it is the specification, not the instruction.

**Why:** nothing exercises a real browser. **If time runs short, do login and
comment moderation only** and hand the rest on.

- [ ] `npm i -D @playwright/test`. Chromium is already cached at
      `~/Library/Caches/ms-playwright`. Serve the dev server with browser-mode MSW —
      **no backend**.
- [ ] Four flows, in priority order: login → comment moderation → bug report status
      → reverting a field edit from the audit log.
- [ ] Each test written as **state / action / expected response**, named as a
      readable sentence. These are also the scenarios walked by hand at the Abnahme,
      so they have to read like instructions.
- [ ] Bind each to [testplan.md](testplan.md) §7 — the table already has the
      column, with E2E-4, E2E-5, E2E-11, E2E-12 and E2E-13 waiting for their spec
      names. **Fill it in, or the two lists start drifting immediately.**
- [x] A separate CI job with `allow_failure: true`. It never blocks a merge. **Since made
      `when: manual` as well** — `allow_failure` stopped it gating, but not from running on
      every push, and it pays for a browser image and a second `npm ci` before it starts.

### `P4` — accessibility and polish *(4 h)*

**Why:** there are no accessibility assertions at all, and an audit has already
found real defects. They are listed so nothing is rediscovered.

- [ ] `npm i -D vitest-axe`; one smoke test per route (eight), plus the modals.
- [ ] **Fix the keyboard trap first — it is a genuine defect, not a nicety.**
      `activateOnEnterOrSpace` (`src/utils/keyboard.ts:3-11`) is bound to the
      clickable `<tr>` and calls `preventDefault()` on any Enter or Space that
      bubbles. A keyboard user who tabs to a row's **Delete** button and presses
      Enter gets the row's own action instead. The *click* path is guarded by a
      `<td onClick>` wrapper; the *key* path is not. Affects `ContentRow`,
      `LectureTableRow`, `ProfessorTableRow` and `UserChip`.
- [ ] Four of the five clickable rows carry `tabIndex={0}` with no `role` and no
      `aria-label` — only `AuditLogRow` has one. A screen reader announces "row, 8
      columns" with no hint it is activatable.
- [ ] **Loading states: there is not one `Skeleton` in the codebase.** Every one is
      a centred `Loader` that replaces the whole page — including the `PageHeader`
      on Catalog, Moderation and Feedback, so the operator loses their bearings on
      every load.
- [ ] The Catalog **Ratings** tab renders its empty state while the first page is
      still loading: `useRatings` computes `ratings.loading` and `RatingsTable`
      never receives it. "No ratings here yet." and "still loading" look identical.
- [ ] **Feedback is the only screen with no page-level `ErrorAlert`** — a failed
      mutation is visible only inside the modal.
- [ ] `<Select w={180}>` for report **Reason** clips "Inappropriate Content" (21
      characters). The login card is `width: 400` with no `maxWidth`, so it
      overflows below a 400px viewport.
- [ ] **Report the consistency audit before changing anything**, then reduce to one
      form: `No users found` is the only empty state without a full stop; three have
      an icon and three do not; `formatDate` returns `'-'` for an unparseable date
      while every hand-written marker is `'—'`; "Last seen" shows a time in the
      profile modal and not in the table; the Help page's badge colours are a
      hand-copied fourth palette that can drift from `constants/colors.ts`.
- [ ] Colour must carry state only, never decoration.
- [ ] **The interface is English, without exception.** This is already true — a
      sweep found no non-English user-visible string, and German survives only in
      colour-name comments. Keep it that way.
- [ ] **Fixtures: realistic German KIT content.** The current comment bodies are
      role-labels — `'Reported text'`, `'Hidden already'`, `'Root comment'`,
      `'Nested answer'` — which exercise no line clamping, no tooltip threshold (90
      characters) and no word breaking. Use real lecture names
      (`Grundbegriffe der Informatik`, `Lineare Algebra I`), German professor names,
      and German comment text. Keep the `@student.kit.edu` addresses. **No lorem
      ipsum and no invented statistics**, per [DESIGN.md](DESIGN.md).
- [ ] Confirmation dialogs for anything irreversible. `ConfirmModal` already covers
      seven actions; two consequential ones are not covered and should be
      **discussed before being changed** — setting a report to `ACTION_TAKEN` (it
      hides content, and it is fire-and-forget from a `Select` by design) and saving
      a catalogue record inactive (irreversible from the panel, warned only by an
      inline `Alert`). Adding a dialog to the first would put one in the middle of
      the most common moderation action.

### `P5` — CI thresholds *(1 h, cuttable)*

**Do not change the pipeline's structure.** Only:

- [ ] Coverage thresholds in `vite.config.ts` at the figures already met —
      **89.58 / 83.14 / 86.48 / 92.12** — not at aspirational ones.
- [ ] Publish `coverage/` as a CI artefact. This is what makes
      [testplan.md](testplan.md) §0 enforceable rather than a wish.
- [ ] GitLab's coverage regex on the `web:test` job. There is none today.
- [ ] `npm audit` as its own step.

---

## Deliberately not done

Each with its reason. None is an oversight.

- **The panel does not move to the `/admin` path prefix.** `F-005`. Mechanical, but
  it is a behaviour change across every service, and the brief for these two days
  was explicitly no new features. It needs a maintainer's decision and a full manual
  pass afterwards, not a quiet find-and-replace.
- ~~**The catalogue does not switch to the `…/all` reads.**~~ `F-006`. **Done**, in
  `5353dbe`, and **verified against the live backend on 2026-09-10**: the panel calls
  `/data/lectures/all` and `/data/professor/all`, both 200, and the full round trip -
  deactivate, gone from the default list, found under Inactive, reactivate, back - was
  walked on two real records (`Deep Learning and Neural Networks`, `Tamim Asfour`) with
  the instance returned to its starting state afterwards. The All/Active/Inactive filter
  it needed exists and defaults to Active.
- **Eight integration files stay on `vi.mock`.**
  [ADR 0009](adr/0009-msw-slice-by-slice.md). One finished slice beats nine
  half-migrated ones at a deadline, and the suite is the only safety net the
  refactor had.
- **`metadata.elevated` is not surfaced in the audit log.** The backend marks
  entries only an elevated operator could have written. Rendering it would be the
  first visible difference between an elevated operator and any other admin —
  exactly what [ADR 0004](adr/0004-elevated-operator-is-behaviour-not-a-role.md)
  rules out. **Needs a decision, not a default.**
- **Self protection stays.** Nobody changes their own role or status, blocks or
  deletes themselves, elevated or not. The risk on the other side is locking the
  last operator out of the panel. **Revisit only if there is a real need.**
- **No System Status screen** ([ADR 0003](adr/0003-remove-the-system-status-screen.md))
  and **no Activity Log screen**
  ([ADR 0002](adr/0002-delete-the-activity-log-screen.md)). The endpoints stay in
  both cases.
- **`src/interactive.css` keeps its hex literals.** Refactor step 2 converted the
  TypeScript and not the stylesheet; one of the five near-identical hairlines it
  retired is still written there by hand. It wants CSS custom properties fed from
  `chrome`, which is a real change to how the theme is consumed and not a
  find-and-replace. Recorded in [DESIGN.md](DESIGN.md).
- **No Content-Security-Policy.** `nosniff` and `X-Frame-Options: DENY` are set;
  a CSP is the cheapest remaining mitigation for
  [ADR 0011](adr/0011-session-in-browser-storage.md) and is a change to
  `docker/nginx.prod.conf.template`, not to the app.
- **Mutation testing and visual regression are dropped**, not deferred with a date.
  They were Phases 9 and 11 of the old strategy. With two days, `P1`, `P2` and `P4`
  buy more.

---

## Handover note

Where things stand, for whoever picks this up.

**Branch.** `hard-refactoring`, not pushed.

**The gate is green.** `npm run check`, `npm test`, `npm run test:e2e`,
`npm run build` — **43 files, 348 tests**, 11 Playwright tests, zero warnings, clean
build. Coverage **92.55 / 85.62 / 90.77 / 94.43**, up on every axis at every step
since the pre-refactor baseline of 88.56 / 81.24 / 84.27 / 91.63.

One caveat belongs with that sentence rather than under it: `npx vitest run
.integration.test.` failed once and was green on the nine runs afterwards, with the
failing test never identified (`F-024`). A suite that fails once in ten is not a green
suite.

**Read [Known, measured, deliberately deferred](#known-measured-deliberately-deferred)
first.** It is the most useful list in this file. Everything in it was found,
reproduced and measured, and each entry carries what fixing it costs. Two items there
are pinned by tests that assert the **current** behaviour, so a green suite is not
evidence either is acceptable: `F-022`, where a null actor or author takes a whole
table down, and the swallowed `415` on sign-out, which is the one place the panel
tells the operator something untrue.

**Which files still replace their service** — five, by decision, named with what each
therefore cannot show in `docs/testplan.md` §2. Eight run against MSW. Catalogue is the
notable hole: it is the one feature with no handlers at all, so nothing about its
requests is exercised anywhere.

**Where coverage is weakest**, in the order worth attacking:

1. `src/features/feedback/components` — 72.22%, concentrated in `BugReportEditForm`
   (9.09% statements) and `BugReportDetails` (44.44%). Its page still replaces its
   service, so nothing drives the form through a real response.
2. `src/features/users/model` and `src/layouts` — 60% functions each. The shell had
   no test at all until this round; `users/model` is unchanged and is still the
   cheapest thing here to test.
3. `src/query.ts` — the retry predicate is uncovered because the test client turns
   retries off. Small and cheap.
4. **Nothing is tested below 768px**, and nothing anywhere asserts accessibility.
   Those are not coverage gaps that a percentage shows; they are whole axes the suite
   does not have. `F-019` was found with a screenshot, not by a test.

**Which packages are open, and why.** `P1` is the only one still blocked, and only on
the schema file — everything downstream of it is prepared, so pulling `/v3/api-docs`
and running `npm run schema:types` is the whole remaining step. `P4` (accessibility)
and `P5` (CI thresholds) were not started; both are specified below.

**The one thing that will bite.** Still `F-005`. The panel calls only the legacy
paths, the backend has already built and documented their replacements, nothing is
broken today, and everything breaks on the day they are removed. It is not a bug
report — it is a countdown nobody has started.

## Waiting on the backend

Tracked in [backend-tasks.md](backend-tasks.md), which is the file handed to the
backend team. Genuinely still open: `F1` and `F2` (missing `/system/status`
counters) and `F3` (a bug report has no `statusChangedAt`). `G1` is closed — the
endpoint exists and the panel has not moved to it, which makes it ours.

**Deleted accounts — `I1`, and the request is
[`adminweb-tasks-from-backend.md` §6](adminweb-tasks-from-backend.md).** Showing
`DELETED` accounts in the listing and restoring one was asked for on 2026-09-10.
**Measured before writing any code, and it cannot be started here**: `admin-api.md`
refuses `status=DELETED` with a `400`, excludes soft-deleted rows from both reads
regardless of parameters, refuses `DELETED` as a `PATCH` status, and records that
`USER_DELETED` is neither revertible nor carries a `before` value to restore from.
The question that decides the shape of the whole thing is whether anonymisation is
reversible; if it is not, this is "reactivate an anonymised account" and not
undelete. Panel-side cost once answered: about half a day, listed in that section.

**`H1` is withdrawn.** The notice that the panel had stopped calling
`/activity-logs` was written on 2026-09-09 and reversed on 2026-09-10; the screen
is back ([ADR 0016](adr/0016-the-activity-log-screen-returns.md)) and the panel is
a client of both endpoints again.
