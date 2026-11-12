# Worklog

A handover note per round of work: what was built, what it measured, what it found, and what was
deliberately left. `CHANGELOG.md` records *what changed and why* at the time; the ADRs record
*what was decided*; this records **what a round actually did**, including the parts that produced
nothing and the mistakes made on the way, because both are expensive to rediscover.

---

## 2026-09-09 — the five-layer test package

**Scope.** Bring the test suite to the backend's layer discipline. Add tests and documents only:
no production code, no visual change. Every defect found is recorded and deferred, not fixed.

**Result.** 43 files / 348 tests → **47 files / 1138 tests and 3 skipped**. Playwright 4 specs /
11 tests → **10 specs / 68 tests**. Coverage 92.55 / 85.62 / 90.77 / 94.43 →
**92.96 / 86.46 / 91.52 / 94.61**. **Twelve findings opened; eleven deferred and one — `F-030` — fixed on its own afterwards.**

### The layers, in the order they were built

| # | Layer | Scanned | Found |
| --- | --- | --- | --- |
| 1 | Call surface | 106 methods, 42 endpoints, 46 calls | **nothing** |
| 2 | Contract | — | **not built**; no schema in the repository |
| 3a | Resilience, service layer | 42 endpoints x 14 answers = 588 cases | F-026, F-027 |
| 3b | Resilience, screen layer | 6 screens, 123 cases | F-028, F-029 |
| 5 | Accessibility (jsdom) | 8 routes, every rule that runs without layout | F-030 *(since fixed)*, F-031, F-032 |
| 4 | Real browser (Chromium) | 8 routes; 103 targets; 407 contrast nodes; 4 tables at 2 widths | F-034, F-035, F-036, F-037 |
| 6 | End-to-end | 2 new flows + a network check over 8 routes | **nothing** |
| — | Mutation testing | — | **not built**, deliberately |

Built in the order 1 → 3 → 5 → 4 → 6, because layer 5 produces layer 4's list: the two rules
jsdom cannot answer are switched off by name there and measured in Chromium here.

### What each layer answers, and what it does not

The full table is `docs/testplan.md` §3a. The three limits worth carrying in your head:

- **Layer 3b does not reach detail views.** The user profile modal, the audit detail panel, the
  bug-report modal and the catalogue edit modals each need a second request and an interaction.
  A missing field inside any of them is caught by nothing in this suite. **This is the round's
  largest stated gap.**
- **Layer 4 measures nothing below 800px.** Not because it was skipped — because `F-019` puts the
  navbar across the whole viewport at 320, 480, 640 **and 768**, so the panel is not on screen to
  measure. Recorded as *not measured*, which is not the same as passed.
- **Layer 4 can decide 46 of 407 contrast nodes.** `F-035`. The rest come back `incomplete`
  because axe cannot compute a ratio against a gradient background.

### Findings — all deferred, all in `docs/TODO.md` with a cost

| ID | Severity | What |
| --- | --- | --- |
| F-026 | Minor | A `204 No Content` throws a `TypeError` in four services |
| F-027 | Minor | There is no request timeout anywhere |
| **F-028** | **Major** | An enum value the panel does not know takes the whole screen down — 3 mechanisms, 1 cause |
| F-029 | Major | Two unguarded `.length` reads on non-optional fields |
| ~~F-030~~ | Major | Two progress bars with no accessible name — **fixed**, one line, the only production change in the round |
| F-031 | Minor | A refused sign-in address is not tied to the field it refuses |
| F-032 | Minor | The actions column has an empty header, in four tables |
| F-033 | Minor | One flaky end-to-end run, not reproduced |
| **F-034** | **Major** | A colour-contrast failure on the dashboard, 3.56:1 |
| F-035 | Minor | 89% of the panel's contrast cannot be measured automatically |
| F-036 | Minor | Every table needs horizontal scrolling below ~1300px |
| **F-037** | **Major** | Touch targets under 24x24 everywhere except the one control `A2` measured |

`F-024` was **updated, not fixed**: the flaky test is identified —
`src/App.integration.test.tsx:109` — and measured as predating this round (one failure in ten
with these changes removed). The cause is still unidentified.

`F-006` gained a second source: the backend raised the same thing independently as **`F-42`** in
its own findings. The panel does not call `/data/lectures/all` or `/data/professor/all`, so a
record switched to `active = false` cannot be found again to correct or reactivate.

