# Changelog

## [Unreleased]

### Five test layers, built to answer the panel's own questions

**The suite had every service tested and nothing sweeping.** A new service method could arrive
with no test at all and nothing would notice, because nothing looked at the surface as a whole.
The backend answers that question by reading its route table out of Spring's mapping registry;
this panel has no registry, so the list is read out of the modules themselves.

Five layers were added — call surface, resilience, accessibility, real browser, end-to-end — and
[ADR 0015](docs/adr/0015-panel-test-layers-answer-the-panels-own-questions.md) records why they
are **not** the backend's five. Mirroring those names was tried first and abandoned once it was
clear the mirrored table would carry an "API / role" row reading "not applicable" and an
"integration" row reading "never, by design", while the three questions that produced most of
this round's findings would have had no row at all.

**No production code changed.** Twelve findings were opened and every one of them was left
alone — including `F-030`, which is a single `aria-label` on one line of one file with no visual
effect, and is on the deferred list rather than in this diff.

#### `src/api/callSurface.integration.test.ts` — new

- **Added** the call-surface sweep and its ratchet. 46 calls verify path, verb, `Authorization`,
  whether a `Content-Type` was set at all, body fields and query string, across all **42
  endpoints**. The endpoint list is discovered by `import.meta.glob` walking the prototype chain
  of every exported class in `src/api/**` — **106 methods** — so the list is the filesystem's and
  not a transcription.
- **The ratchet is the part that matters more than any single row.** Every discovered method is
  either exercised or named in an exemption list with a reason; a new method fails the suite
  until somebody classifies it. Two further tests keep the list honest in the other direction: a
  `covers` entry naming a method that no longer exists fails, and an exemption naming a class
  discovery never returns fails.
- **The exemption list was corrected against observation.** It was going to exempt the eleven
  `ApiError` subclasses; discovery never returns them, because they declare no prototype methods,
  so exempting them would have claimed to have considered something that is not on the list.
  Four transport classes are exempt, and nothing else.
- **Verified as a tripwire, five ways**, each seen red and reverted: renaming `/users/{id}/block`
  turns one row red; adding an unclassified method turns the ratchet red with the method's name;
  making `withQueryString` keep the empty string turns two rows red with `q=` in the URL; making
  the client always set `Content-Type` turns **34 of 54** red; and hard-coding `ContentService`'s
  response key turns the generic-derivation test red.
- **Found nothing.** That is the result: on all forty-two endpoints the panel sends what
  `docs/consumer-contract.md` says it sends.

#### `src/test/msw/handlers/catalog.ts` — new, and it closed a hole nobody knew was open

- **Added** the catalogue slice — `/data/lectures`, `/data/professor`, `/ratings` and their
  writes. Eight of the forty-two endpoints had no handler at all.
- **The end-to-end suite had been contacting the deployed backend.** The browser worker starts
  with `onUnhandledRequest: 'bypass'` — it has to, because the panel asks for its own assets and
  Vite's client — so those eight paths fell through the worker to the Vite proxy and out to the
  real backend, from a suite whose entire premise is that it contacts nothing. Nobody noticed
  because no spec opened the catalogue. `e2e/mock-backend.spec.ts` now reads
  `Response.fromServiceWorker()` on every `/api/` response across all eight routes and asserts
  none escaped; removing the handlers again turns it red.

#### `src/api/responseShapes.integration.test.ts` and `src/features/degradedPayloads.integration.test.tsx` — new

- **Added** the resilience layer, split along the axis where the failure actually happens. A
  `503` is decided once, in `ApiResponseParser`, so it is asked once **per endpoint** — asking
  eight screens would be the same answer eight times at the cost of eight renders. A **missing
  field** passes the parser without complaint and breaks in a component, so it is asked of a
  **rendered screen**.
- **546 status and shape cases are clean** — nine failing statuses, a network error, an empty
  body, a body that is not JSON and a `2xx` refusal, per endpoint, each raising the right typed
  error with the right `transient` and a non-empty message.
- **The Dashboard is clean on every degraded-payload case.** Its code comments claim it defends
  against a missing counter, and it does.
- **Four findings**: `F-026` (a `204` throws a `TypeError` in four services), `F-027` (there is no
  request timeout anywhere), `F-028` (an unknown enum value takes the whole screen down — three
  mechanisms, one cause) and `F-029` (two unguarded `.length` reads).
- **The three mechanisms behind `F-028` were told apart by measurement, not by reading.** Guarding
  `enumLabel` turned only **10 of the 14** cases green; the other four are
  `auditActionColor`'s `action.endsWith` and `reportStatusIcon[status]` used as a JSX element
  type. A finding that had blamed `enumLabel` for all fourteen would have been wrong and would
  have looked right.

#### `src/App.a11y.integration.test.tsx` and `src/test/a11y.ts` — new

- **Added** the first accessibility measurements this panel has ever had. `docs/testplan.md` §6.4
  called this "the largest single gap in the suite"; it is measured now.
- **`axe-core` directly, no `jest-axe`** — its Vitest 4 compatibility is unverified, and a matcher
  that swallows the result object would also swallow the readable dump that gets delivered.
- **`color-contrast` and `target-size` are switched off by name, with the reason on each.** Every
  element in jsdom is 0x0 and no style is composited, so those rules return nothing — and nothing
  reads as a pass. They are measured in Chromium instead. **This is the whole difference between
  a report and a claim.**
- **A false green was caught and is worth recording.** The route markers were page *titles* at
  first, and every title is also a sidebar link — so `/Comments/` matched the navigation while the
  screen was still a spinner. The file reported **eight clean routes** while two of them had not
  finished loading. Switching to page descriptions turned up `F-032` immediately. The file's own
  comment warns about exactly this; the person who wrote the comment then did it.
- **Three findings**: `F-030`, `F-031`, `F-032`.

#### `e2e/` — six new specs

- **Added** `a11y.spec.ts`, `layout.spec.ts`, `focus.spec.ts`, `mock-backend.spec.ts`,
  `blocking-a-user.spec.ts`, `escalating-a-bug-report.spec.ts`, and `routes.ts` as the shared
  route list. **4 specs / 11 tests → 10 specs / 68 tests.**
- **`F-019` has a boundary now.** Its record was two screenshots described as "below the `sm`
  breakpoint". The navbar is measured against the viewport at seven widths: at **320, 480, 640
  and 768** the navbar *is* the viewport; from **800** it is 240. The dead zone is four widths
  wide, not two. So the layout figures are taken at **1024 and 1440**, and everything narrower is
  recorded as **not measured — which is not the same as passed**.
- **Every table fits exactly at 1440px** (1134 = 1134) and **all four overflow at 1024px**, by
  382, 282, 182 and 162 pixels. That is `F-036`.
