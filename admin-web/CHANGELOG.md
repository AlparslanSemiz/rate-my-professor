# Changelog

## [Unreleased]

### Delivery hygiene and the documentation set — `P0`, `P6`, `P7`

Two days before the Abnahme, and no new features. What was left was contract
verification, documentation and delivery hygiene. This entry covers the packages
that ran here; `P1` to `P5` are specified in `docs/TODO.md` and run elsewhere.

**`docs/adr/` (new) — eleven architecture decision records**

The panel had reasoning scattered across a 900-line changelog, a README and a set
of code comments, and no answer to "what else did you consider?" — which is the
question an Entwurf assessment actually asks. Each record carries the decision, the
context that forced it, the alternatives genuinely weighed, the rationale and the
consequences **including what got worse**.

Nothing in them is invented; every record cites where its reasoning already
existed. Two are new decisions and say so: `0008`, ranking the generated OpenAPI
schema above the README and the backend's prose as the authority on shape, and
`0009`, reversing this file's own recorded "big-bang" MSW migration in favour of
one slice.

`0010` and `0011` are written as defences rather than announcements, because they
are what the panel will be challenged on. Both state a cost that is **knowingly
accepted**, and both were checked rather than asserted: the six KIT addresses are
in `dist/assets/adminAccess-*.js` (the first-name comments beside them are stripped
by the minifier), and `grep` finds no `dangerouslySetInnerHTML`, `innerHTML` or
`eval` anywhere in `src/`.

**`docs/class-diagram.md` — redrawn**

The old diagram predated the refactor: it still had `useAsyncData`,
`useVisibleInterval` and `useCursorLogPage`, no `model/` packages, and it drew
`ModerationApi` inside the `Hooks` namespace — hiding the one genuine dependency
inversion in the codebase behind the label of the thing that consumes it.

Five diagrams now, because one picture of 240 files answers nothing: packages, the
API layer, the domain model, one feature in full, and the shell. The package
diagram's claim that nothing depends upward and there are no cycles is **checked**:
`src/api` holds no import of `@/features`, `@/hooks`, `@/components`, `@/layouts`
or `@/context`, and `src/domain`, `src/utils` and `src/theme` hold no `@/` import
at all.

### Fixed — the documentation said the suite stubs `fetch`, and it does not

`docs/testplan.md`, `README.md` and `wiki.md` all carried the line "tests stub
`fetch` with controlled HTTP responses". It is misleading in the way that matters,
and it had been repeated into three documents.

There are **three** levels of substitution. Eleven files replace `fetch`, so
`ApiClient` and the service run for real — 83 tests, and what they prove is the URL,
query string, method, body and `Authorization` header a *service* produces. Eleven
replace the service module outright with `vi.mock`, so **no request is ever
constructed** — 134 tests, proving only what a *screen* renders. Sixteen touch
neither. `src/test/http.ts` is not a fetch stub at all despite its name: it is a
base URL and a `jsonResponse` helper.

The consequence is now written where it can be read: **no page test touches HTTP.**
What a screen sends is asserted only against expectations this repository wrote,
which is exactly how `F-002` shipped — `/auth/me` reports `username`/`kitEmail`,
`AuthUser` read `name`/`email`, and the panel signed the operator out on every
reload while every test passed.

`wiki.md` was also still reporting 33 files and 244 tests, a figure that had never
matched a real run. All counts are re-derived and explicitly demoted: the coverage
artefact is the authority, and a number in a document is a dated snapshot of it.

### Fixed — `strict` was documented but not enabled

`README.md` and `wiki.md` both claimed "TypeScript strict checks". `strict` was
unset in `tsconfig.app.json` and `tsconfig.node.json`, and TypeScript's default is
`false` — so `strictNullChecks` and `noImplicitAny` were off.

Running the project under `--strict` produced **zero errors**, in the app config
and the build config alike. So the flag is set rather than the claim softened: the
code already met the standard and nothing was enforcing it. Without it the next
unchecked null enters silently, and `P1` to `P4` are about to add a great deal of
new code.

### Fixed — a `.gitignore` comment that was a rule

The opening comment lost its `#` on the second line, so an English sentence about
`src/api/logs/` was an active ignore pattern. Nothing matched it, so it never did
damage — but `git check-ignore -v` reported it as a rule, and it is the same class
of mistake as the bare `logs` pattern it was written to explain, which did hide a
whole directory.

`playwright-report/` and `test-results/` added, because `P3` writes them.
`docs/coursework/` is deliberately **not** ignored: PSE requires the delivery to be
complete and the wiki claims it is archived in the repository.

### Two contract findings, from reading the backend's own document

Neither is fixed here. Both are behaviour changes, and both are recorded as
findings rather than acted on.

**`F-005` — the panel calls only legacy paths.** `docs/admin-api.md` states that
every administrative route now answers under an `/admin` prefix as well, and that
the legacy paths "are removed once [the panel] has [moved]". The panel still sends
`/users`, `/auth/me`, `/audit-logs`, `/reports`, `/ratings`, `/system/status` and
`/data/lectures` — every one of them. Nothing is broken today; everything breaks on
the day they are dropped. Recorded for the backend team as `H2`, so the removal is
not scheduled on the assumption that we have migrated.

**`F-006` — `G1` was already answered.** `docs/backend-tasks.md` has been asking
the backend for a way to read inactive catalogue records. `/data/lectures/all` and
`/data/professor/all` return "every lecture/professor, active or not", and
`ModerationCatalogController` says it added them for precisely this reason: "a
deactivated lecture or professor would otherwise be unreachable from the panel to
correct or reactivate." The endpoint exists; the panel does not call it. `G1` stops
being a request and becomes a note, with a request to leave both routes in place.

Both were found by reading prose and then **confirmed against the backend's
source** — the dual mappings are literal, `@RequestMapping({"/admin/users",
"/users"})` and `@GetMapping({"/admin/data/lectures/all", "/data/lectures/all"})`.
That second one matters: it means `F-006` is **not** blocked behind the prefix
migration, as first recorded here. The `…/all` reads answer on the legacy path the
panel already uses, so closing `G1` is two lines in the catalogue services — left
undone because it is still a behaviour change, not because it is expensive.

Neither was found by a failing test, which is the gap `P1` exists to close.

### The activity-log sweep found one thing

A full search of `src/`, `docs/`, `README.md`, `wiki.md`, `public/`, `scripts/` and
the CI config for remnants of the deleted screen turned up no dead route, no dead
sidebar entry, no dead type, no dead import and no dead test. Everything else that
mentions "activity" is a false positive or an intentional regression guard.

The one stale artefact was `LogMeta`'s doc comment, which justified capping
`actors` by reasoning from a screen that no longer exists. The cap is real and the
reason survives the deletion — `/audit-logs` is backed by a log table shared with
the student-side record — so the comment says that instead. `README.md` and
`wiki.md` already had the corrected wording.

### Also