### Every deliberate break, and the red it produced

No layer is self-verifying. Each was made to fail on purpose and then reverted; repeat this
whenever a layer is extended.

| Layer | Break | Red seen |
| --- | --- | --- |
| 1 | `/users/{id}/block` → `/blocked` | `x 'users.block'` — 1 failed / 53 passed |
| 1 | an unclassified `UserAccountsService.suspend` | `expected [ 'UserAccountsService.suspend' ] to deeply equal []` |
| 1 | `withQueryString` keeps `''` | `q=` in the URL, 2 rows red |
| 1 | client always sets `Content-Type` | **34 failed / 20 passed** |
| 1 | `ContentService` key hard-coded to `'comments'` | `x 'answers.getAll'` + the generic-derivation test |
| 3a | `409` mapped to `BadRequestError` | **42 failed / 546 passed** |
| 3a | a guard added to `toSystemStatus` | the pinned `204` case goes red — *a fix is noticed as loudly as a regression* |
| 3b | `enumLabel` guarded | **10 of the 14 F-028 cases** go red — which is how the three mechanisms were told apart |
| 3b | `void user.biography.length` in `UserTableRow` | a case on a previously clean screen goes red |
| 5 | one `aria-label` removed | `[critical] button-name`, reported *on top of* the known violation |
| 4 | `ContentTable`'s holder set to `overflow-x: visible` | `overflows by 382px and its holder does not scroll` |
| 4 | `Sign out` given `height: 12` | pin goes red, `"61x21"` → `"61x12"` |
| 4 | `ContentEditModal` given `trapFocus={false}` | `focus after 5 tabs` |
| 6 | `catalogHandlers` removed | `Lectures & Professors is served entirely by the mock backend` fails |
| 6 | the escalation control rendered regardless of `gitlabEnabled` | the withheld test fails |
| 6 | the users handler accepts a block without applying it | the listing assertion fails |

### Mistakes made while building this, kept because they cost time

- **A false green in layer 5.** Route markers were page *titles*, and every title is also a
  sidebar link — so the scan ran while two screens were still spinners and reported **eight clean
  routes**. Switching to page descriptions turned up `F-032` immediately. The file's own comment
  warns about exactly this.
- **A vacuous assertion in layer 4.** The table-overflow test did `if (table.scrollable) continue`
  — which skips every table that overflows, so it measured only the tables that could not fail.
  Found by trying to make it go red and failing.
- **A wrong filter in layer 6.** The network check matched `url.includes('/api/')`, which catches
  Vite's own module URLs (`/src/api/client/index.ts`) and reported fifteen escapes on a page that
  made none. Matching the *path* is what makes it true.
- **Two harness bugs mistaken for crashes in layer 3b.** The Dashboard has no "Dashboard" heading
  (the shell greets the operator) and `DashboardPage` calls `useNavigate`, so it needs a router.
  Both looked exactly like defects until they were read.

The pattern in all four: **the test was wrong in the direction of passing.** That is why every
layer here carries a guard against being vacuous, and why the deliberate break is the only thing
that actually establishes one works.

### Decisions worth not relitigating

- **`node:fs` was not added to `src/`.** `tsconfig.app.json` sets `"types": ["vite/client"]`;
  `src/` is browser code. The plan had layer 1 writing its figures to a JSON file; that was
  dropped rather than widen the boundary. The test asserts the *partition* instead, and the count
  goes in the documents as a dated snapshot.
- **`DOM` was not added to `tsconfig.e2e.json`.** Same boundary, opposite conclusion: `page.evaluate`
  bodies genuinely run in the page, so the two specs that measure layout carry
  `/// <reference lib="dom" />` per file and the guard still holds for every other spec.
- **`jest-axe` was not used.** Vitest 4 compatibility unverified, and a matcher would swallow the
  readable violation dump.
- **The exemption list claims only what was observed.** It was going to exempt the eleven
  `ApiError` subclasses; discovery never returns them, so a third ratchet test now fails if the
  list names a class discovery does not produce.

### Gate at handover

```
npm run check      clean — 278 files, 906 edges, no cycles; every public symbol documented
npm test           47 files, 1138 tests, 3 skipped
npm run test:e2e   10 specs, 68 tests (Chromium only, MSW only)
npm run build      clean
npm run test:coverage   92.96 / 86.46 / 91.52 / 94.61
```