- **The first version of the overflow test was wrong**, and it was caught by trying to make it go
  red and failing: it did `if (table.scrollable) continue`, which skips every table that
  overflows — so it measured only the tables that could not fail, and reported 24 green.
- **`F-037` was found by a blunter tool than the standard one.** axe's `target-size` passes all
  eight routes; a plain `getBoundingClientRect` over every visible button finds `Sign out` at
  **61x21**, `See everyone →` at **90x17**, and **every row action on Comments at 22x22**. axe
  grants exceptions for spacing and inline targets. Running one tool and reporting its green
  would have been wrong in a way nothing in the report would have shown.
- **Contrast is 46 nodes of 407.** `F-035`: axe returns **361 `incomplete`** because
  `interactive.css` paints its surfaces with a gradient and no ratio can be computed against one.
  Help is 0 determined of 28. Saying "contrast passes in Chromium" would have claimed about eight
  times what was measured; the specs print the three counts per route so the figure is read off a
  run.
- **Two new flows, and only two.** Blocking and unblocking with the boundaries — including a
  `409` refusal reaching the screen with the backend's own sentence — and the GitLab escalation's
  **unconfigured** variant, where the control is withheld *and no request reaches the endpoint*.
  That second assertion is the contract claim `FeedbackService` documents; a panel that offered
  the button and handled the refusal would look identical in a screenshot and be wrong.

#### `src/test/msw/browser.ts`

- **Changed** `FAULTS` to return `HttpHandler[]` rather than one handler, so a fault can span
  endpoints, and **added** three: `long-content` (the longest label, username, lecture title and
  comment the columns can be handed), `gitlab-disabled` and `block-refused`. The demo data is
  chosen to look like a real backend at the Abnahme, so measuring against it reports the width of
  the fixture rather than the width of the column.

#### `vite.config.ts`

- **Added** `json-summary` to the coverage reporters. It was missing while
  `docs/testplan.md`, `docs/testfindings.md` and this file all said the per-directory table was
  generated from `coverage/coverage-summary.json`. The file on disk was a leftover from a one-off
  invocation, so the next person to follow the documented procedure would have re-published a
  stale table without knowing.

#### `tsconfig.e2e.json` — deliberately unchanged

- `DOM` is still absent from `lib`, because a spec runs in Node and drives a browser and a
  top-level `document` should not compile. The two specs that measure layout carry
  `/// <reference lib="dom" />` **per file**, with the reason above it: `page.evaluate` bodies are
  serialised and run *in the page*, so they are browser code living in a Node file and TypeScript
  cannot tell the two apart. Widening the shared config would have removed the guard for every
  other spec.

### Fixed

Nothing. This round changed no production code, and that is the point of it.

### Tests

**43 files / 348 tests → 47 files / 1137 tests and 3 skipped.** Playwright **4 specs / 11 tests →
10 specs / 68 tests**. Coverage **92.55 / 85.62 / 90.77 / 94.43 → 92.96 / 86.46 / 91.52 / 94.61**,
every axis up, none of it aimed at coverage — it is the side effect of layers that walk real code
paths.

**The unit count did not move at all**: 28 files, 182 tests, exactly as before. All 792 new tests
are integration tests, because every layer added here asks what happens when two things meet.

**`tsc` caught five type errors the test runner did not** — a wrong `BugReport` status, two wrong
`ReportStatus` values, an unexported type, and `node:fs`. Vitest does not type-check, so
`npm run check` earns its place in the gate rather than duplicating `npm test`.

**Every layer was shown to go red on a deliberate break, and each break is recorded** in
`docs/worklog.md` with the failure message it produced. That is the property mutation testing
exists to establish, obtained more cheaply — and less completely, which is said rather than
glossed. Stryker is on the deferred list with the backend's `P-7` reading rule attached.

### Unchanged on purpose

- **Twelve findings opened, none fixed.** `F-026` … `F-037`. Every one is in
  [docs/TODO.md](docs/TODO.md) under *Known, measured, deliberately deferred* with what it is, how
  it was measured, why it was not fixed, and what fixing it costs.
- **`F-030` is a one-line change with no visual effect and it is still not made.** Ten minutes'
  work, on the list rather than in this diff, because the rule for this round was that no
  production code changes.
- **`F-012`, `F-019`, `F-020`, `F-022`, `ErrorAlert`'s two theme divergences and the swallowed
  `415` on sign-out** are all still open, and `F-019` now has a measured boundary rather than two
  screenshots.
- **The theme, `AppShell` and every design token are untouched.** `F-034` and `F-036` are both
  waiting on the same visual pass as `F-012`, and [DESIGN.md](docs/DESIGN.md) §Method applies to
  all three.
- **Nine defects are pinned in tests that assert the *current* behaviour**, each going red in both
  directions — a new defect of the same shape, and a fix. A green suite is not evidence any of
  them is acceptable.
- **No layer is self-verifying.** The ratchet would pass over an empty discovery list, the axe
  specs would pass on a rule that never ran, and the overflow test skipped every table that could
  fail in its first version. Each was found by trying to make the layer go red and failing, and
  each now carries a guard — but the deliberate break is what establishes it, and it has to be
  repeated whenever a layer is extended.


### The suite pins the API base instead of inheriting it

**CI was red on thirty tests that pass on every developer machine.** The cause was not
the tests and not the code: `.gitlab-ci.yml` declares `VITE_API_BASE_URL` as a global
variable — `web:build` bakes it into the bundle and `web:image` passes it to Kaniko —
and a global variable is set for `web:test` too.

**Why that was almost invisible.** `ApiClient` and `src/test/msw/apiUrl.ts` both derive
their base from that one variable, which is deliberate — `apiUrl.ts` says so — and it
means they never disagree. So the mock backend still answered, the screens still
rendered, and **every assertion about the screen passed**. Only the assertions about the
*request* failed, because those name absolute paths: `requestsTo('POST',
'/api/auth/login')` finds nothing when the base is the deployed URL and the request went
out as `/auth/login`. The failure said `expected [] to have a length of 1` and pointed at
nothing.

The signature is the part worth keeping. Every assertion expecting a request failed;
every assertion expecting *no* request passed, because zero was already the answer. And
`bodylessWrites.integration.test.ts` — the one file that builds its expected path from
`apiUrl` rather than typing `/api` — was green in the same run.

#### `vite.config.ts`

- **Added** `test.env: { VITE_API_BASE_URL: '/api' }`. Vitest's `env` wins over an
  inherited process variable, so the suite now runs against a base it fixes itself. `/api`
  is what `.env` sets for development and what the `Dockerfile` defaults to, so nothing
  about what the tests exercise changed — what changed is that it no longer depends on
  what the surrounding environment happens to export. This is the same reason
  `src/test/http.ts` stubs the network: a suite whose result depends on the machine it
  runs on is not a suite.