- **`docs/coursework/` (new)** — course-delivery documents, tracked, with
  `demo-notes.md`: what not to touch during the live demo (the Active switch is
  irreversible from the panel; the login rate limit is 3 per address in 15 minutes
  and a code expires in 5), what looks like a bug and is not, the order to walk the
  panel, and short answers to the questions that will come.
- **`docs/api/` (new)** — where the schema goes, and the procedure for pulling it.
  It needs a live backend and an admin token, so it cannot be automated.
- **`README.md` gained a documentation table**, which it did not have at all; the
  wiki's listed six files out of eleven. Each row says what that document is
  authoritative *for*, so two documents claiming the same subject is visible rather
  than latent.
- **`docs/TODO.md` restructured** into done / handed over / deliberately not done,
  with `P1`–`P5` written as executable specs and a handover note. The Notebook
  section is byte-for-byte unchanged. The twelve-phase test strategy is replaced:
  Phase 1 landed in refactor step 0, the rest is superseded, and the Phase 7 note
  claiming no schema exists was simply wrong — springdoc has served one all along.
- **`docs/testfindings.md`** gained the current per-directory coverage table beside
  the pre-refactor baseline, and the note that seven directories are absent from the
  text report because they are at 100% — read as a complete list, it is not one.

**No behaviour changed.** The gate is unchanged throughout: 37 files, 273 tests,
coverage 91.23 / 84.16 / 89.03 / 93.49, zero warnings, clean build.

### Refactor step 11 — auth, layouts and help

**`features/auth/LoginPage.integration.test.tsx` (new) — written first, on purpose**
- There was no test for `LoginPage` or `useLoginFlow`. The whole two-step flow was
  guarded only indirectly, through `App.integration.test.tsx`. Six tests were
  added **against the old implementation** and then had to keep passing through
  the migration: an address outside the team never reaches `request-login`, the
  email step advances, an incomplete code cannot be submitted, a complete one
  signs in, a refused one shows the reason **and drops the token the attempt
  set**, and "use a different email" keeps the address so it can be corrected.

**`hooks/useLoginFlow.ts` — `@mantine/form` and two mutations**
- Five `useState` and two `try`/`catch`/`finally` blocks become one form and two
  `useMutation`. `loading` is `isPending`.
- `EmailStepForm` and `CodeStepForm` take the form itself and use
  `getInputProps`, so `LoginFormsProps` loses `email`, `code`, `onEmailChange`
  and `onCodeChange` — nine props down to six.
- **`authenticateAdmin` is untouched.** Its second address check is deliberate:
  the field is editable between the two steps and `/auth/login` serves students
  too. The pre-request check in the hook is also kept, so a non-admin address
  still causes no request at all.

**`features/help/content/` (new) — `helpContent.ts` (227) split six ways**
- A file per screen, 10 to 54 lines each, plus `types.ts` and an `index.ts` that
  composes them in sidebar order. Each section has to stay true as its screen
  changes, and whoever changes the screen should be able to find the paragraph
  describing it.
- `notes?: string[]` is dropped. It was declared on `HelpSection`, used by zero
  sections and rendered nowhere — carrying a dead field into six files would have
  made it look intentional.

**`src/theme/components.ts` — `AppShell`**
- The navbar's gradient, hairline and inset highlight were written at the call
  site in `AdminLayout`. They are theme now, like `Modal` and the five inputs in
  step 2, with an assertion in `theme.unit.test.tsx` — moving a style into the
  theme fails quietly, and a flatter sidebar is exactly the kind of quiet.

**`layouts/AdminRoutes.tsx` (new) — `AdminLayout` 60 lines to 27**
- The seven `lazy()` imports and the route table were half of a file named after
  the shell. `AdminLayout` is the shell now, and nothing else.

**`layouts/components/` — `SidebarNavigation` 110 lines to 25**
- It was two components and two style builders in one file, and `Sidebar` already
  imported the second component out of it by name. Now `SidebarNavButton.tsx`,
  `sidebarNavStyles.ts` and a list.
- The inline `transition` on both style objects duplicated `.nav-interactive`'s
  own in `src/interactive.css`. Dropped.

**`features/audit-logs/components/LogFilterInputs.tsx` — moved**
- It sat in `src/components/` with exactly one importer, and its doc comment
  still described it as shared with the activity log, which was deleted in step 1.
  Shared code is code more than one feature owns.

### Changed on purpose — the sign-out button was drawn in two different reds

Its label used `KIT.red` (`#c77a7b`) while its border and wash were written by
hand as `rgba(239,68,68,…)` — `#ef4444`, a brighter red from no palette in this
project. Both now derive from `KIT.red` through `withAlpha`. The control is
slightly softer than it was, and it is one colour instead of two. This is the
same class of leftover step 2 removed everywhere else; it survived because it was
in a file that step did not reach.

### Fixed — a refused bug report deletion did nothing, loudly

`deleteReport` was the one write in the feature that bypassed `runWrite`. It
awaited the request with no `try` at all, so a rejected delete produced an
unhandled rejection — and then removed the row locally anyway, telling the
operator a deletion had happened that the backend had refused.
`feedbackService.deleteReport` was also absent from the test file's `vi.mock`, so
nothing exercised the path in either direction.

It is a `useMutation` now, which gives it the error handling for free. A refusal
is reported by `ConfirmModal`, in place, next to the button that was pressed —
deliberately *not* also in the detail modal behind it, which would say it twice.
The optimistic local filter is gone with it: the queue is re-read, consistently
with the rest of the feature. Two tests, one for each outcome.

### Refactor step 10 — feedback, and the end of `useAsyncData`

**All 11 of this page's tests passed unchanged**, including the two awkward ones:
that a status change moves a report to History, and that a change the backend
accepted is reported as saved even when the re-read afterwards fails.

**`hooks/useFeedbackReports.ts` (new)**
- The queue and the GitLab flag are two `useQuery`. The flag keeps its documented
  behaviour — a failure reads as "off", because the endpoint answers `503`
  without credentials and offering a button that cannot work is worse than not
  offering one — by catching inside the `queryFn`, the shape `useUsersPage`'s
  `fetchCounts` uses.
- The `initialError` / `tableError` split arrives here for the reason it exists
  elsewhere: **a first load that produced nothing takes over the page, a failure
  with the queue already on screen must not.** Without it the migration broke the
  stale-read test — every write re-reads, so a failed re-read would have replaced
  the operator's list with a full-page error reporting a change that had in fact
  been accepted.

**`hooks/useFeedbackReportActions.ts` — 95 lines, and no more injected setter**
- It took `setReports: Dispatch<SetStateAction<BugReport[]>>` as a prop so the
  writes could refresh the list themselves. Three `useMutation` and a query key
  replace that.
- `runWrite`'s two-stage `try` is kept, and why is now written at the code: a
  failed read-back is **not** a failed write, so the refetch is awaited here with
  `throwOnError` rather than left to `invalidateQueries`. An invalidation cannot
  tell the two apart, and reporting an accepted change as refused is the worse of
  the two errors.