**Not committed.** The working tree carries this round's changes plus the earlier
`VITE_API_BASE_URL` fix (`F-025`) from a separate session, which was left in place deliberately.

### If you pick this up next

1. **`F-012`, `F-034`, `F-036` and `F-037` all want the same visual pass** over the same four
   tables at the same widths. Doing them together is most of a day; doing them separately is
   three days of looking at the same screens.
2. **`F-028` is the one that will bite**, because `consumer-findings.md` C-10 already records the
   audit action list as three values behind the backend.
3. **Layer 3b's detail views** are the obvious next layer, and the machinery is already there —
   `degradedPayloads` only needs a way to open each modal.

### Committed

**Committed to `main`** on 2026-09-10, in eleven commits: one carrying a separate session's
`VITE_API_BASE_URL` fix (`F-025`), one per layer, one for the coverage reporter, one for the
documents, and one for the `F-030` fix and its own documentation. No `Co-Authored-By` trailers.

**Not fully pushed, and this needs a person.** `origin/main` is at
`docs: record the five test layers and what they found`; the last two commits — the `F-030` fix
and its documentation — are local. `git push` fails here with
`could not read Username for 'https://gitlab.kit.edu'`: the remote is HTTPS and this environment
holds no credentials for it. Run `git push origin main` from a shell that has them.

Final gate, read off the run rather than remembered:

```
npm run check           clean — 280 files, 914 edges, no cycles; every public symbol documented
npm test                47 files, 1138 tests, 3 skipped
npm run test:e2e        10 specs, 68 tests (Chromium only, MSW only)
npm run build           clean
npm run test:coverage   92.96 / 86.46 / 91.52 / 94.61
```

**Nineteen items on the deferred list**, each with what it is, how it was measured, why it was
not fixed, and what fixing it costs.

---

## 2026-09-10 — the activity log back, the DELETED measurement, and the modal layer

**Scope.** Three jobs, in order: restore the Activity Log screen deleted the day before; measure
whether `DELETED` accounts can be listed and restored, without writing code; and widen the
browser layer from eight routes to every modal, form and keyboard path.

**Result.** 47 files / 1138 tests → **48 files / 1196 tests and 3 skipped**. Playwright 10 specs
/ 68 tests → **13 specs / 172 tests**. Coverage 92.96 / 86.46 / 91.52 / 94.61 →
**93.09 / 86.61 / 91.56 / 94.76**. **Five findings opened, three defects fixed, one finding
reduced from 14 cases to 12 — and one of its two closed cases turned out to have been
misdiagnosed.**

### Job 1 — the Activity Log screen

[ADR 0002](adr/0002-delete-the-activity-log-screen.md) is **superseded by
[0016](adr/0016-the-activity-log-screen-returns.md)**, and 0002 is not deleted.

The removal was **four commits, not one** — `5248a03` the API services, `7b756b0` the route
string, `4739c27` the screen and nav, `026b57a` the help section, `aa6c316` the last stale
comment — and `54e02df` separately deleted `useCursorLogPage`, the shared reader both screens
used. Reverting any of them would have produced a screen written against a tree that no longer
exists. It was rebuilt instead.

0002 predicted the cost: *"restoring it means writing it again… the cost is a copy, not a
design."* The point of this round was not paying it that way. `src/features/audit-logs/` became
`src/features/logs/`, holding both screens over one reader, one filter bar, one table, one row
and one details modal. What differs is a **value** — `logScreen.ts` — and not a shape.

**Undoing is expressed by type, not by a flag.** The domain already split `AuditEntry` from
`AuditLog extends AuditEntry`. `LogDetails` takes a slot; the audit page composes `RevertSection`
into it; the activity page is typed on `AuditEntry`, which has no `revertible`. A
`revertible: boolean` on the screen record would have implied the activity screen could have
one. It cannot, and now it cannot be given one by accident.

Two contract gaps closed on the way, both from `consumer-findings.md`: **C-10**, the compiled
audit action list being three values behind the backend, and **C-11**, `actorType` wired end to
end except for the form control — which had gone with the activity screen and is now the
activity log's "Who" filter. The audit screen deliberately does not offer it.

### Job 2 — DELETED accounts: measured, not built