- Locally the tests were green because the tracked `.env` sets `VITE_API_BASE_URL=/api`.
  That made `.env` quietly load-bearing for `npm test`, and it no longer is.

#### `.gitlab-ci.yml`

- **Unchanged on purpose:** the two globals stay global — `web:build`, `web:image` and
  `web:deploy` read them. A comment now says that, and says that scoping them per job is
  *not* what makes the suite green, so the pin is not removed later as redundant.

### Tests

No test was added, removed or changed; 43 files and 348 tests, as before. The fix was
verified by reproduction rather than by argument: exporting the pipeline's value locally
reproduced CI's failures by name, and the full suite passes with that variable exported
once the pin is in place. Recorded as `F-025` in [docs/testfindings.md](docs/testfindings.md).


### The end-to-end job is manual now

**`web:e2e` is `when: manual`.** It was already `allow_failure: true`, so it could
never block a merge — but it still ran on every push, and its cost is paid before a
single test does. It cannot share the Alpine image the rest of the pipeline uses, so
each run pulls `mcr.microsoft.com/playwright:v1.63.0-noble` and performs its own
`npm ci`. That is minutes on every pipeline for a suite whose value is occasional.

**This is a decision about time, not about trust.** The suite is unchanged and still
green; it is one click away in the pipeline view and `npm run test:e2e` is the same
command locally.

`allow_failure: true` is kept even though it is the default for a manual job. Spelling
it out is what stops someone reading a later removal of `when: manual` as "and now it
gates".

**The cost, stated rather than buried:** nothing in CI will now tell you an end-to-end
flow broke. `docs/testplan.md` §8 says so where the exit criteria are — run it locally
before merging anything that touches a flow in §7.


### Making the documents true — the delivery pass

No code, except one `package.json` script. The work was reconciling what the documents
claim with what the repository does, because several of them had been overtaken by the
two packages before this one and a document that is confidently wrong is worse than a
missing one.

**`docs/TODO.md` gains *Known, measured, deliberately deferred*.** Nine items, each
with four things: what it is, how it was measured, why it was not fixed, and roughly
what fixing it costs. The estimate is the load-bearing part — it is what separates a
decision from a backlog, and it is the list most worth reading at delivery.

The swallowed `415` on sign-out is given its own heading, because it is not the same
kind of item as the others. Everything else there degrades the panel visibly; that one
**tells the operator something false** — they believe they signed out while the token
stays live on the backend. It is deliberate, the reasoning still holds, and changing it
was offered and declined for this round. Written down at that severity rather than
filed among the rest.

**Coverage figures are generated now, not transcribed.** Every previous per-directory
table in `docs/testfindings.md` was typed out of the terminal reporter — which omits a
directory whose files are all fully covered, so seven directories at 100% were silently
missing and anyone reading it as a list of everything drew the wrong conclusion. The
table is aggregated from `coverage/coverage-summary.json`; the omission and the
transcription error go together.

**`docs/testplan.md` §2 names both lists.** Which eight files touch HTTP and what each
proves that only a real request could; which five still replace their service and what
each therefore cannot show. "Some of them" is how a claim like this rots.

**§7 states what the end-to-end layer does not establish, first and plainly.** It has
**never** run against the real backend — a passing flow is evidence the panel agrees
with this repository's description of the backend, and where that description is wrong
both are wrong together, which is `F-002`'s shape one layer down. It runs in Chromium
only, and at desktop widths only: the panel is in fact unusable below 768px and no
end-to-end test noticed, because none looks there.

**§6.4 no longer claims "no page test touches HTTP."** It said so while eight files
did, having been written before `P2`. Two entries were added that a percentage cannot
show: nothing is tested below 768px, and nothing anywhere asserts accessibility.

**`docs/class-diagram.md` §2 was two ADRs behind.** `ApiError` was still drawn as one
concrete class with a `status`, and `HttpService` still held an `ApiClient`. Redrawn
with the eleven-class hierarchy, `transient` as an abstract member, and the
`HttpTransport` seam — which is the edge worth pointing at in a design review, because
it is the difference between a service that *may not* revoke the session and one that
*cannot*. The acyclicity claim carries the current figures (276 files, 899 edges) and
says the check was verified by introducing a cycle.

**ADR 0013 gained a worked example rather than a tick.** The record is written
abstractly and an abstract principle is worth what its first real use is worth: the
session notice decides what to report by asking `error.transient`, so no status appears
in the feature layer and no list had to be maintained. The same round produced the
counter-example — a bare `catch` that discarded the type and left
`getLoginErrorMessage` unable to recover an answer it already knew.

**ADR 0008 says what is missing, and does not claim otherwise.** `openapi.json` is
still not here, so nothing downstream of it exists, and the status stays
`Accepted — not yet implemented`. It also records a constraint found while preparing
the ground: `openapi-typescript` peer-requires TypeScript 5 and this project is on 6,
so `npm i -D` does not resolve. Rather than force an unsupported pairing into the
lockfile, `npm run schema:types` runs the generator through `npx`. **Whether its output
type-checks under TypeScript 6 is genuinely unknown** and is written down as unknown —
it can only be found out with a real schema in hand.

**ADR 0009 gained a second amendment**, naming the two files that moved and, more
usefully, the rule's limit: `bodylessWrites` is a test of the client that corresponds
to no user-facing flow, because the GitLab escalation's page still replaces its service
and there was nowhere else the request could be observed. A feature staying on
`vi.mock` does not only leave its screen untested — it can make a contract fact
unobservable from anywhere.

**`README.md` and `wiki.md`, changed together.** The Playwright cache path moves out of
`TODO.md` and into Prerequisites, where somebody setting up will look. It was wrong
twice: it gave the macOS path as though it were the only one, and it named
`chromium-1234` when Playwright 1.63 requires **1243** — read out of
`playwright-core/browsers.json` rather than from either guess. Both directories exist
on this machine, which is exactly how the wrong one came to be written down. Also a
paragraph on refreshing the schema, and the fact that the test suites need no backend
at all.

**`docs/TODO.md`'s handed-over specs are reconciled with what shipped.** `P2` and `P3`
landed; the specifications are kept **unedited**, each with a note saying what actually
happened, because reading the spec against the outcome is where the difference stays
visible. One prediction is recorded as not having held: `P2` was supposed to follow
`P1` so its fixtures could be typed against the schema. It ran first, so they are typed
against the panel's own types — a fixture cannot drift from what the panel believes,
and both can be wrong together.

### Unchanged on purpose

- **No code changed.** The single exception is the `schema:types` script, which was
  agreed as part of preparing for a schema arriving the same evening.