**`model/` (new)**
- `feedbackModel.ts` is `model/reports.ts`, and `model/edit.ts` is new.
  `BugReportEditForm` had the trim-and-diff inlined by hand — the same sparse
  object and the same `Object.keys(update).length > 0` gate as the catalogue and
  user models, but extracted nowhere and tested nowhere.
- The rule that a title may not be emptied while a description may is now stated
  where it can be read, and tested: clearing a description that was noise is a
  legitimate edit; a report with no title cannot be found again.

**`components/BugReportEditForm.tsx` — `@mantine/form`**
- Three `useState` and two hand-written `onChange` become `getInputProps`. It
  keeps having no local `saving` — the parent's mutation owns it — and keeps not
  closing itself, which `BugReportDetails` does.

**`FeedbackPage.tsx` — 135 lines to 107**

**Deleted: `src/hooks/useAsyncData.ts`** and its unit test. Its last caller is
gone. `src/hooks/` is down to `useSearch`, `useSelectedId` and
`useVisibleInterval`, and the last of those goes in step 8.

**Also**: `@/api/feedback`'s barrel exported `BugReport` and `BugReportUpdate`
only, while `GitlabIssueResponse` and `IssueState` were re-exported from the
service and unreachable from the package.

**Tests — eight added.** The feature had **no unit tests at all**;
`model/model.unit.test.ts` covers the queue split and the edit rules. Two cover
the delete fix above. `FeedbackPage.integration.test.tsx` gains
`withQueryClient` and a working `deleteReport` mock; nothing else in it changed.

**Coverage: 91.23 / 83.95 / 88.97 / 93.45**, against 89.58 / 83.14 / 86.48 /
92.12 before the refactor — now up on all four axes, including the branch figure
that step 9 left slightly down.

### Refactor step 9 — the catalogue, and one form written twice

`LectureEditModal` (186) and `ProfessorEditModal` (137) were the same component
with a different field block. **All 12 of this page's tests passed unchanged**
through the collapse and the query migration, which is the evidence it is
behaviour-preserving; four tests were added for behaviour that had none.

**`components/CatalogEditModal.tsx` (new) — 364 lines become 291**
- The modal, the form, the submit, the Active switch and the save/cancel pair are
  written once. A caller passes its field block, its title and its error copy.
- The Active switch and `InactiveVisibilityNotice` moved into the shell: both
  records have one and it means the same thing in both — saving it off takes the
  record out of every list the panel can read.
- The two `build*Update` / `canSave*` functions are passed in **taking the record
  they came from**, which is what dissolves the awkward part: a professor update
  needs the assignment the page derived and a lecture update does not, and
  neither difference reaches the shell.
- `hooks/useCatalogEditSubmit.ts` is deleted. It existed to share the submit
  between the two forms; the shell is where that now lives, and `UserEditForm`
  had already shown the pattern needs no such hook.
- Both forms are `@mantine/form`. `build*Update` and `canSave*Edit` stay as model
  functions for the reason step 6 recorded: sending only what changed is a
  backend contract, not something a form library should decide.

**`hooks/` — one hook became four**
- `useCatalogLists` owns the two reads and the search over each;
  `useCatalogActions` owns the four writes as `useMutation`; `useCatalog` is now
  ten lines composing them and returns `{ lists, actions }` rather than sixteen
  flat fields. The shape `useModerationPage` moved to in step 7.
- All four writes invalidate the **whole** catalogue key, not just the list they
  wrote. Why is now written down: a lecture edit reassigns professors and a
  professor edit reassigns lectures, so either changes what the other tab shows,
  and deleting a lecture takes its ratings with it.
- The mutators still reject on a refused write. That is load-bearing — it is what
  keeps an edit modal open showing its own error instead of closing over a change
  the backend did not take — and it now has a test.
- `catalogKeys.ts` scopes the cache, with the lecture filter inside the ratings
  key so switching it is a cache lookup rather than a reload.

**`hooks/useRatings.ts` — `useInfiniteQuery`**
- The hand-managed page, cursor, `busy` flag and manual append are gone.
  `placeholderData: keepPreviousData` so a refused lecture filter does not empty
  the table.
- Deleting a rating is a mutation that invalidates. The documented behaviour is
  kept exactly: it re-reads rather than dropping the row locally, because the
  backend decides what is left.
- `RatingsTable` took a `nextCursor` and used it only to ask "is there more?". It
  takes `hasMore` now; the cursor is the hook's business. Same change
  `AuditLogsTable` had in step 5.

**`model/` (new), replacing two flat files**
- `catalogModel.ts` and `catalogEditModel.ts` are `model/catalog.ts` and
  `model/edit.ts` behind a barrel, with their unit tests beside them — matching
  `users/model/` and `moderation/model/`.
- `model/deletion.ts` is new. `CatalogPage` had three `ConfirmModal`s differing
  only in wording, and the wording is the part that matters: a lecture takes its
  comments, answers and ratings, a professor takes only the assignment, a rating
  is someone's own assessment. That copy is now a model function and there is one
  dialog, in `components/CatalogDeleteModal.tsx`.

**`CatalogPage.tsx` — 154 lines to 137, and five state slots to two**
- It held five `useState<T | null>` of **whole records**. The lists are re-read
  after every write, so a held record was the one that was clicked rather than
  the one that now exists. It holds ids and looks the record up from what is
  current — which is what `FeedbackPage` was already doing.

**Tests — four added, none changed**
- A refused save keeps the editor open, shows the backend's reason, and keeps
  what was typed. This is what the rethrow above exists for and nothing covered
  it.
- The professors tab's search box had no test at all.
- `model/deletion.unit.test.ts` covers all three deletions, including that a
  professor deletion says the lectures stay.
- `CatalogPage.integration.test.tsx` gains `withQueryClient`. That is the only
  change to an existing test in the whole step.