The request was to list `DELETED` accounts and restore one. **It cannot be started in this
repository**, and the reason is four separate refusals in `admin-api.md` rather than work nobody
has done:

1. `GET /users` answers `status=DELETED` with a `400` — `Deleted users are not listed`.
2. Soft-deleted rows are excluded from **both** reads regardless of parameters, so lifting the
   filter alone changes nothing.
3. `PATCH` refuses `DELETED` as a status, and the document gives the reason: the identifying
   fields are already scrubbed.
4. The audit log is not a way in either. `USER_DELETED` is off the eleven-action revertible
   whitelist, so a revert is refused with `ACTION_NOT_REVERTIBLE` before `TARGET_MISSING` is
   ever evaluated — and the entry carries no `before` value to restore from, because *"nothing
   in the log carries the removed data"*.

**The headline, which has to be said before anybody builds this:** soft-delete anonymises, so a
restored account's username and e-mail are gone. What would come back is the id, the warnings and
the history attached to scrubbed fields. That is a different feature from undo and needs a
different name in front of whoever asked for it.

Written as §6 of `adminweb-tasks-from-backend.md` — the page the two teams pass between them —
with pointers from `backend-tasks.md` §I1 and `TODO.md`. Panel-side cost once answered: about
half a day, none of it startable now.

### Job 3 — the modal, keyboard and fault layers

`docs/testplan.md` §3a named the gap: *"Layer 3b does not reach detail views… this is the
round's largest stated gap."* Eleven modals and four forms are now opened and measured at 800,
1024 and 1440 for overflow, target size, contrast in three buckets, tab order, focus trap,
Escape and focus return. Four flows are driven with **no `click()` in the file**. Every
`?fault=` state is measured rather than screenshotted.

**The gap moved rather than closing, and the plan says so.** `surfaces.spec.ts` measures layout,
naming and focus; it does not send payloads. *A missing field inside a detail view is still
caught by nothing in this suite.*

### Findings

| ID | Severity | What |
| --- | --- | --- |
| **F-038** | **Major** | Contrast fails inside **six of the eleven dialogs** — the half of `F-035` the gradient was hiding |
| F-039 | Major | Controls with no accessible name inside modals — **eleven surfaces on the first run**; partly fixed |
| F-040 | Minor | Touch targets under 24x24 inside the two catalogue editors |
| **F-041** | **Major** | The demo backend served **no catalogue rows at all**, so every catalogue figure the browser layer recorded was measured against an empty table |
| **F-042** | **Major** | Once the `Professors` field has been focused, **Escape never closes the lecture editor again** |

Three defects fixed, each one file and invisible: the unnamed close button on **all eleven**
dialogs and the unnamed `Select` clear buttons (both one `defaultProps` line on the theme), and
`ConfirmModal` dropping focus on `document.body` when it closes.

**`F-028` went from 14 cases to 12, and its account of the other two was wrong.** Sharing the row
meant guarding it. The finding attributed the audit screen's two cases to `auditActionColor`
alone; removing each guard on its own turns *both* cases red on its own, so the action went
through **two** unguarded mechanisms stacked and the original triage could not see the second
because the first crashed first. `enumLabel` is still unguarded on the other four screens: what
an unknown enum should *read* as there is a wording decision, and that is the three hours it was
deferred for.

### Every deliberate break, and the red it produced

| Layer | Break | Red seen |
| --- | --- | --- |
| 3b | `logEnumLabel` unguarded | the two ex-`F-028` audit cases go red **on their own** |
| 3b | `auditActionColor`'s type guard removed | the same two go red **on their own** — which is how the stacked mechanism was found |
| 1 | activity reader pointed at `AUDIT_LOG_RESOURCE` | **9 red across three files**, including the response-key case written for it |
| 6 | `activityLogHandlers` dropped from the list | `Activity Logs is served entirely by the mock backend` fails |
| 4 | `logEnumLabel` unguarded, again | `?fault=unknown-action` fails in Chromium on the absent-action entry |
| 4 | *(observed, not induced)* the close-button fix | eleven `unnamed` pins went from red to green together |

The ratchet also caught the `LogReaderService` rename **in both directions before anything else
did** — two discovered methods nothing swept, and two `covers` entries naming methods that no
longer existed. Asserting both ways is what made the second half visible.

### Mistakes made while building this, kept because they cost time