- **`F-019`, `F-020`, `F-012`, the `ErrorAlert` divergences and `F-022` are all still
  open**, each now with a measurement and a cost. The list they are on is the
  deliverable; fixing them the day before delivery is not.

**The gate.** 43 files, 348 tests, 11 Playwright tests, coverage
**92.55 / 85.62 / 90.77 / 94.43**. `npm run check` clean over 276 files and 899 edges.
Production build clean.

### What the wire actually carries — `P0b`

Three things the consumer reading of this client raised, handled three different ways
on purpose: one guarantee pinned, one crash fixed, one risk measured and written down
rather than fixed on the last day before delivery.

**`F-023` — the five bodyless writes, pinned.** `ApiRequestBuilder` sets
`Content-Type` only when `init.body !== undefined`, and `JSON.stringify(undefined)` is
`undefined`, so `POST /auth/logout`, `POST /audit-logs/{id}/revert`,
`POST /reports/{id}/gitlab-issue`, `PATCH /users/{id}/block` and
`PATCH /users/{id}/unblock` go out with the header **absent** rather than empty. That
was asked of the backend in `docs/consumer-findings.md` C-03 and answered in a
paragraph, which is a place nothing can contradict.

The request recorder captures `Content-Type` now, and ten tests assert the header is
absent on all five and that a `415` on each surfaces the backend's own sentence rather
than a `TypeError` from an unparsed body. Nothing changed in the client — the
behaviour was already right. What changed is that it can no longer change quietly.

**Verified as a tripwire, not assumed.** These pin correct behaviour, so there was no
defect to see them go red on. Making the client set the header unconditionally turns
six of them red; restoring it turns them green. The same check `scripts/check-cycles.mjs`
got when it was introduced, for the same reason: a test that has never failed has not
been shown to work.

**Pinned, not fixed — a `415` on sign-out is swallowed.** `AuthContext.logout` catches
everything on purpose, because signing out locally is safer than staying signed in
when the backend cannot be reached. The cost is that a refusal is indistinguishable
from an outage: the panel forgets the token and the backend goes on accepting it, so
the operator believes they signed out while the session is live. `consumer-findings`
§3.4 names this as the one place the `500`-to-`415` change could bite, and there is
now a test that says what "bite" looks like. Left as it is deliberately.

**Fixed — `F-021`: an audit entry with no `changes` took down every row of the table.**
`changes` and `metadata` are open maps the panel walks with `Object.keys` and
`Object.entries`, and `toAuditLog` filled in the three revert fields and stopped there.
`Object.keys(undefined)` throws, and it throws in `AuditLogRow` — which counts an
entry's changed fields to label the row — so this was never a detail-view problem. One
such entry blanked the whole screen.

Both default to `{}` now: the same `?? {}` `ratingMapper` already uses for `scores`,
rather than a second pattern for the same problem. `BackendAuditLog` declares them
optional, the way `BackendWarning` is already honest about `createdFrom`. An empty map
and an absent key render identically, so nothing downstream tests for absence. An
entry type that legitimately has neither — a sign-in, a deletion — is exactly what a
serializer omits, which is why C-08 asks the backend to send both even when empty.

**Measured and deliberately not fixed — `F-022`: `actor: null` and `author: null`.**
`AuditEntry.actor` is non-null and read without a guard in four places, while `target`
— nested identically, in the same interface — is nullable and guarded at both of its.
`ModeratedItem.author` is the same shape while `ratingMapper` and `userWarningMapper`
both defend theirs. That asymmetry is the sharpest thing in C-07.

Two tests now record what happens rather than assert what should: the row never
arrives at all, because both row components read the name into their accessible label
and throw before anything is painted. This is not a missing cell.

The backend has since confirmed the actor columns are five `NOT NULL`s, so it is a
**recorded risk, not a live defect** — and the fix is a nullable domain type whose
`tsc` consequences reach every read site, which is not a change to make the day before
delivery. `docs/TODO.md` carries it under *Known, measured, deliberately deferred*,
and the tests are written so that whoever does make the type nullable is told exactly
what they changed.

**`src/test/msw/wire.ts` (new).** `db.ts` is typed with the panel's own types, which
is what keeps the ordinary fixtures honest and what makes a response *missing* a
declared field unrepresentable there. Those are wire concerns, so `without(value, key)`
lets a test write the wire — a key genuinely absent, not set to `undefined`, which is
what a serializer that drops an empty field actually sends.

### Unchanged on purpose

- **The domain types stay non-null.** See `F-022` above. Scope discipline, not an
  oversight: the reach of the change and the day it would land on are the argument.
- **`F-019` and `F-020` are untouched**, both found by the previous package. The first
  is a responsive-behaviour decision; the second touches the query-key logic that every
  table's loading path runs through, and a mistake there empties tables at the Abnahme.
- **No `415` row is added to `responseErrorFor`.** It arrives as a plain `ResponseError`
  carrying the backend's message, which is what every call site renders anyway. A row
  would only earn its place if some caller branched on it, and none does.

### Tests

- 15 new tests. The `F-021` pair reproduced the exact `TypeError` before the guard;
  the `F-023` ten were shown to fail against a deliberately broken client; the `F-022`
  two are characterisations of a defect that is staying.
- `bodylessWrites.integration.test.ts` exercises the five at the **service** layer, not
  through the screens. The header is a property of the request the client builds rather
  than of any one page — and the GitLab escalation's own page still replaces its service
  module, so no screen test could produce that request at all.

**The gate.** 43 files, 348 tests, up from 333. `npm run check` clean over 276 files
and 899 edges, 11 Playwright tests green, production build clean.

### The shell says it — `P0a`, the visible half

`F-013` is closed. `AdminLayout` renders the unconfirmed-session notice inside the
content gutters, above the routed page. `docs/DESIGN.md` §Method ran first: a written
style note with the measurements and the tokens, two directions, one picked, then the
code — and then a look at it in Chromium, which found two things reading it had not.

**Chosen: inside the content column, dismissible.** The alternative was a band across
the whole window, above the sidebar as well. It has the cleaner argument — an
unconfirmed session is a property of the panel, not of the page — and it was rejected
on cost: it restructures the `AppShell` every end-to-end spec measures against, days
before delivery, and the sidebar is how an operator leaves a screen that is
misbehaving. Moving the navigation to report a problem with the navigation's own
session is the wrong trade.

**Yellow, not red.** Red in this panel means *a thing did not happen*. The operator
here is signed in, the panel works, and what they are looking at may be stale — so it
gets `KIT.yellow`, which `constants/colors.ts` already describes as pulled down to
read as a warning rather than a highlighter. Spending red on "carry on, but be aware"
spends the one colour that should stop somebody.

**`role` follows the level, not the component.** Mantine's `Alert` defaults to
`role="alert"`, which is assertive and interrupts a screen reader mid-sentence. That
is right for a failed action the operator just triggered and wrong for a notice that
arrives unprompted during a page load, so the warning level is `role="status"`.