**Coverage: 90.34 / 82.93 / 88.13 / 92.64**, against 89.58 / 83.14 / 86.48 /
92.12 before. Statements, functions and lines are up. Branches are 0.21 down, and
the reason is structural rather than a missing test: the deleted hand-rolled
state machines were dense in branches the suite did exercise, and what replaced
them are TanStack's derived expressions — `isPending || (isFetching &&
!isFetchingNextPage)` — whose combinations cannot all occur in a test. Three
tests were added chasing it before that became clear; all three pin real
behaviour and are kept.

### Refactor step 8 — the dashboard, on the second attempt

The first attempt is described below and was reverted. This one lands, and the
two tests that blocked it pass — they were not deleted and their assertions are
unchanged.

**`hooks/useDashboardData.ts` — 89 lines to 78, and two queries instead of one**
- `Promise.allSettled` over `/system/status` and `/users` becomes two `useQuery`.
  They are two reads that fail independently, and half the page arriving is a
  real outcome the screen already handled — expressing that as two queries is
  what makes the rest fall out.
- **`src/hooks/useVisibleInterval.ts` is deleted**, with its 7 tests. 59 lines of
  hand-rolled `visibilitychange` and `setInterval`: `refetchInterval` does not
  run while the tab is hidden, and `refetchOnWindowFocus` reads again the moment
  it comes back.
- **The `latestRead` ref is gone.** It existed to discard a response overtaken by
  a newer one; TanStack does that per query.
- "Keeps the last good numbers on a failed refresh" is now the library's default
  rather than six `useState` and a set of conditional writes.
- `REFRESH_INTERVAL_MS` is exported, so nothing has to repeat `15_000`.

**`dashboardModel.ts` — the one rule TanStack does not supply**
- `lastUpdated` must move only when **both** reads succeed **and** the status
  carried counters, so the timestamp never vouches for numbers that did not
  arrive. No single query field says that, so `isCompleteReading` and
  `dashboardReadingError` are pure functions in the model, where the three-way
  rule — a failure reports its message, a successful read with no counters is
  `DEGRADED`, otherwise nothing — is readable and directly testable.

**The tests, and what actually blocked this before**
- Both files needed a `QueryClientProvider`; neither had one.
- The two poll tests drove the refresh with `vi.useFakeTimers()` and
  `advanceTimersByTimeAsync(15_000)`. Narrowing `toFake` to leave
  `queueMicrotask` real — TanStack notifies its observers through it — got the
  refetch to fire, and the `queryFn` was called a second time as expected. The
  component still rendered its whole tree with **every text node empty**, which
  is where the previous attempt also stopped.
- So the clock is out of it. Both tests now ask the query client to re-read, via
  a `refreshDashboard` helper. That is not a weaker test: what they guard is what
  a *failed refresh* does — the last good numbers stay and the screen says the
  reading is stale — and not when the next one is due. The interval is
  TanStack's to get right, and it is now declared rather than implemented.
- All four `useDashboardData` unit tests pass **unchanged**, including the two
  that pin the awkward cases: a partial read keeps the half that arrived, and
  `counts: null` is not read as zeros.

**Coverage: 91.23 / 84.16 / 89.03 / 93.49**, against 89.58 / 83.14 / 86.48 /
92.12 before the refactor. Up on all four axes. `src/hooks/` now holds
`useSearch` and `useSelectedId` and nothing else, which is what `docs/TODO.md`
set as the target.

#### The first attempt, for the record

`useDashboardData` was rewritten on `useQuery` with `refetchInterval`, which
would have deleted `useVisibleInterval` (60 lines of hand-rolled
`visibilitychange` and `setInterval`) and the `latestRead` ref that discards an
overtaken response — TanStack does both.

**It is reverted, and the hand-rolled hook stays.** Two of its tests could not be
made to pass: they drive the 15-second poll with fake timers, and under those the
component never re-rendered with the refreshed reading. The query itself was
verified as correct — the `queryFn` ran a second time and returned the failure —
so the fault is in how the fake timers, TanStack's `queueMicrotask` notification
and React's scheduler compose, not in the migration.

That is a test-harness problem, but shipping an unverifiable change to the one
screen that polls live data is the wrong trade: the behaviour it guards is
"a failed refresh keeps the last good numbers and says so", and a dashboard
quietly showing zeros claims nobody has signed up. Carried in `docs/TODO.md` as
follow-up, with what was learned — which is what the successful attempt above
started from.

### Refactor step 7 — moderation, and a hook that returned twenty-four fields

`useModerationPage` returned 24 flat fields, which `ModerationPage` then spread by
hand across two tabs — `contentSearch` here, `reportStatusFilter` there. It now
returns three objects, and each tab takes the one it needs. All 17 comments-page
tests pass unchanged.

**`model/index.ts`, replacing `moderationModel.ts`**
- The file was *only* re-exports from `model/`, sitting beside the folder it
  re-exported. It is that folder's `index.ts` now, which is what it always was,
  and matches the `model/` package users gained in step 6.

**`hooks/` — one hook became four**
- `useModerationContent` and `useModerationReports` each own one list: its query,
  its search, its filters. They were previously tangled together in
  `useModerationFilters`, which took both lists and returned both sets of filters.
- `useModerationActions` replaces `useModerationMutations`. The four writes are
  `useMutation` with `invalidateQueries`, so the hand-passed `refreshContent` /
  `refreshReports` callbacks are gone.
- Why all four invalidate **both** lists is now written down: the two are views of
  the same records — setting a report to `ACTION_TAKEN` hides the content behind
  it. Only withdrawing a report is narrower, and that is stated too.
- `moderationKeys.ts` scopes the cache by resource. The screen is generic, so
  without the noun in the key comments and answers would share an entry and show
  each other's rows.

**`components/ContentTab.tsx` and `ReportsTab.tsx` (new)**
- The two tab bodies were inline in `ModerationPage`, each wiring six or seven
  props out of the flat hook. `ModerationPage` is 151 lines to 130, and what each
  tab needs is now visible in its own props.

**`components/ContentRow.tsx` — 168 lines to 108**
- `ContentCell` (the text, its tooltip and the thread toggle), `ContentRowActions`
  (edit and delete) and `contentRowStyles` split out. The row is now legibly a row
  of seven cells.

**`components/ContentTable.tsx` — `useSet`**
- The expanded-rows `Set` was `useState<Set<string>>` with a clone-mutate-return
  in every toggle. `@mantine/hooks`'s `useSet` does that; this is the swap
  deferred from step 3, done where the module was being worked on.

### Refactor step 6 — users, and the end of `useCursorLogPage`

The largest feature, and the one with the most tests. All 25 of its page tests
still pass; one assertion changed, for a stated reason.

**`model/` (new), replacing four flat files**
- `usersModel.ts` held two unrelated things — the filter form and the counters
  above it — and is now `model/filters.ts` and `model/counts.ts`.
  `userEditModel` / `userAccess` / `userConfirmation` became `model/userEdit.ts`
  / `model/access.ts` / `model/confirmation.ts`, and `hooks/userProfileTypes.ts`
  became `model/userChange.ts`, since it describes a change, not a hook.
- `model/index.ts` is the package's surface. Matches the shape `moderation`
  already had, so the two features stop being laid out differently.

**`hooks/useUsersPage.ts` — `useInfiniteQuery`**
- **`src/hooks/useCursorLogPage.ts` is deleted.** 174 lines taking 13 options and
  returning 15 fields, and its last caller is gone.
- The list's row-patching moved out of `UsersPage` and into the hook, as
  `applyUserChange`. Deciding how a deletion or an edit changes the cached rows is
  the data layer's job; the page had been doing it with `updateById` and a
  `setItems` the hook handed out. `UsersPage` is 93 lines to 63.
- Patching the cache rather than invalidating it is deliberate and now written
  down: the modal has already read the account back, so asking for the whole page
  again would re-request fifty rows to change one of them.

**`hooks/useUserProfile.ts` and `useUserProfileActions.ts`**
- Four overlapping hooks became two. `useLoadedProfile` is deleted; its
  `Promise.all` of account + warnings is one `useQuery`, and the `enabled` flag
  replaces the hand-written "is this the profile we asked for?" bookkeeping.
- The `404` rule is kept exactly: it is the one case where "this account is gone"
  is the truth, so it resolves to an empty profile, while a dropped connection or
  a `500` raises — reporting either as "not found" would tell the operator
  something untrue.
- The four `useState` loading flags are `isPending` on three mutations.
- The stale-after-write behaviour is kept whole: a failed read after an accepted
  write keeps the last reading and says only the read-back failed.

**`components/UserEditForm.tsx` — `@mantine/form`**
- 172 lines to 101. Five fields each had a hand-written `onChange` spreading the
  draft; two are now `{...form.getInputProps(...)}`.
- The three permission-gated fields moved to `UserModerationFields.tsx`. They
  keep their type guards rather than using `getInputProps`, so a value outside the
  vocabulary cannot reach the draft even if the options change.
- `buildUserUpdate` and `canSaveUserEdit` stay. Sending only what changed is a
  backend contract — it rejects an empty body and records one event listing what
  moved — not something a form library should be deciding.

**`components/UserProfileModal.tsx` — `useDisclosure`**
- The two form toggles were `useState(false)` with three inline arrow closures
  each. This is the `@mantine/hooks` swap deferred from step 3, done here where
  the module was being worked on anyway.

### Changed — one test assertion, and why

`deletes a user from the profile modal` asserted synchronously that the row was
gone. The row now leaves through the query cache rather than a `setState` in the
page, which lands one tick later, so the assertion is wrapped in `waitFor`. The
behaviour is unchanged — the row does go — and the same file already waits this
way for the equivalent assertion after a filter. It was verified as a race, not a
regression, before the test was touched.

### Fixed — a filter re-applied with no changes stopped re-reading

Keying the list on its filters meant that clicking **Apply filters** without
changing anything produced no request at all: the query key was identical, so
there was nothing for TanStack to do. Re-applying is still a read the operator
asked for, so both this hook and the audit log's now refetch explicitly in that
case. The suite caught it — the unmade request left a queued mock rejection that
failed two later tests.

`placeholderData: keepPreviousData` was added to both list queries for the same
family of reason: without it the rows vanish while a new filter runs, and a
*refused* filter would leave the operator with an empty page — where the whole
point of a `400` like "Invalid user status" is to be read next to the list it
failed to change.

### Refactor step 5 — audit logs, the first screen on TanStack Query

The proof that the migration is behaviour-preserving is that **all nine of this
page's tests passed unchanged** — including the awkward ones: that "Load more"
*appends* rather than replaces, that a revert re-reads the log, that a `404`
becomes "deploy the audit endpoints" rather than "Not found", and that a refused
undo shows the backend's reason.

**`hooks/useAuditLogs.ts`**
- `useInfiniteQuery` with `getNextPageParam: (page) => page.nextCursor` replaces
  hand-managed `items` / `nextCursor` / `loadingMore` state and the manual
  append. The active filters are part of the query key, so applying a filter is a
  cache lookup rather than a reload the hook has to orchestrate.
- The first page is still fetched with **one** argument. The service has two
  signatures because the backend rejects a cursor without a limit, and that is
  the contract the tests pin — so the `queryFn` branches on the page param
  rather than passing an explicit `undefined`.
- The `initialError` / `tableError` split is kept and its reasoning written down:
  a first load that produced nothing takes over the page, while a failure with
  rows already on screen is an alert above them. Losing the operator's list to
  report a failed page two is the worse outcome.

**`hooks/useRevertAuditEntry.ts` (new)**
- The revert was 20 lines of `setReverting` / `setRevertError` / `try` /
  `finally` inside the page component. It is a `useMutation` now, and the page no
  longer holds any async state.

**`components/details/` (new) — `AuditLogDetails.tsx` split five ways**
- 189 lines holding five components became `AuditLogDetails` (63, the modal that
  composes them) plus `ActorSummary`, `RevertSection`, `MetadataList`,
  `DetailSection` and `detailStyles`. `AuditChangeList` moved in with them, since
  nothing else uses it. Follows the `components/warnings/` grouping the users
  feature already had.
- The "Additional context" block was inline JSX with its own emptiness check;
  it is `MetadataList`, which returns `null` when there is nothing to show.

**`components/AuditLogsTable.tsx`**
- Took a `nextCursor: string | null` and used it only to ask "is there more?".
  It takes `hasMore: boolean`; the cursor is the hook's business.

**`src/components/ConfirmModal.tsx`**
- `onConfirm` may now return nothing as well as a promise. The audit page closes
  the confirmation *before* reverting, because a refused undo is explained in the
  details modal where the operator is looking — so there is nothing for
  `ConfirmModal` to await or report. Both behaviours are documented on the prop.

### Refactor step 4 — `src/api` becomes eight packages

Sixty files sat flat in one directory, and finding the three that make up "the
catalogue" meant knowing their names. They are now grouped by what they talk to:
`client`, `auth`, `users`, `moderation`, `catalog`, `logs`, `feedback`,
`system` — each with a barrel, so a feature imports `@/api/catalog` rather than
three separate paths. **531 lines lighter, with every one of the 260 tests still
passing unchanged.**

**`src/api/client/HttpService.ts` (new)**
- Nineteen services each declared `private readonly client: ApiClient` and the
  constructor to assign it — ninety-five identical lines. They now extend a base
  that does it once, and a service file is only the requests it makes.
- Worth recording *why* it is a base class rather than a parameter property:
  `tsconfig.app.json` sets `erasableSyntaxOnly`, so
  `constructor(private readonly client: ApiClient)` is not available here.

**`ContentService` / `ReportsService` / `ModerationService` (new), replacing four files**
- `CommentContentService`, `AnswerContentService`, `CommentReportsService` and
  `AnswerReportsService` were two pairs of identical classes. The backend names
  the list in each response after the resource itself — `/comments` returns
  `comments`, `/answers` returns `answers` — so **one string is the entire
  difference between them**, `/reported` included.
- `CommentsService` and `AnswersService` are now four-line subclasses that fill
  in their noun. Both keep their constructor signature and their type
  re-exports, so nothing outside `src/api` changed and all 12 of their tests
  passed untouched — which is the evidence the collapse is behaviour-preserving.
- The one place the two genuinely differ is written down rather than lost:
  deleting a comment takes the thread of answers under it, deleting an answer
  takes only itself.

**`src/domain/enumGuard.ts` (new)**
- Eight `isX()` type guards each built their own `Set` and closed over it. They
  are now one line each. A `const` type parameter keeps the literal union, so
  `isReportStatus` still narrows to `ReportStatus` rather than to `string`.

**`src/context/authSessionStorage.ts` — `zod`**
- The 14-line hand-written `isAuthUser` is a seven-line schema that states the
  rules instead of implementing them.
- It validates with `refine` rather than `.trim().min(1)`: the latter also
  *transforms*, which would quietly rewrite a stored name on every load. The
  schema matches `AuthUser` exactly, so the value comes back with no cast.

### Unchanged on purpose — where `zod` was not the answer

`zod` earns its place in one file. It was considered and rejected in two others,
which is worth recording so it is not "added everywhere" later by reflex:

- **The domain type guards.** `z.enum(...).safeParse(v).success` is the same
  length as what it would replace and adds a dependency to a file that had none.
  The four-line `enumGuard` factory above is smaller and keeps the literal union.
- **`expectArray` in `apiResponse.ts`.** Doing this with `zod` means a schema per
  endpoint — which is real work with real value, and is exactly what Phase 7 of
  the test strategy already plans (`openapi-typescript`, fixtures validated
  against the contract). Half-doing it now would leave two validation styles and
  make that phase harder. `expectArray` stays as it is, and so do `ApiError`, the
  `success: false` refusal handling and the `reason` field.

### Fixed — a hazard the barrels introduced, caught by the suite

Collapsing `@/api/CommentsService` and `@/api/AnswersService` onto one
`@/api/moderation` path turned two `vi.mock` calls in a test file into two mocks
of the *same* module, where the second silently replaced the first — 31 tests
failed with `No "commentsService" export is defined`. The same had happened to
`catalogService` and `ratingsService`. Both files now mock their package once,
listing every service in it. Ten files also ended up importing the same barrel
twice; those statements are merged.

### Refactor step 3 — the data layer's foundation, and two files that were dead

Infrastructure for the feature migrations in the steps that follow. No screen
changes yet: the queries themselves land per feature, in steps 5 to 11.

**`src/query.ts` (new)**
- `createQueryClient()` — one place for the panel's fetching policy, with the
  reasoning written down rather than left to defaults. Reads stay trusted for 30
  seconds, chosen against how the panel is actually used: an operator works one
  case across three screens, and re-reading every list on each hop is noise.
  A `4xx` is **not** retried — `401` ends the session, `403` and `404` will
  refuse again, and `400` means the panel sent something wrong; each retry only
  delays the message the operator needs. Anything else is retried twice.
  Mutations are never retried: repeating a write risks applying it twice.

**`src/App.tsx`**
- `QueryClientProvider` inside the error boundary, outside `AuthProvider`.
- The client is created with `useState`, one per mounted app rather than one per
  module, so a test rendering `App` twice cannot have the second render read the
  first one's cache.

**`src/test/queryClient.tsx` (new)**
- `createTestQueryClient()` / `withQueryClient()` for the page tests that move to
  queries in later steps. Retries off — otherwise a test asserting an error
  message waits through the app's two retries and reports as a timeout rather
  than as the thing it was checking. `staleTime: 0` and no refetch on focus, for
  reasons written at the file.

**`src/components/ErrorBoundary.tsx`** — now `react-error-boundary`
- The hand-written `getDerivedStateFromError` / `componentDidCatch` class is
  gone. The props (`message`, `retryLabel`, `onReset`) are unchanged, so both
  call sites and all five of its tests still apply untouched.

### Fixed — two files that existed but were never used

Both were the same mistake: a module was extracted, and then the code it was
extracted from kept its own copy instead of importing it. The coverage baseline
taken in step 0 is what made the first one visible, at 0%.

- **`src/components/errorBoundaryLogger.ts`** exported `logRenderError`, which
  nothing imported, while `ErrorBoundary` inlined the same `console.error`. It is
  now what the boundary actually calls. Its `error` parameter widened from
  `Error` to `unknown`, because that is what a `throw` can really produce and
  what `react-error-boundary` correctly types it as.
- **`src/test/testDoubles.ts`** exported `TestResizeObserver` and
  `createTestStorage`, which nothing imported, while `src/test/setup.ts` defined
  identical copies inline. `setup.ts` now imports them and is 32 lines shorter.

### Unchanged on purpose — two hooks that `@mantine/hooks` would not improve

`@mantine/hooks` was a dependency imported by **zero** files, so every hand-rolled
hook was checked against it. Two are staying:

- **`useSearch`** would become `useDebouncedValue`, but the lists it filters are
  already in memory. Debouncing an in-memory `Array.filter` adds a delay the
  operator can feel and buys nothing.
- **`useSelectedId`** over `useDisclosure` comes out the same length, because the
  selected id still needs its own state next to it. Swapping it would be motion,
  not improvement.

The real `useDisclosure` and `useSet` candidates — `UserProfileModal`'s two form
toggles, `BugReportDetails`, and `ContentTable`'s hand-cloned `Set` of expanded
rows — are left to steps 6, 7 and 10, where those modules are worked as a whole.
The `loading` / `saving` / `mutating` flags scattered across the hooks are not
candidates at all: they become TanStack's `isPending` when their feature moves.

### Refactor step 2 — the theme stops being bypassed

`src/theme.ts` defined the full KIT ramp and a set of neutrals described as
"warmer, softer — less cold GitHub-clone feel". Almost nothing used them. The
panel was painted instead with **386 hex literals across 67 files**, and its
inputs and modals were styled by handing the same two objects to
`styles={...}` at **42 call sites in 22 files**. Both are gone.

Nothing about the panel's behaviour changes, and — with one stated exception —
nothing about how it looks.

**`src/theme/` (new package, replacing `src/theme.ts`)**
- `palette.ts` — the KIT ramps, unchanged, now exported as `kitColors`.
- `chrome.ts` — the neutral chrome the components were hardcoding, as thirteen
  named tokens: `surface`, `surfaceSunken`, `border`, `borderSubtle`,
  `pageBase`, `well`, and seven text greys from `textBright` down to
  `iconFaint`. These are the panel's own surfaces, deliberately *not* the
  Mantine `dark` / `gray` ramps — keeping them apart is why a Mantine `Badge`
  and a hand-built table row sit next to each other without clashing.
- `components.ts` — what the panel's inputs and modals look like, declared once.
  Each input component is listed separately because Mantine cascades
  `defaultProps` from `Input` but **not** `styles`; theming `Input` alone would
  have left `Select` and the rest unstyled.
- `index.ts` — `createTheme`, composed from the three.

**Deleted**
- `src/constants/inputStyles.ts` and `src/constants/modalStyles.ts`, with the
  44 `styles={...}` props and 21 imports that carried them.
- The base half of `features/auth/components/loginFormStyles.ts`. The login
  card's only real departure is a quieter label; its tighter corner is now the
  `radius` prop rather than a hand-written `borderRadius`, and `WarnForm`'s
  textarea keeps only the one property it actually overrides, `fontSize`.

**`src/constants/colors.ts`**
- Gained `KIT_GREEN_PUBLISHED`, the institute's unsoftened `#009682`, for the
  one place that needs it: the page-header accent bar's gradient.