- **One naming function, four copies.** `measure.ts` began as four separate `page.evaluate`
  bodies, and the first read `aria-label` and nothing else — so every `<label>`-associated input
  came back nameless and the first run reported a dozen unnamed controls that are in fact
  labelled. A function cannot be passed into an `evaluate` body, since arguments are serialised,
  so the only way to have one definition of "named" is to have one call. `controlsIn` is that.
- **Pins written from an unsettled measurement.** axe read half-faded modals and the same page
  answered `3 passed / 0 failed / 5 undetermined` on one run and `7 / 1 / 0` on the next. The
  first `KNOWN_CONTRAST_FAILURES` was written from those numbers and was wrong. `settled()`
  waits for the animation; the numbers have been identical across three runs since.
- **A fixture gap that reads exactly like a clean measurement.** The catalogue's modals could
  not be reached because the demo backend had no lectures — and the same absence had been
  quietly reporting a clean `Lectures & Professors` in the layout and target layers for a whole
  round. `F-041`. **An empty list passes every assertion you can write about a list.**
- **A row measured as an opener.** The `?fault=unknown-action` fault first served an action that
  was merely *unknown*, and would have proved nothing: a string the panel has never seen never
  crashed. Only an **absent** action reproduces `F-028`. Both are in the fault now, because in a
  bug report they are indistinguishable and they are not the same thing.

The pattern, again: **the test was wrong in the direction of passing.**

### Decisions worth not relitigating

- **One feature folder, not two plus a shared one.** Two folders sharing 90% of their files is
  the arrangement 0002 rejected as "keep both and factor out the duplication". One folder with
  two screens is a different thing: it is one screen family with two vocabularies, which is what
  the backend actually serves.
- **`enumLabel` was left unguarded.** Guarding it globally closes ten more `F-028` cases and
  makes a wording decision for four screens this round did not look at.
- **The audit screen still has no actor-type filter**, though the control now exists. Adding a
  control to a shipped screen is a visual change.
- **`NumberInput`'s steppers were left unnamed.** `closeButtonProps` and `clearButtonProps` exist
  and were used; `NumberInputProps` has no equivalent, so naming those needs the Styles API or a
  wrapper — which is not a one-line change and not an invisible one.

### Gate at handover

```
npm run check           clean — 287 files, 954 edges, no cycles; every public symbol documented
npm test                48 files, 1196 tests, 3 skipped
npm run test:e2e        13 specs, 172 tests (Chromium only, MSW only)
npm run build           clean
npm run test:coverage   93.09 / 86.61 / 91.56 / 94.76
```

### Committed, not pushed — and this needs a person, again

Committed to `main` in six commits: the backend's inbound revision as its own, the fold, the
screen, the deleted-account request, the two accessibility fixes, the measurement package, and
the documents.

**`git push` fails here for the same reason it failed last round**, and the same sentence is
still the fix:

```
fatal: could not read Username for 'https://gitlab.kit.edu': No such device or address
```

The remote is HTTPS and this environment holds no credentials for it. `main` is **11 commits
ahead of `origin/main`**, which is still at `docs: record the five test layers and what they
found`. Run `git push origin main` from a shell that has them. Nothing else is outstanding.

**One thing worth knowing about this round's history.** Partway through, the working copy was
left on a **detached HEAD at `af4fcb9`** while `main` still carried the work. Nothing was lost —
`main` was never moved and the reflog showed the checkout plainly — but for a while the browser
was serving a tree without the activity log while the tests that had just passed described one
with it, which is a confusing ten minutes. If a measurement disagrees with a test that passed a
moment ago, check `git status` before checking the code.

### If you pick this up next

1. **`F-034`, `F-038`, `F-012`, `F-036`, `F-037` and `F-040` are one afternoon together and
   three days apart.** They are the same theme tokens and the same widths over the same tables
   and the two catalogue dialogs.
2. **`F-042` is the one that will cost more than it looks.** It is an interaction between
   Mantine's `Modal` and its `Combobox`, and the measurement is press-by-press in the finding —
   start there rather than reproducing it.
3. **Layer 3b still does not send payloads into modals**, and now that `surfaces.ts` knows how
   to open all eleven, that is a much smaller job than it was.
4. **`DELETED` accounts are blocked on the backend**, and the one question that decides the shape
   of the whole thing is whether anonymisation is reversible.