**Dismissing gives focus back to the page.** The close button unmounts itself, and
focus would otherwise fall to `document.body` — a keyboard user loses their place in
the document entirely. It moves to the `main` landmark first. `F-008` came out of this
same area in the previous pass; this is the assertion that stops the second.

**Dismiss clears the message rather than setting a flag.** So the same failure does
not return within a page load, a *different* one does, and a reload shows it again if
it is still failing. Nothing is persisted and nothing can suppress a later problem —
which is what makes a dismissible notice honest rather than a way to hide a true state.

**`?fault=<name>` — states you cannot reach by clicking.** `docs/DESIGN.md` says a
style change is not finished until it has been looked at, and an alert region has to
be seen while it is *showing*. Getting there meant editing a handler, screenshotting,
and editing it back, which is how a state gets signed off unseen. Three named faults
now live in `src/test/msw/browser.ts` behind the existing `VITE_MOCK_BACKEND`
constant, so they are absent from a production build with the rest of the mock backend.

**Fixed by the critique — the dismiss button was a 20x20 target.** Mantine's default,
and below the 24x24 that WCAG 2.2 SC 2.5.8 asks for. It is the only control the panel
offers inside an alert, so it is the one that has to clear it. Found by measuring the
rendered button, not by reading the markup.

**Found by the critique, and not fixed — `F-019`: the panel is unusable below `sm`.**
The `AppShell` navbar has a breakpoint and no `collapsed` configuration and no burger,
so under 768px it takes the full width and covers everything. Two of the three widths
this change was asked to be checked at are widths where there is nothing to check.
The notice is fine at both and cannot be seen at either. Recorded as not checked
rather than as passing; the fix is a decision about what the navigation becomes on a
narrow screen.

**Found by the critique, and not fixed — `F-020`: a refused filter empties the users
table.** `UsersPage`'s own comment says a `400` belongs "above the rows that are still
the last good answer"; `hasLoaded` reads the current query's data, applying a filter
changes the query key, and the rows are gone before the message renders. Prose stating
one intent while the code does the opposite, which is the shape of `F-007` and `C-14`.

### Unchanged on purpose

- **`ErrorAlert`'s red stays a hand-written `rgba(239,68,68,…)`**, and Mantine goes on
  colouring the message `#ffffff` against the "no pure white" rule. Both are one-line
  changes that restyle **seventeen** call sites at once, which is a visual change of
  its own and not one to fold in here. The `warning` level added for the notice goes
  through `withAlpha(KIT.yellow, …)`, so the new half follows the rule and the old half
  is now written down in `docs/DESIGN.md` and `docs/TODO.md` rather than quietly
  matched.
- **A page's own errors are still rendered by the page.** One *component* serves both
  needs, not one region collecting messages from everywhere: a shell that reached into
  the routed page for its errors would need every page publishing upward, which buys a
  worse coupling than it removes. When both show they stack, session first, and the
  page header sits between them — which reads correctly, because the yellow one belongs
  to the shell and the red one to the screen.

### Tests

- `src/layouts` has its first test. It had none, and coverage of it was 55% of
  functions — which is how a shell with nothing to say about a failed session went
  unnoticed. Four tests, exercised through `App` rather than by mounting `AdminLayout`
  alone, so the notice is proven to survive the routing, the provider and the protected
  route.
- Measured in Chromium at 1440px rather than asserted: the notice is 55.7px, 135.4px
  with a page-level error under it, no horizontal overflow at any width, and the
  message contrasts 14.41:1 against its own translucent background over the page.

**The gate.** 42 files, 333 tests, up from 329. `npm run check` clean over 275 files
and 899 edges, 11 Playwright tests green, production build clean.

### The session path — `P0a`

The backend restored legacy `GET /auth/me` as an alias, so the panel needs no change.
Confirming that is the easy half. The hard half is that the code path which *would*
have told us it was gone says nothing at all, and would have said nothing on the day
it went — `docs/consumer-findings.md` C-01 opens with two documents in this
repository contradicting each other about whether the endpoint still exists, which is
what "verified by reading" is worth.

**The handler already serves it.** `src/test/msw/handlers/auth.ts:59` answers
`/auth/me` with a tri-state session and a one-shot `401`. What it had no fixture for
was a failure that is neither a refusal nor a success, which is exactly the case
below. `failSessionCheck(status, message)` is new and is the missing third override.

**`F-013` — a session check that fails without being refused is silent.**
`AuthContext` acts only on `UnauthorizedError`. A `404`, a `403` or a payload the
panel cannot read all flip `checking` to false and leave the operator working against
the account copy captured at sign-in, with nothing on screen and nothing in state.
Keeping the session is a decision and it stays; the silence was the absence of one.

The provider now carries `sessionCheckError` beside `sessionExpired` — three states
where the panel used to have two, because "we do not know yet", "the backend refused"
and "the backend answered, but not usefully" each owe the operator a different answer.

**Which failures are worth saying out loud is decided by `transient`, not by a
status.** A 500 and an unreachable host can pass on a retry; a `404`, a `403` and a
`ContractError` cannot. `ApiError` already answers that question for itself, so the
provider asks it rather than comparing numbers — ADR 0013's own criterion, met by a
later change. Warning about a blip that heals itself is how a warning that matters
gets ignored.

**Fixed — `F-014`: four sign-in failures collapsed into one sentence, and three of
them were wrong.** `readSessionUser` wrapped `/auth/me` in a bare `catch` returning
`null`, which became "Signed in, but your admin account could not be read. Try again
in a moment." A `403` means the account is readable and the backend refuses it the
panel. A `404` means the address the panel asks at is gone, and no retry helps. A
`401` means the token minted seconds earlier is already refused, so waiting a moment
is the single piece of advice that cannot work.

The bare `catch` discarded the **type** along with the message, which is the part
that could not be recovered downstream: `getLoginErrorMessage` already knows a
`ForbiddenError` means "not authorized", and by the time it saw the failure the
`ForbiddenError` was gone. It is passed on untouched now, so the function that owns
that wording still decides it; the other two get a sentence that is true; everything
else keeps the original message.

**Fixed — `F-015`: a sign-in reported as failed left a live bearer token installed.**
The token has to reach `ApiClient` before `/auth/me` can be asked with it, so
`authenticateAdmin` set it and only then resolved the identity. When that read failed
the login screen said so and the client went on sending the token on every request
afterwards. It is cleared before the rethrow now. Found by reading the ordering while
fixing `F-014`, not by a failing test — and it is the reason `F-014` was worth
opening the file for.

### Tests