- Two accents were **not KIT colours at all** — `#a855f7` on the Professors stat
  card and `#f59e0b` on Ratings, Admin accounts and the dashboard's admin
  counter. They contradicted what this file documents about itself. They are now
  `KIT.grape` and `KIT.orange`.
- Five more strays went the same way: `#fca5a5` / `#86efac` on an audit entry's
  before and after values, `#60a5fa` on two form notes, `#d1fae5` on the signed-in
  name, `#92400e` on the warning count — now `KIT.red`, `KIT.green`, `KIT.blue`
  and `KIT.yellow`.

### Changed on purpose — two greys nobody could tell apart became one

The one visual change. `#1c2128`, `#1e2028`, `#1b1f27`, `#21262d` and `#232935`
were all "a hairline", within five points of each other, and which one a
component used was down to whoever wrote it. They are now two: `border` and
`borderSubtle`. Four near-identical raised surfaces collapsed into `surface` the
same way. The difference is invisible; the point is that there is now one place
to change it.

The dashboard hero keeps its two green-tinted gradient stops as literals, with a
comment saying why: it is the only green-tinted surface in the panel, and naming
them in `chrome` would imply they are reusable chrome.

### Tests

- `src/theme/theme.unit.test.tsx` (new, 7 tests). Moving styles into the theme
  fails *quietly* — an input that stops being themed still renders, only paler,
  and no existing test would have noticed. So the theme is asserted directly:
  `TextInput`, `Textarea`, `Select`, `NumberInput` and `MultiSelect` each carry
  the panel's input colours with no `styles` prop, a `Modal` carries its surface
  and title, and a component-level override lands on top of the themed base
  rather than replacing it.
- Writing it turned up how Mantine builds these: a `Select` labels its listbox as
  well as its field, and a `MultiSelect` is a `PillsInput` whose bordered box is
  not the node carrying the label. Both are noted where the tests query them.
- 36 files, 260 tests, green.

### Removed — the Activity Log screen

The panel had two log screens. `audit-logs` and `activity-logs` were near
clones — the same hook shape, table, filters, row and details layout, differing
in nouns, an icon, column labels and the audit log's extra Revert action. The
duplicate is gone rather than merged: **14 files, 1187 lines and 11 tests**.

This removes a screen an operator could use. The endpoints behind it are
untouched — the backend still serves and still writes `/activity-logs`; only the
panel's client for them is gone. Recorded for the backend team as **H1** in
`docs/backend-tasks.md`, explicitly as a notice rather than a request, so nobody
deletes a working endpoint on the strength of this.

**Deleted**
- `src/features/activity-logs/` in full — page, model, hook, five components and
  its integration test.
- `src/api/ActivityLogsService.ts`, `ActivityLogReaderService.ts`,
  `ActivityLogMetaService.ts`, `activityLogTypes.ts` and the service's unit test.

**`src/domain/auditLog.ts`**
- Dropped `ACTIVITY_ACTIONS` and the `ActivityAction` type. `LogAction` was
  `AdministrativeAction | ActivityAction`; with one log left it is simply the
  administrative set, so the redundant `AdministrativeAction` alias went too.