- Eight new tests, every one seen red before the fix. Four on the provider — the
  `404`, an unreadable payload, the transient case that must stay quiet, and the
  success case that must report nothing — and four on `authenticateAdmin`, one per
  discriminated failure plus the token clearing.
- Two of the four `authenticateAdmin` tests passed *vacuously* when first written,
  because `toThrow(undefined)` matches any throw and the message constants did not
  exist yet. The constants were added first so the assertions could actually fail.
  A test that has never been red has not been tested either.

### Unchanged on purpose

- **A `401` still ends the session and nothing else does.** The change adds a second
  thing the panel *says*, not a second thing it does to the session.
- **The message is fixed prose, not the backend's own.** For the case this exists for
  the backend's message is "Request to /auth/me failed with status 404", which tells
  the operator nothing they can act on. What they need is the consequence.
- **Nothing renders `sessionCheckError` yet.** The alert region is a visual change and
  is following `docs/DESIGN.md` §Method, which asks for the written note and the
  approval before the code. `F-013` stays open until it lands.

**The gate.** 41 files, 329 tests, up from 321. `npm run check` clean over 275 files
and 893 edges, 11 Playwright tests green, production build clean.


### The request layer and the end-to-end layer — `P2` and `P3`

Six features test against real requests now, and there is a Playwright suite that
drives the panel in a browser with no backend behind it. Both run on one set of
handlers, which is the part that made the second affordable.

**`src/test/msw/` (new) — one description of the contract**

- `handlers/` implements it rather than returning fixed blobs: the
  `{ success, message, … }` envelope on everything, cursor paging that **really
  slices** and refuses a cursor sent without a limit, `q` / `status` / `role` /
  `sort` actually applied, and the error paths — `400` with a usable message, `401`,
  `403`, `404`, `409` carrying a `reason`, `429` with `Retry-After`, `503` for
  `gitlabEnabled: false`.
- `db.ts` is a store, not a fixture. The behaviours worth testing span two requests —
  a write and the read that should show it, a report whose status hides the content
  it names — and a constant response proves none of them. Two files already had
  hand-written backends for this reason; this is that, somewhere every test can use.
- `requests.ts` records what went out. This is the whole point of the exercise: a
  mocked service can record that `update('comment-1', …)` was called, and cannot
  record the path, the method, the query string, the body or the header, because
  with the service replaced none of them was ever produced.
- `envelope.ts` holds the envelope and the paging, so a handler cannot get them
  subtly wrong in one place and right in another.

**Migrated — six modules, and the rule that chose them**

`docs/adr/0009` says a module being worked on moves. The Entwurf pass rewrote how
every one of these reports failure, so each was being worked on:

- **`comments`** — the reference slice, per the ADR. `vi.mock('@/api/moderation')`
  is gone and every mutation is asserted as a request. It also gained the half of
  `ACTION_TAKEN` nothing had ever tested: **every other status restores the
  content**, which can only be checked by reading what the next request returns.
- **`App`** — the session behaviours. "The identity comes from `/auth/me` and
  nowhere else" used to be "a function was not called"; it is now "no request was
  addressed to the user list". The unreachable-backend case is a real transport
  failure now, not a rejected double.
- **`auth/LoginPage`** — the admin-team check exists to stop a code being
  *requested*. Only a real request layer can show that none went out.
- **`context/AuthContext`** — and renamed `.integration.`, which is what it was.
- **`audit-logs`** — the one screen that filters server-side, so what a test could
  prove about filtering was entirely about a query string a mock never built.
- **`users`** — it already had a mutable array, a `list` that applied three filters
  and `block`/`unblock` writing back to it. That was these handlers, in one file,
  without the request.

**Fixed — the warning mapper was never exercised.** The store holds warnings in the
shape a screen reads; the handler has to put them back on the wire with the issuer
nested under `createdFrom`, which is how they arrive. Serving the flat shape skipped
`toWarning` entirely — the same class of gap as `F-002`, in the same mapper layer,
and it only became visible once a real response had to be parsed.

**Two fixtures were describing the mock rather than the panel.** The stored session
had no `isSuperAdmin` in the expectation, because the mock handed back the panel's
own object and the mapping never ran; and a `comments` counter the panel does not
read was being passed to `/system/status`. Neither compiles now.

**`e2e/` (new) — four flows, 11 tests, no backend**

Login → comment moderation → bug report triage → undoing a field edit, each written
as state / action / expected response, because these are also the scenarios walked
by hand at the Abnahme. `VITE_MOCK_BACKEND=true` serves the panel from the same
handlers in a real browser. Pinning them to a deployment would make them fail for
reasons that have nothing to do with the panel at the one moment they are being
demonstrated.

The import in `src/main.tsx` is dynamic and behind a compile-time constant, so a
production build folds it away: `grep` finds no MSW and none of the fixtures in
`dist/`, and the bundle is unchanged.

**`src/test/msw/demoData.ts` (new) — real KIT content.** Actual lecture titles,
German names, comments written the way students write them. The old fixtures were
role labels — `'Reported text'`, `'Hidden already'` — short enough that nothing ever
exercised the two-line clamp, the 90-character tooltip threshold or a long German
compound. `docs/DESIGN.md` bans lorem ipsum; this is the other reason.

**Verified by looking, not by reasoning.** The report-reason filter that used to clip
"Inappropriate content" was measured in Chromium with the longest option selected:
`scrollWidth === clientWidth`, 218 = 218. Doing that needed a signed-in moderation
screen, which is exactly what the browser-mode handlers made reachable.

### Tests

- **Four files renamed `.unit.` → `.integration.`**: `AuthContext`,
  `useDashboardData`, `theme` and `ErrorBoundary` each render a React tree and drive
  it. `npm run test:unit` and `test:integration` filter on the filename, so the name
  was the only thing deciding which suite they were in. The split moved from
  **207 / 113 to 178 / 143**, which is what it should always have said.
- `authenticateAdmin.unit.test.ts` and `users/model/userEdit.unit.test.ts` are left
  alone. Both reach into a second module, but both are still tests of one function,
  and renaming them would say something untrue in the other direction.
- `npm run test:e2e` is new. In CI it is its own job with `allow_failure: true` — a
  flaky browser must not be able to block a merge — and it uploads its report only
  on failure, which is the only time anybody reads it.
- **`web:check` now runs `npm run check`** rather than `lint` and `typecheck`
  separately, so the no-cycles and documentation checks are actually enforced in the
  pipeline. They were added in the previous entry and CI was skipping both.

### Unchanged on purpose

- **Five files still replace their service module.** Catalogue, feedback and the
  dashboard were not touched by this work, and the two `vi.mock`s left in unit tests
  isolate a single unit, which is what a unit test is for. ADR 0009 predicted this
  state and defends it.