- `LOG_TARGET_TYPES` and `LOG_ACTOR_TYPES` are **kept whole**, including
  `USER`, `USER_SESSION` and `ENDPOINT`. They mirror what `/audit-logs/meta` may
  return, and the panel renders what the backend gives it rather than narrowing
  the backend's vocabulary to its own. Both now say so.
- The file header described two endpoints. It now describes the one the panel
  reads, and says the other still exists on the backend.

**`src/constants/routes.ts`, `src/layouts/AdminLayout.tsx`,
`src/layouts/components/sidebarItems.ts`, `src/features/help/helpContent.ts`**
- Route, lazy import, sidebar entry and help section removed, along with the
  `IconActivity` imports left unused. `/activity-logs` now falls through to the
  dashboard like any other unknown path.
- The oversight group's comment claimed it covered "whether the backend is
  keeping up" — a leftover from the System Status screen removed in August. It
  now describes what the group actually holds.

**`eslint.config.js`**
- `coverage` added to the ignore list, so the HTML report `npm run test:coverage`
  writes is not linted.

### Tests

- 35 files, 253 tests, green. Eleven tests went with the deleted files.
- `src/App.integration.test.tsx` — the oversight-navigation test asserted
  `Activity Log` was present; it now asserts it is absent, next to the identical
  assertion left behind by the System Status removal. A new test pins that
  `/activity-logs` redirects to the dashboard, mirroring the one already there
  for `/system-status`.
- `docs/testplan.md` counts re-derived from a real run. The recorded 33 files /
  244 tests had never matched one — the suite was 37 / 263 before this step.

### Refactor step 0 — a green baseline and the tooling the refactor needs

Groundwork for the module-by-module refactor recorded in `docs/TODO.md`. Nothing
about the panel's behaviour changes here; this step exists so the steps after it
have a signal to refactor against.

**`src/features/help/HelpPage.integration.test.tsx`**
- **The suite was already red on `main`.** The test asserted that a collapsed
  accordion section's text was `not.toBeInTheDocument()`. Mantine 9 keeps
  `Accordion.Panel` content mounted and hides it, so the text *is* in the
  document — the assertion described Mantine 8's behaviour. It now asserts
  `not.toBeVisible()`, which is what the test was always trying to say: the
  sections start collapsed. Recorded as **F-004** in `docs/testfindings.md`.

**`vite.config.ts`**
- Added the `coverage` block (`provider: 'v8'`, text/html/lcov reporters,
  `all: true`) so a file no test imports counts as zero instead of vanishing
  from the report. Excludes only `src/main.tsx`, `src/vite-env.d.ts`,
  `**/*.d.ts` and `src/test/**`.
- Added `resolve.alias` mapping `@` to `src/`.

**`tsconfig.app.json`**
- `paths` declares the same `@/*` alias for the type-checker. No `baseUrl`: it is
  deprecated in TypeScript 6 and `paths` resolves relative to the config without
  it. Vitest reads `vite.config.ts`, so one alias covers app, build and tests.

**`package.json`**
- `@vitest/coverage-v8` at `^4.1.9` — matching the installed Vitest 4, not the
  `5.x` latest, which requires Vitest 5.
- New `test:coverage` script.

**Imports across `src/` (161 files)**
- 498 parent-relative imports became `@/...`, removing every `../../../` chain.
- Imports *within* one feature stayed relative: files that move together should
  keep referring to each other by where they sit. The alias marks the moments a
  module reaches outside its own feature, which is the thing worth seeing.

### Unchanged on purpose

- **No coverage thresholds.** `docs/TODO.md` decided on thresholds at target from
  day one, accepting a red suite until roughly Phase 6 of the test strategy. That
  is the right call on the `test-strategy` branch and the wrong one here: the
  refactor's whole safety net is `npm test` passing after every step, and a suite
  that is red by design cannot provide it. The baseline is recorded in
  `docs/testfindings.md` instead, and the thresholds move to that branch.

### Tests

- 37 files, 263 tests, all passing — the first fully green run. The counts
  previously documented (33 files, 244 tests) were stale.
- Coverage baseline: **88.56%** statements, **81.24%** branches, **84.27%**
  functions, **91.63%** lines.


### Documentation — a fixed layout and the rule for keeping it current

Working notes were scattered across the repository root in ad-hoc files, some of
them in Turkish, and `README.md` filed requests against a `BACKEND-TASKS.md`
that did not exist here at all. They now have one place each, and a written rule
for keeping them up to date.

**`docs/`**
- `TODO.md` (was `tasks.md`) — open work. A `## Notebook` section at the top is
  reserved for the maintainer and is never edited by an agent.
- `backend-tasks.md` (was the untracked `backendtasks.md`) — now **tracked**,
  because it is the file handed to the backend team. Its closing Turkish note
  became the rule it stated: an elevated operator may change anything on another
  admin, an ordinary admin only on non-admin accounts. The gaps `README.md`
  already labelled F1, F2, F3 and G1 were folded in, so the backend team has one
  document instead of a reference to a missing one. The `/auth/me` `isSuperAdmin`
  section is marked done, since it shipped.
- `testplan.md` (new) — scope, the four test layers, the environment, a coverage
  matrix built from the real suite (33 files, 244 tests: 24 unit files / 136
  tests, 9 integration files / 108 tests), the automation gaps stated as fact,
  and ten manual end-to-end scenarios the stubbed suite cannot establish.
- `testfindings.md` (new) — the findings register, seeded with the unverified
  elevated operator (F-001, open) and the two defects already fixed: the reload
  sign-out (F-002) and the locked credibility score (F-003).

**`wiki.md`** (new, root)
- The self-contained copy published to the GitLab wiki. It duplicates `README.md`
  on purpose; the two are changed together.

**`CLAUDE.md`** (new, root, untracked)
- The working rules: a changelog entry on every change, work filed in
  `docs/TODO.md` below the untouched notebook, backend asks in
  `docs/backend-tasks.md`, test scope and results in their two files, English
  everywhere, and the conventions read off the existing history.

**Test strategy recorded, not started**
- `docs/TODO.md` gained a "Test strategy" section: twelve phases with their
  acceptance criteria, and the decisions behind them. The finding that prompted
  it — the suite has 244 tests but **no page test touches HTTP**, because all
  nine integration files mock the service modules with `vi.mock`, so nothing
  asserts the query parameters a screen actually sends. Coverage has never been
  measured; there is no baseline.
- `docs/testplan.md` says so in a new section rather than describing coverage the
  suite does not have. Its matrix still describes the suite as it is today.
- Nothing is implemented: a refactor comes first, and only Phase 1 (coverage
  infrastructure) is meant to land before it.

**`.gitignore`**
- Dropped the bare `TODO.md` pattern, which matched at any depth and would have
  kept `docs/TODO.md` out of the repository, and the superseded
  `BACKEND-TASKS.md`. `CLAUDE.md` stays ignored, as it was.

**`README.md`**
- The F1/F2/F3/G1 references now point at `docs/backend-tasks.md`.
- The project structure listed `src/features/answers/`, which does not exist, and
  omitted `src/features/help/`, which does. Answers are replies worked from the
  Comments screen — not a page chunk of their own, so the lazy-loading list no
  longer claims one.


### Added — elevated permissions for `u-kisi4@student.kit.edu`

One address may now act on **admin** accounts from the user profile, not only on
students: warn, block, unblock, delete, and change an admin's status. Nothing
about it is visible — the account is still reported and rendered as `ADMIN`
everywhere, with no new role, badge or label.

The permission is **the backend's to grant**. It resolves it from
`ADMIN_SUPERUSER_EMAILS` and reports it as `isSuperAdmin` on `/auth/me`; the
panel only reads it. An earlier draft of this feature kept its own address set,
which had to be edited in two repositories at once — that set is gone.

**`src/api/AuthService.ts`**
- `AuthUser` gained `isSuperAdmin?: boolean`. Optional, so a session stored
  before the backend reported it stays valid; an absent flag grants nothing.
- `me()` now maps the `/auth/me` payload onto `AuthUser` instead of casting it,
  so every caller sees one shape.

**`src/utils/adminAccess.ts`**
- Removed `SUPER_ADMIN_EMAILS` and `isSuperAdminEmail`. `REQUIRED_ADMIN_EMAILS`,
  `isRequiredAdminEmail`, `normalizeEmail` and `withRequiredAdminRole` are a
  different gate — who is offered a login code — and are untouched.

**`src/context/authSessionStorage.ts`**
- `isAuthUser` accepts the flag as an optional boolean, and rejects a stored
  payload carrying anything else under that name.

**`src/features/users/components/UserProfileModal.tsx`**
- `canActOnAdmins` now reads `currentAdmin?.isSuperAdmin === true` and is passed
  to `ProfileActions` and `UserEditForm` as before.

**`src/features/users/components/ProfileActions.tsx`**
- New `canActOnAdmins` prop. `isProtected` became
  `isSelf || (user.role === 'ADMIN' && !canActOnAdmins)`, so Warn / Block /
  Unblock / Delete account are offered on admin accounts to an elevated operator.

### Fixed

- **The panel signed the operator out on every reload.** `/auth/me` reports
  `username` / `kitEmail`, the names it also uses on `/users`, but `AuthUser`
  read `name` / `email`. Both were therefore `undefined`: `isAuthUser` rejected
  the stored session on the next load, the sidebar fell back to
  `Unknown account`, and `canActOnAdmins` was computed from an empty address —
  so the elevated permission had never actually reached the UI. `me()` now reads
  either spelling.
- **Credibility score was locked on admin accounts.** Only an admin's *status*
  is reserved for an elevated operator; a username, biography, credibility score
  or a demotion to `STUDENT` are accepted from any admin. `UserEditForm` split
  `accessLocked` into `statusLocked` and a plain `isSelf` check, so the field is
  no longer hidden from edits the backend would have taken.

### Unchanged on purpose

- **Self protection stays.** No one can change their own role or status, block
  or delete themselves, elevated or not.
- **The role label stays `ADMIN`.** No `SUPERADMIN` value entered `UserRole`,
  the role dropdown still offers Student / Admin only, and the sidebar, header,
  user table and audit log render exactly what they rendered before.
- **KIT email stays read-only** for everyone — it is the sign-in identity, and
  the backend keys elevation on it.
- The audit log's actor shape is unchanged; the backend's optional
  `metadata.elevated` is deliberately not rendered.
- No route or navigation gating changed; `ProtectedRoute` is still
  authentication-only.

### Tests

- `src/api/AuthService.unit.test.ts` — `/auth/me` is read in both the
  `username` / `kitEmail` and the older `name` / `email` spelling, an absent flag
  becomes `false`, and a payload with no usable `id` names nobody.
- `src/context/AuthContext.unit.test.tsx` — a stored session carrying the flag
  survives, one carrying a non-boolean is discarded, and an elevation `/auth/me`
  no longer reports is withdrawn from the stored copy.
- `src/features/users/UsersPage.integration.test.tsx` — the elevated operator
  fixture is now an ordinary address with `isSuperAdmin: true`, proving the flag
  alone grants the permission; a further test pins that an ordinary admin sees an
  admin's status locked but the credibility score editable.
- `src/utils/adminAccess.unit.test.ts` — the `isSuperAdminEmail` suite is gone
  with the function; `withRequiredAdminRole` coverage stays.