- **`onUnhandledRequest: 'error'` stays per-file.** Setting it globally would fail
  every unmigrated test on a request that legitimately never happens.
- **One browser.** The panel is an internal tool used on a desktop, and a
  cross-browser matrix would buy coverage of a problem nobody has reported at the
  cost of a suite nobody runs.

**The gate.** 41 files, 321 tests, coverage **92.27 / 85.10 / 90.50 / 94.18** — up
again on every axis. Plus 11 Playwright tests, green. Zero warnings, clean build,
and MSW absent from it.

### Design principles and the API documentation — the Entwurf pass

The panel was already refactored; what was left was the set of things a design
review reads rather than a user notices. Six packages, each kept `npm run check`
and `npm test` green before the next started.

Two of them found real defects rather than only tidying, and those are called out
below: a keyboard trap on every clickable row, and a delete dispatcher that would
have deleted the wrong kind of record.

**Errors are types now, not status codes — `src/api/client/apiErrors.ts` (new)**

`ApiError` was one class doing four jobs, and `status: 0` stood in for three
unrelated failures: an unreachable host, a body that was not JSON, and a response
whose shape the panel did not recognise. Callers then asked `error.status === 409`,
which put the meaning of a number into six files across four layers.

- `ApiError` is now abstract, with `NetworkError`, `ContractError` and
  `ResponseError` under it, and `BadRequestError`, `UnauthorizedError`,
  `ForbiddenError`, `NotFoundError`, `ConflictError`, `RateLimitedError` and
  `RefusedError` under that. `responseErrorFor` is a **table**, and the only place
  in the codebase that turns a status into a meaning.
- Every failure answers `transient` for itself, so `src/query.ts`'s retry
  predicate no longer compares statuses at all.
- The seven `instanceof ApiError && error.status === N` sites are gone, and with
  them nine raw status literals.
- `cause` is kept. The `TypeError` from `fetch` and the `SyntaxError` from
  `JSON.parse` used to be discarded at the boundary.
- `RateLimitedError` carries `Retry-After`, which nothing read before.

**Fixed — a schema mismatch was retried twice for nothing.** `status: 0` is not a
4xx, so the retry predicate read it as worth repeating. Two extra round-trips that
could not have succeeded, delaying the message the operator needed. `ContractError`
is not transient and stops immediately.

`authenticateAdmin`'s two refusals were bare `Error`s and are now `NotAnAdminError`
and `IdentityUnavailableError` (`src/features/auth/loginErrors.ts`, new).

**Assertions — `src/utils/assert.ts` (new)**

There were none. `assert` and `assertNever` are for invariants this codebase owns,
as opposed to anything the backend or the operator can produce. First three users:
`useAuth`'s missing-provider check, `getCatalogDeletion`'s previously absent
`default`, and `withAlpha`, which produced `rgba(NaN, …)` on a malformed hex and
left a surface with no background and nothing in the console.

`AssertionError` is in `getErrorMessage`'s internal list, so a broken invariant
reaches the console rather than an alert the operator can do nothing about.

**Nothing mutable leaves a module**

- **`src/api/client/httpTransport.ts` (new).** Services were handed the whole
  `ApiClient`, which publicly exposes `setToken` — so `BugReportsService` could
  revoke the operator's session, and nothing but convention stopped it. They now
  receive `HttpTransport`: four verbs, no session. This is the change worth
  pointing at in the Entwurf.
- **`EMPTY_LOG_META` was a shared mutable object.** `const` binds the reference,
  not the four arrays inside it, and `auditLogModel.ts` re-exported the same
  reference under a second name. Frozen, along with `EMPTY_AUTH_STATE`,
  `EMPTY_USER_COUNTS`, `EMPTY_DASHBOARD_STATS`, `EMPTY_FILTERS`,
  `EMPTY_USER_FILTERS`, `NO_USER_QUERY` and the three user filter lists.
- Public collections are `readonly` — `AuditMeta`, `UserPage`, `RatingPage`,
  `AuditLogPage`, `Lecture.professors`, `Professor.lectureIds`,
  `ModeratedItem.replies`, `HelpSection.actions`. `readonly` appeared four times in
  `src/api` + `src/domain` + `src/utils` + `src/constants` combined before this.
- The compiler found one real aliasing bug doing it: `createProfessorEditDraft`
  put the caller's array straight into the draft the form then edits, so an edit in
  progress shared a reference with the catalogue query's cache. It copies now.
- `moduleAccent` was `Record<string, string>`, so `moduleAccent['/dashbaord']`
  compiled and returned `undefined` — and four of its five call sites had no
  fallback. It is private, keyed on `Route`, and reached through `accentForRoute`,
  which owns the fallback too.

**Command-query separation**

`readStoredSession()` was named as a query, used as one — a `useState` initialiser,
which React may call more than once — and **erased `localStorage` on three of its
five paths** while reconfiguring the API client. It is now a pure
`readStoredSession()` returning a classified result, and a `restoreSession()`
command that acts on it. A sweep of every `read*`/`get*`/`is*`/`to*`/`find*`/`has*`
function found no other.

**Fixed — the keyboard trap on every clickable row.** `activateOnEnterOrSpace`
fused "is this an activation key?" with `preventDefault()` and `activate()`, and
the query half was missing its `event.target === event.currentTarget` test. Because
keyboard events bubble, a row claimed every Enter pressed inside it: a keyboard
user who tabbed to a row's author chip and pressed Enter got **the row's edit
dialog**, because `preventDefault` suppressed the button's own click first. The
mouse path had been shielded since it was written; the key path never was.
Splitting the predicate out (`isOwnActivation`) fixes the smell and the defect in
one edit.

**No cyclic dependencies — `scripts/check-cycles.mjs` (new)**

Three cycles existed: `useUserProfile` ↔ `useUserProfileActions` over
`LoadedProfile`, and `LoginForms` ↔ each of its two step components over
`LoginFormsProps`. All three were `import type`, so nothing failed at runtime —
and all three were real edges on the module diagram a design review reads. The
shared declarations moved into modules both sides can depend on.

`docs/class-diagram.md` claimed acyclicity. That claim had been checked once, by
hand, and only *between packages*, which is why it missed three cycles inside
features. It is now checked on every `npm run check`, over all 256 files and 797
edges, and the check was verified by introducing a cycle and watching it fail.

**Named constants**

- **`src/theme/iconSize.ts` (new)** — 55 bare icon sizes onto a five-step scale
  named by where the icon sits. **No pixel changed**, deliberately: the same icon
  appears at 13, 14 and 15 across the panel, and naming the sizes makes that
  visible without a find-and-replace pretending to be a design decision. The eight
  genuine one-offs are named where they are used.
- **`src/api/client/paging.ts` (new)** — the page size was decided three times, and
  the constraint that justifies it (the backend accepts 1–100) was written beside
  only one of them.
- `RECENT_MEMBER_COUNT` replaces two `4`s in two files whose coupling existed only
  as prose in a comment.
- `MAX_QUERY_RETRIES`, `HTTP_STATUS`, `SEMESTER_YEAR_RANGE`, `LAST_MOMENT_OF_DAY`,
  and the two tooltip thresholds, which were an `80` and a `90` in separate files
  with nothing saying they were related or why they differ.

**Fixed — the report-reason filter clipped its longest option.** `w={180}` at
`size="sm"` leaves roughly 130px of text, and "Inappropriate content" needs about
140. A `Select` shows its value *in* the input, so there was no tooltip and no
title attribute — the truncated text was also what a screen reader read back. The
narrowest select in the panel held the longest label. Widths are now named by the
content they must hold (`controlWidth` in `src/constants/layout.ts`).

**Fixed — the sign-in card overflowed below 400px.** It was `width: 400`, not
`max-width`, inside a flex-centred page, so on a small phone or at 200% browser
zoom — which WCAG 1.4.4 and 1.4.10 both require to work — it overflowed on both
sides at once and its left edge could not be scrolled back into view. Checked at
320px and at 1280px in Chromium, not only asserted.

**API documentation — 273 symbols**

Every public service, hook and domain type now states what it does and its
contract. The gap was not only large, it was **inverted**: the leaf services that
nothing imports carried the contract prose, while the facades the app actually
calls carried none. `UsersService` exposed eleven methods without a word between
them, `src/context` had sixteen exports and no doc comment at all, and there were
**zero** `@param`, `@returns` or `@throws` in the entire repository.

Three docs were not missing but *wrong*, which is worse: `matchesLectureQuery`
carried a comment describing a reverse-index builder, `useUserProfile`'s contract
was attached to a private helper so the exported hook had none, and
`openReports` claimed "newest first" while doing no sorting.

`scripts/check-docs.mjs` (new) keeps it, and is deliberately shallow — it cannot
tell a contract from a restatement and does not try. It catches the one thing
review keeps missing: a symbol nobody wrote anything about. Verified by deleting a
doc comment and watching it fail. Private members are exempt on purpose.

**One decision, one place**

- **Fixed — the catalogue delete dispatcher had no exhaustive check.**
  `getCatalogDeletion` switched on `CatalogDeletion['type']` correctly; `CatalogPage`
  then switched on the *same* discriminant again as an if-chain whose final
  `return` was "delete a rating". A fourth kind of deletion would have got its own
  correct wording and then silently deleted a rating. The call is chosen alongside
  the wording now, and `assertNever` makes a fourth kind fail to compile.
- **The Help page's hand-copied palette had already drifted.** Seven transcriptions
  of `constants/colors.ts`, six agreeing by luck; the seventh documented a
  dashboard card called "Not blocked" in yellow, and the dashboard has never shown
  a card by that name or in that colour. Every row now reads the real map, the card
  names are one constant read by both files, and "every 15 seconds" is computed
  from `REFRESH_INTERVAL_MS` instead of retyped.
- The `/system/status` counter names were spelled out in two feature modules that
  knew nothing about each other, with different defaults and with `openBugReports`
  known to only one. They live in `src/api/system` now, as `SystemCounts`. The
  fixtures that were passing a `comments` counter the panel never reads no longer
  type-check.
- `auditActionColor` was an if-chain in the audit feature typed on `string`, so the
  `AuditAction` union bought nothing. It is a table plus a suffix rule in
  `constants/colors.ts`, where `docs/DESIGN.md` says colour decisions live. The
  suffix rule stays: a deletion has to read as a deletion whatever it removed.
- `CommentsPage` routed four mutations with four identical ternaries over
  `item.kind`. One lookup table replaces all four.
- **`src/components/ClickableRow.tsx` (new)** — five rows carried the same
  activation contract at three levels of correctness, and four of the five had no
  accessible name at all, so a screen reader announced "row, eight columns" with no
  hint it was activatable. `label` is required, so the incomplete version is now
  impossible rather than discouraged. `keepFromRow` was the same three lines in
  three files and is now one.
- Colour decided outside the maps: Active/Inactive inline in both catalogue rows
  (a state with no entry in `colors.ts` at all), `UserChip` hardcoding `"red"` for
  a blocked account, and `ProfileActions` deciding block/unblock colour, icon,
  label and action with four ternaries over one condition.

**The `Audit*` type shim is gone.** `src/api/logs/auditLogTypes.ts` renamed eleven
domain types and added nothing, so a rename travelled through three modules and the
feature layer read the same concepts under two vocabularies. The domain uses the
`Audit*` names itself now — which is the accurate name, since the activity log it
was once shared with is gone (ADR 0002) — and the aliases went with the shim. The
dead `LogPage` went too.

### Unchanged on purpose

- **The `model/` packages stay functional** — data and the operations on it in one
  module, rather than classes with methods. The module boundary *is* the
  encapsulation, and converting would mean rehydrating objects that come out of the
  query cache as plain JSON at every boundary. Recorded as an ADR rather than left
  as an omission.
- **`role="button"` is not added to the clickable rows.** It would strip the row
  out of the table's structure — one defect traded for another. The accessible form
  is a control inside the first cell, which is a visual change and wants the pass
  `docs/DESIGN.md` asks for. `docs/TODO.md` carries it.
- **The 13/14/15 icon sizes are not unified**, and neither are the two empty-state
  sizes that differ from the scale. Naming them was behaviour-preserving; changing
  them is not.
- **`isAuditActorType` is kept although nothing outside its own test uses it.**
  Deleting production code and its tests mid-refactor buys less than it risks; it
  is recorded as dead surface instead.

### Tests

- `apiErrors.unit.test.ts`, `assert.unit.test.ts`, `keyboard.unit.test.ts` and
  `ClickableRow.unit.test.tsx` are new — 33 tests over the four things this cycle
  introduced or fixed.
- The three `ApiClient` tests that asserted `status: 0` were the tripwire for the
  error hierarchy and now assert the type and `transient` instead.
- `deletion.unit.test.ts` gained a dispatch test, because the point of folding the
  call in beside the wording is that the two cannot disagree.
- `SystemStatusService.unit.test.ts` now asserts that a counter the backend did not
  serve comes back `null` rather than passing through.
- `formatDate` answered `'-'` for an unparseable date while every other marker in
  the panel was `'—'`. One `EMPTY_VALUE`, and the test asserts the constant.

**The gate.** 41 files, 320 tests, coverage **92.06 / 84.62 / 90.37 / 93.94** — up
on every axis from 91.23 / 84.16 / 89.03 / 93.49. Zero warnings, clean build.
`npm run check` now runs lint, the cycle check, the documentation check and `tsc`.

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
