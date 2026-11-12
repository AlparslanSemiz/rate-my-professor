# Changelog

## [Unreleased]

### Four complaints, taken to a real browser against the real backend

The previous rounds answered these with numbers and got two of them wrong, so this round
changed the method: the dev server ran against the **live backend** (`VITE_MOCK_BACKEND`
unset, the `/api` proxy forwarding to the bw-cloud instance), signed in with a real session,
and every claim below was looked at in a screenshot before and after the change. 92 active
lectures, 132 professors, 32 ratings - not a three-row fixture.

**Two findings were wrong, and both were wrong in the same way: they measured a box that
could not report the defect.**

#### `src/theme/components.ts` - the status badge is sized by its label (`F-075`)

- **Added** a `Badge` theme entry with `styles.root.minWidth = 'max-content'`. Mantine gives the
  badge label `text-overflow: ellipsis`, which makes its min-content contribution **zero**: the
  badge never asks its column for room, so `table-layout: auto` sized the catalogue's Status
  column from its `STATUS` header alone and every row read `ACTI...`, with the inactive ones
  reading `INAC...`.
- **Seen red first, in a screenshot, at 1440** - the width nobody thought was affected. Measured
  per label: Lectures `ACTIVE` needs 39 and got **30**, `INACTIVE` needs 50 and got **38**,
  Professors `ACTIVE` needs 39 and got **32**. At 1024, `INACTIVE` got 33. Users clipped nothing,
  which is why it looked like a badge difference and was a column difference.
- **What it costs, which is the question [TODO.md](docs/TODO.md) refused to answer blind:**
  Status goes 88 to 96 (`ACTIVE`) and 96 to 107 (`INACTIVE`); Lecture pays 3-5px and Professors
  6px, both of which wrap; the table's own width stays at its `minWidth` and **nothing starts
  scrolling that did not scroll before**.
- **In the theme rather than at the three rows that show it**, because it is one decision about
  how a badge sizes itself. Swept across all eight routes at 1024 before choosing that scope: no
  route gained an overflowing cell or document overflow - including Comments, whose
  `table-layout: fixed` cannot widen a column and was the one place this could have pushed the
  overflow outwards instead.
- **Not** the third option the brief offered: the catalogue badge is `variant="light"` and has no
  dot section to remove. The dot is on Users, which is the table that already worked.

#### `src/index.css` - the page no longer widens when a dialog opens (`F-062`)

- **Added** `scrollbar-gutter: stable` on `html`. Mantine locks the body while a modal is up, and
  on a browser with classic scrollbars that hands back the 9px the page was drawn around.
- **Reproduced, which is what the finding was waiting for.** `F-062` was left open for want of
  "a browser with classic scrollbars to confirm first"; the earlier run used a Chromium with
  overlay scrollbars, where the gutter is 0 and there is nothing to take away. On this machine,
  on the live catalogue at 1024: `documentElement.clientWidth` **1015 -> 1024 -> 1015** and every
  panel's right edge, the tab strip's included, travelled **+10px out and back** - on every open
  and every close. The left edges do not move, because the layout is anchored left, which is why
  it reads as the right-hand side of the screen jumping rather than the page recentring.
- **After:** panel right edge 983 in all three states; `documentElement.scrollWidth` 1015
  throughout. Confirmed in the pixels as well as the numbers - the panel surface and its row
  separators end 10px further left with the dialog open than they did before.

#### `src/features/catalog/CatalogPage.tsx` - the catalogue counts against the catalogue

- **Changed** each table panel's `totalCount` from the filtered list to the unfiltered one. The
  denominator's own words are "in the catalogue", and it was counting the filter: against the
  live backend the panel read **"92 of 92 in the catalogue"** under a stat card reading **95**,
  so the three inactive lectures looked like rows the panel had lost rather than rows the filter
  was holding back. Now "92 of 95", "3 of 95", "95 of 95".
- **Changed** `useCatalogLists.ts`'s docstring on `lecturesInState`, which described the value as
  "every row read, whatever the filter shows" - the opposite of what it became when the activity
  filter landed.

#### `src/test/msw/browser.ts` - a fault override that had stopped applying

- **Changed** the `?fault=long-content` catalogue override from `/data/lectures` to
  `/data/lectures/all`. The catalogue moved to the admin read when the activity filter landed and
  this override kept patching a path the panel no longer requests, so the fault silently stopped
  reaching the catalogue while still reaching Comments.

### Tests

- **Added** `e2e/layout.spec.ts`: every badge label on every route at all three widths, measured
  against the box it is drawn in. **The box is the point** - the root is `width: fit-content` and
  never overflows, so every earlier sweep over cells, rows and tables answered "nothing is
  clipped" while 92 rows on screen read `ACTI...`.
- **Added** `e2e/layout.spec.ts`: every panel's right edge recorded before, during and after a
  dialog. It measures the **edges**, which move on any browser, rather than the gutter, which is
  the measurement that missed `F-062` the first time.
- **Added** `src/theme/theme.integration.test.tsx`: the badge declaration, alongside the Modal
  transition it sits next to - the deterministic half of a layout question.
- **Added** `src/features/catalog/CatalogPage.integration.test.tsx`: the panel's denominator under
  each of the three filters. Nothing asserted that string before, which is why changing it broke
  no test.
- **Changed** six page-overflow assertions from `toBe` to `toBeLessThanOrEqual`, in
  `e2e/layout.spec.ts`, `e2e/faults.spec.ts` and `e2e/surfaces.spec.ts`. Overflow is `needs >
  gets`; equality was a proxy that held only while the page filled its viewport exactly, and the
  reserved gutter makes a non-scrolling page legitimately 10px narrower. **82 measurements failed
  with nothing wrong with them**, which is what a proxy assertion costs when the thing it stood
  in for changes.
- **Changed** the narrow-width navbar assertion to compare against `document.body.clientWidth`:
  Chromium reports the root's `clientWidth` as the whole viewport even where the gutter has
  reserved part of it, so the root says 320 while everything laid out inside gets 310.

### Unchanged on purpose

- **`F-086` is real, is not a Playwright artifact, and is still not fixed.** Its record says the
  scroll happens because "the browser scrolls a control into view before activating it", and
  [layout-audit.md](docs/coursework/layout-audit.md) §11.3 attributes the same numbers to the
  harness. Measured this round with **no click and no `scrollIntoView`** - Tab, Enter, Escape
  only: tab 14 moves focus from the row to the 22px Edit icon and the *browser* scrolls the
  holder to **290**, putting the Lecture column at `x = -18`, and it is still 290 after the
  dialog closes. Three fixes were tried and rejected: restoring `scrollLeft` on close restores
  the scrolled position, because the scroll happens at focus time and before the dialog exists;
  a sticky action column cannot be painted, because the panel surface is a vertical gradient and
  a sticky cell would need a flat one; and the focus scroll itself is the browser's, not
  something the panel calls. It stays with the `F-036` column pass, now with the cause named
  correctly.
- **The ratings and comments screens were checked and are right.** Against the real backend:
  `SCORES` carries real per-category numbers, `Rated by` carries real student names rather than
  `Unknown`, the tab strip sits at y=220 on all three screens, and the rating detail opens
  populated. That is `F-089` confirmed against the backend it was written for, having only ever
  run against fixtures written to match it.
- **The catalogue's inactive round trip works, end to end, on the live instance.** The panel calls
  `/data/lectures/all` and `/data/professor/all`; both answer 200. Walked in full: `Deep Learning
  and Neural Networks` (DLNN) and `Tamim Asfour`, each deactivated, confirmed gone from the
  default Active list, found under Inactive, reactivated, and confirmed back. `PATCH
  /data/lectures/{id}` and `PATCH /data/professor/{id}` both 200. The instance was returned to its
  starting state and re-read to prove it: 95 lectures / 92 active / the same three inactive, 132
  professors / 0 inactive.
- **`README.md` and `wiki.md` are untouched, and were checked rather than assumed.** Neither
  describes the catalogue's activity filter, the panel's counting, or anything about scrollbars,
  so the rule that a change to one is applied to both has nothing to apply here.
- **`docs/worklog.md:71` still says the panel does not call the `…/all` reads, and stays.** It is
  a dated entry recording what was true during an earlier round; correcting it in place would be
  rewriting the log rather than continuing it.
- **Comments has two visible column defects that were seen and left.** The LECTURE column
  truncates to `KAK -...` and `AFR -...`, which name nothing, and `MustafaTester3456789` in AUTHOR
  runs into the cell beside it - 11 overflowing cells at 1024, unchanged by this round's badge
  rule. That is `F-012` and `F-036`, whose column pass is deferred, and widening a column in a
  `table-layout: fixed` table is that pass rather than a value.


### The numbers this round was measured on

Re-derived from the runs, per [testplan.md](docs/testplan.md) §0.

- **Updated** the coverage block in [testfindings.md](docs/testfindings.md) - **93.21 / 86.58 /
  91.79 / 94.86**, generated from `coverage/coverage-summary.json`, previous block kept below it.
  Branches fell **0.16** and it is not a regression: `toScores` and the rating detail's
  empty-category branch are new code with a branch each, and the suite covers the populated
  path.
- **Updated** [testplan.md](docs/testplan.md) §3a: Layer 4 was 174 and is **202** (layout 37 to
  **65** - the badge sweep and the panel-edge test); the Playwright suite was 205 and is
  **233 tests in 15 specs**.
- **Added** a run-log row: check clean at **286 files, 967 edges**; **51 test files, 1223 tests,
  3 skipped**; **233 Playwright tests in 3.7 minutes**; build in 378ms.

### The ratings columns now hold the backend's data, and open (`F-089`, `F-083` half)

Mapper first, view second, because a detail view built on the old mapper would have shown
`Unknown` and `-` in every field it has.

#### `src/api/catalog/ratingTypes.ts`, `ratingMapper.ts`

- **Changed** `BackendRating` to the shape the backend actually serves: `student` and
  `topics: [{category, value}]`, not the `author` and `scores` the panel invented. **Added**
  `toScores`, which folds the ordered list into the map the screens read - insertion order, so
  the backend's category order survives, and an entry missing either half is dropped rather
  than written as `undefined`, which would render as a category scored "-".
- **Red first, and exactly as predicted:** pointed at the documented payload, the existing test
  failed `"Alice Smith" -> "Unknown"` and `{CONTENT: 5} -> {}`.

#### The rest of the stack, which was consistently wrong with it

- **Changed** `RatingsService.unit.test.ts`, `sweepFixture.ts`, `demoData.ts` and the MSW
  handler's data to `student` and `topics`.
- **`fixtureEnums.unit.test.ts` went red on the way, and that is the sweep working.** It
  hard-coded a `scores:` literal to search for and reported `no 'scores' literal was found to
  check`. It now sweeps `category:` literals and asserts the same thing about the same values.

#### `src/features/catalog/components/RatingDetailsModal.tsx` - new

- **Added** a read-only view of one rating: every category and its score, the student, the date.
  Opened by the row through `ClickableRow`, which closes half of `F-083` - the ratings row was
  one of the two in the panel that answered a click with nothing.
- **Read-only by contract, not for simplicity.** The panel's whole call surface holds
  `ratings.list` and `ratings.delete` and no write, and both repositories say a rating can be
  removed and never rewritten. There is no editor to build. Deletion stays on the row.
- **Moved** `DetailSection` and `detailStyles` to `src/components` when this became their second
  caller, rather than importing a log component into the catalogue.
- **Registered** as the twelfth surface in `e2e/surfaces.ts`, so it is measured for fit, focus,
  naming and contrast with the other eleven.

### The tab strip is in the same place again (`F-087`, and a correction to `F-065`)

- **Moved** the catalogue's filter bar below its tab strip, where Comments has always rendered
  its own. Tab strip **306.6 -> 220.6**, equal on all three tabbed screens; filter strip and
  table panel now equal on both screens that have them (276.6 and 362.6). The `Tabs.List`
  margin went 16 to 20 in the same pass, because 16 left it 4px short of Comments and near
  equality is the whole subject of this finding.
- **Corrected the `F-065` record.** It was closed on "the tab strip starts in the same place on
  every screen", and that stopped being true when `F-067` landed. Its row now says so, and says
  what put it back.
- **Aligned** the two row-action groups whose cell is wider than their content, so all five
  tables end their actions at **1387** - 21px from a panel edge that is 1408 everywhere. Was
  1361.6 on Comments and 1356.7 on Ratings.
- **Added** `EMPTY_STATE_PADDING` and used it in all six empty states, which carried three
  paddings between them. The logs' hand-written 34px icon is now `iconSize.emptyState`, and
  Users gained an icon so the six read the same.

### No dialog moves as it opens (`F-090`)

- **Opened and fixed** `F-090`. Every dialog entered with Mantine's `fade-down`, a **30px**
  `translateY` - measured on six, sampled every 40ms from the click, height unchanged
  throughout, so travel rather than growth. `DESIGN.md` §Motion allows one movement in the
  panel, `translateY(-2px)`, and says nothing moves further. `transitionProps: { transition:
  'fade' }` in the `Modal` theme: **0px, one position, all twelve.**
- **Why §11.3 missed it:** that sweep sampled the page's anchors 700ms after opening. The
  background genuinely does not move; the dialog does, and nothing had measured it.
- Pinned twice on purpose - frame sampling in `e2e/surfaces.spec.ts`, which caught seven of
  eleven and let four pass by luck, and a declaration check in `theme.integration.test.tsx`,
  which cannot.

### The log filter bars fill their width (`F-088`, partly)

Not collapsed to one row - that stays deferred with its four costed options. The dead space is
gone: right-hand gap **0 at 1024, 1152, 1280, 1366 and 1440 on both bars**, down from 923 and
741 at 1440.

- **Added** `wrappingFilterFieldWidth`, the same three shapes without the upper bound, used only
  by the two bars that wrap. The four that never wrap keep their caps, because removing those
  would stretch two controls across 1094px - the growth `F-067` added the bound to stop.
- **Grouped** the two date fields into one flex item. Without it, filling the row made Audit's
  second row a single **1094px** date field, worse than the gap it replaced. As a pair they
  never split, so no row is left holding one control.
- This closes `F-088`'s documentation half: both bars now wrap the date pair, which is the shape
  `F-067`'s record already claimed.
- **Cost, recorded:** each date box is about 541px, wider than its content needs.

### `docs/class-diagram.md`

- **Added** a rendered PNG above each of the six Mermaid blocks, with the source kept beneath in
  a collapsed `<details>`. The coursework is handed in as a PDF and a PDF renders no Mermaid, so
  a reader of the export would otherwise get six code blocks where the diagrams should be.
- Rendered with Mermaid in the Chromium Playwright already caches - **no new dependency, and no
  puppeteer download**. The renderer lives in the session scratchpad, like the layout audit's
  measuring spec.
- **Corrected** the cycle count in its prose from 276 files / 899 edges to **286 / 967**, per
  [testplan.md](docs/testplan.md) §0.

### The numbers this round was measured on

Re-derived from the runs rather than carried forward, per [testplan.md](docs/testplan.md) §0.

- **Updated** the coverage block in [testfindings.md](docs/testfindings.md) - **93.21 / 86.74 /
  91.86 / 94.87**, generated from `coverage/coverage-summary.json` with the per-directory rows
  summed from the same artefact, and the previous round's block kept below it.
- **Updated** [testplan.md](docs/testplan.md) §3a: Layer 4 was 146 and is **156**; the Playwright
  suite was 14 specs / 177 tests and is **15 specs, 187 tests**. Both re-derived with
  `npx playwright test --list`.
- **Added** a run-log row: check clean at **285 files, 949 edges**; **51 test files, 1219 tests,
  3 skipped**; **187 Playwright tests in 2.9 minutes**; build in 332ms.
- The suite grew by 13: ten in `e2e/fields.spec.ts`, one theme declaration test, two catalogue
  filter tests.

### Four measured, none applied: symmetry, the log bars, the ratings columns (`F-087` to `F-089`)

Items 4 to 7 of seven. **Measurement only, on the brief: the deviations and one proposed
standard each, and the choice is the maintainer's.** Numbers in
[docs/coursework/layout-audit.md](docs/coursework/layout-audit.md) §11.5 to §11.8, deferral
entries with costs in [docs/TODO.md](docs/TODO.md).

**Opened**, most serious first:

- `F-089` **Major** - the Ratings table's Scores column is a dash and Rated by is "Unknown" on
  **every row** against the deployed backend, and looks convincing here. Verified by handing
  `toRating` the payload the backend documents rather than by reading it: `student` and
  `topics: [{category, value}]` go in, `{authorName: 'Unknown', scores: {}}` comes out. The
  mapper, its unit test, both fixtures and the MSW handler all use the panel's own invented
  names, so the stack is self-consistent and wrong together.
- `F-087` **Minor** - the tab strip is at 220.6 on Comments and Bug Reports and **306.6** on the
  catalogue. `F-065` was closed on the sentence that they are equal; `F-067` then put the
  catalogue's filter bar above its tab strip while Comments keeps its filters inside the tab
  panel. Neither step was wrong alone, and each measured what it changed.
- `F-088` **Minor** - both log bars take two control rows at **every** width from 1024 to 1440,
  and Audit's second row at 1440 is one 170px control with **923px** of space beside it. The
  record for `F-067` says the two wrap the same way; measured, Audit keeps `From` on row one and
  wraps `To` alone, while Activity wraps both dates together. That section's own date table
  already said so - the summary sentence and the table under it disagreed.

**Also measured, and deliberately not turned into findings:**

- **Row actions** end at three insets from a panel edge that is 1408 everywhere: **21px** on
  Comments Reports, Lectures and Professors, **46.4** on Comments All, **51.3** on Ratings.
  Proposed standard: 21, which three of the five already use. Recorded under `F-087`.
- **Two empty-state shapes**: 101px tall with 40px padding on Users and the catalogue, 191px
  with 60px and an icon on Comments and Bug Reports.
- **Seven tables, seven `minWidth` decisions** - 1100, 1000, 960, 900, 900, 860, 760 and none at
  all on Users. Proposed standard: **leave them.** A single value would cramp Comments or pad
  Ratings; the question worth deciding is `F-036`.
- **Filter-bar break points follow control count**, not a shared breakpoint: one to three
  controls never wrap between 1024 and 1440, four wrap only at 1024, six and seven wrap at every
  width.
- **A rating cannot be edited on either side** - the whole call surface holds `ratings.list` and
  `ratings.delete` and no write - so what `F-083`'s missing row click wants on that table is a
  read-only detail view, not an editor.

**Refuted, and recorded so they are not re-reported:**

- **Modal widths are two values, 620 and 380.** The brief asks for a report above three.
- **Cell alignment is uniform** across all seven tables, left through `TableHeaderRow`; only
  empty states centre.

### The background does not move when a detail view opens (`F-086` opened)

Item 3 of seven. **Measurement only; nothing was changed.** Numbers in
[docs/coursework/layout-audit.md](docs/coursework/layout-audit.md) §11.3 and §11.4.

The brief said the page behind a dialog shifts "in some places". It does not, in any of them.
§2.1 had measured seven anchors on six modals at 1440; this is **eleven** surfaces - the whole
`e2e/surfaces.ts` registry - at **1440 and 1024**, with the card row and the filter strip added
as anchors. **594 readings, none over the 1px tolerance**, on open and on close. The two dialog
widths are still 620 and 380.

**Refuted, and recorded so it is not re-reported:** the first run showed `tableFirstRow` moving
382px on Comments and 282 on the catalogue at 1024, which are `F-036`'s overflow figures
exactly. That was the measurement's own doing - Playwright scrolls a control into view before
clicking it, so the reading charged the modal for a scroll the click caused. Sampling after
bringing the opener into view gives **zero on all 22 combinations**.

**Opened** `F-086` **Minor** - the click effect is real for an operator even though the dialog
is innocent. Reaching an Edit control at 1024 scrolls its table fully right (Comments 0 to 382,
the catalogue 0 to 282) and **closing the dialog leaves it there**, with the columns that say
what the row is off the left edge. Users and Audit Logs hold at 0, because they have no
row-action column. Downstream of `F-036`; deferral entry with its cost in
[docs/TODO.md](docs/TODO.md).

### Unchanged on purpose

- **`scrollbar-gutter: stable` was pre-authorised and is still not applied.**
  `window.innerWidth - documentElement.clientWidth` measured **0** before and during every one
  of the eleven dialogs, at both widths: Mantine locks the body while a dialog is open, and this
  Chromium's scrollbar is an overlay taking no width, so there is nothing to compensate for. The
  brief said to write it down if the measurement came back zero. It came back zero. `F-062`
  stands unfixed for the reason §2.6 gave - it needs a browser with classic scrollbars first.

### A deactivated lecture can be found again (`F-006`, `F-085`)

Item 2 of seven, and the backend raised the same thing as `F-42`. Numbers in
[docs/coursework/layout-audit.md](docs/coursework/layout-audit.md) §11.2.

**The fixture was fixed first, and it is the more interesting half.** The mock backend answered
the active-only reads with **every** row, so the door this finding is about could not be
reproduced by anything: measured before touching the panel, the catalogue listed 3 lectures,
switching one to Inactive left 3, and it stayed on screen with an `Inactive` badge. The panel's
own warning that the row was about to vanish had never once been true in a test, and the two
integration tests over that warning asserted it was **shown** without ever checking what it
claims. `F-085`, and the same shape as `F-041`: a fixture wrong in the panel's favour reads
exactly like a clean measurement.

#### `src/test/msw/handlers/catalog.ts`

- **Added** `GET /data/lectures/all` and `GET /data/professor/all`, and **corrected**
  `/data/lectures` and `/data/professor` to filter to `active = true` the way the backend does.
  With this alone the door reproduced: 3 rows became 2, then 1.

#### `src/api/catalog/LectureCatalogService.ts`, `ProfessorCatalogService.ts`, `CatalogService.ts`

- **Changed** both catalogue reads to the `/all` pair. The backend maps them to the legacy paths
  too, so this needs nothing from `F-005`.

#### `src/features/catalog/model/catalog.ts`, `hooks/useCatalogLists.ts`, `CatalogPage.tsx`

- **Added** an All / Active / Inactive filter, defaulting to **Active** so the screen looks as it
  did, as a `Select` in the filter bar beside each tab's search - the shell `F-067` established,
  and `filterFieldWidth.select` for the width. `matchesActivity` and `toActivityFilter` follow
  the moderation filters' shape rather than inventing a second one.
- The narrowing happens **before** the search, so the search reports how many of the rows on
  screen match rather than how many exist in a state nobody asked to see. The tab counts follow
  the filter for the same reason.
- **No new colour.** Status still reads from the green/gray `activeStatusColor` badge both
  catalogue tables already draw.

#### `src/features/catalog/components/InactiveVisibilityNotice.tsx`

- **Rewrote** the copy, which this change made false. It said the record "cannot be found or
  switched back on from here; the change has to be undone in the database". It now says the row
  leaves the app and the default view, and where to look for it.

**Measured after**, in the browser: Active 2 rows, Inactive 1 - `Lineare Algebra I`, which no
screen could reach before - All 3; deactivating `Programmieren` drops the default view to 1, the
Inactive filter finds it, and switching it back on restores it.

#### Tests

- **Added** two filter tests to `CatalogPage.integration.test.tsx`, **red first**.
- **Updated** `src/test/msw/apiCalls.ts` with the new paths, which is what the call-surface
  ratchet demands before it will go green again, and which regenerates the resilience cases.
- **Widened** five existing catalogue tests to `All` rather than deleting them: they assert on
  the fixture's inactive rows, which are now behind the default filter. One assertion is now
  scoped to the table, because `Active` and `Inactive` are also the filter's own options and
  Mantine keeps its dropdown mounted in a portal.
- **Updated** `degradedPayloads.integration.test.tsx` to serve its degraded payload on the path
  the panel now asks for.

#### `docs/consumer-contract.md`

- **Moved** `GET /data/lectures` and `GET /data/professor` into "defined but not read", and the
  `/all` pair out of it. The per-endpoint sections and the numbered index follow.

### Every multi-line box shows what is in it (`F-084`)

Item 1 of seven. Measured first, in
[docs/coursework/layout-audit.md](docs/coursework/layout-audit.md) §11.1, then fixed, then
measured again.

**What was wrong.** All five `Textarea`s in the panel declare a floor - `minRows` of 5, 4, 3, 2
and 2 - and none of them was getting it. Mantine drops `minRows` and `maxRows` unless `autosize`
is set, and `autosize` appeared **zero times** in the repository, so every box rendered at the
browser's default two rows: **2.5 rows including padding, at both 1440 and 1024**. The comment
editor showed **164 of its comment's 191 characters**, cut mid-sentence, with no scrollbar drawn
until the box is focused.

#### `src/theme/components.ts`

- **Added** `defaultProps: { autosize: true, maxRows: TEXTAREA_MAX_ROWS }` to the `Textarea`
  entry, and `TEXTAREA_MAX_ROWS = 12` with the reasoning above it. One place, not five: the call
  sites keep their own floors, and this only makes the numbers they already declare take effect.
  After: **5.6, 4.6, 3.5, 2.5 and 2.5 rows**, nothing hidden in any field at either width.

#### `e2e/fields.spec.ts` - new

- **Added** ten tests, the five fields at two widths, each measured holding its fixture value and
  then the 264-character `long-content` string. **Red first**, all ten, on `the comment editor
  declares minRows=5 / Received: 2.5`.
- The page assertion is a **delta**, not "the page must not scroll": Users at 1024 is 963px tall
  before anything is opened, so the absolute form failed on the route rather than on the field
  and said nothing about either.

#### `src/test/setup.ts`, `src/test/testDoubles.ts`

- **Added** a `document.fonts` double beside `ResizeObserver` and `matchMedia`. Autosizing runs
  in jsdom too, and Mantine's font-loading effect calls `document.fonts.addEventListener`
  **unguarded**, which jsdom does not implement. It only reached `theme.integration.test.tsx`,
  because every other component test renders through a bare `MantineProvider` and so never sees
  the panel's own defaults - worth knowing, and left as it is.

#### `src/theme/theme.integration.test.tsx`

- **Added** a test that the theme still declares the growth and the ceiling. Asserted on the
  theme object rather than on a rendered box, because Mantine turns autosizing **off** whenever
  `NODE_ENV` is `test`: jsdom cannot answer the behavioural question at all, and
  `e2e/fields.spec.ts` is what does.

### Unchanged on purpose

- **A cap on the modal body was planned, approved and then not applied**, because the
  measurement said it was already there. `.mantine-Modal-content` carries
  `max-height: calc(100dvh - 2 x yOffset)` with `overflow-y: auto` - **810px at a 900px viewport,
  630 at 700** - and scrolls itself while `body` stays `overflow: hidden`. Adding a second cap
  would have nested a scroller inside a working one. Filled with 1500 characters the comment
  editor stops at 275px, scrolls **inside the field**, and leaves the dialog at 556, the document
  at 900 and Save on screen at y=675.
- **`MetadataList.tsx` and `ChangeList.tsx`** were measured and left. Both hold read-only text in
  the audit detail panel rather than inputs, and neither pushed anything in this round.

### The numbers this round was measured on

Re-derived from the runs, per [testplan.md](docs/testplan.md) §0.

- **Updated** [testplan.md](docs/testplan.md) §3a: Layer 4 was 146 and is **156** (layout 37,
  focus 12, a11y 9, surfaces 71, keyboard 4, faults 13, **fields 10**); the Playwright suite was
  14 specs / 177 tests and is **15 specs, 187 tests**.
- **Added** a §3b scope row for the new layer-4 sweep, saying what it scanned and what it found.
- Vitest: **51 files, 1217 passed, 3 skipped**. `npm run check` clean at 285 files, 949 edges.

### The numbers this round was measured on

Re-derived from the runs rather than carried forward, per [testplan.md](docs/testplan.md) §0.

- **Updated** the coverage block in [testfindings.md](docs/testfindings.md) - **93.15 / 86.67 /
  91.78 / 94.83**, generated from `coverage/coverage-summary.json` rather than transcribed, with
  the per-directory rows summed from the same artefact.
- **Updated** [testplan.md](docs/testplan.md) §3a. Layer 4 was 141 and is **146**, re-derived
  with `npx playwright test --list`: layout 37, focus 12, a11y 9, surfaces 71, keyboard 4,
  faults 13. Layer 6 was "13 specs, 172 tests" and is **14 specs, 177 tests** - and the row now
  says what that figure has always counted, which is the whole Playwright suite rather than that
  layer alone. The six flow specs are 17 of it.
- **Added** a run-log row: check clean at **285 files, 949 edges**; **51 test files, 1216 tests,
  3 skipped**; **177 Playwright tests in 2.6 minutes**; build in 404ms.
- Recorded with it: the e2e suite ran under the tracked config, with `trace:
  'retain-on-failure'`, and **`F-033` did not reproduce - because nothing failed, so no trace was
  retained.** That is a consequence of a green run, not evidence the flake is gone, and saying
  so is the difference between a result and a claim.

### The screenshot round: eleven observations measured, nine opened, three refuted

Measurement only. **Nothing on this list was fixed**, per the brief: each was measured at
1440x900 first and then written down. Numbers in
[docs/coursework/layout-audit.md](docs/coursework/layout-audit.md) §10, findings `F-075` to
`F-083`, deferral entries with cost in [docs/TODO.md](docs/TODO.md).

**Opened**, most serious first:

- `F-076` **Major** - the profile shows `3 warnings` beside `Warning history (0)` and `No
  warnings issued.`, 40px apart. Two endpoints, no cross-check, and a demo seed that
  contradicts itself on exactly one account. The only item here where the operator is told
  something untrue about a real account.
- `F-075` - **the STATUS badge clips its own text, and the earlier sweep looked at the wrong
  box.** §7's "zero clipped cells" is still true: the badge hides its overflow, so the *cell*
  never overflows. Measured inside the badge instead, at 1440 with the table fitting exactly:
  `INACTIVE` needs 49px of label and gets **34** on Lectures, **43** on Professors. The whole
  chain is measured - 92px column, 40px cell padding, 50px badge root, 34px of label. Not
  `F-036`, which is about tables that do not fit.
- `F-077` - `Status`, `Role` and `Credibility score` sit at y=686, 700 and 667, **33px apart**,
  because their help text is one line, two lines and none.
- `F-078` - `credibilityScore` renders as **`credibilityscore`**. `enumLabel` splits on `_` and
  preserves the first character's case, so a camelCase key passes through untouched. Three call
  sites; `F-073` was the fourth member of the family.
- `F-079` - the catalogue counts two of its three tabs.
- `F-080` - the session strip is above the `h1` and a page error below it, so the title sits
  between two alerts about the same screen.
- `F-081` - Bug Reports is the only screen with no table, and its status and severity commit
  with no Cancel and no Save. Both deliberate, both documented in the code, neither said on
  screen.
- `F-082` - the `Person` placeholder is **truncated by 39px**, canvas-measured against its own
  font, and `Person` and `Who` are two vague names for two different filters on one screen -
  where `Who` is also a column heading.
- `F-083` - two of seven tables have rows that open nothing. `RatingTableRow` says why;
  `ReportRow` keeps its hover state and does not.

**Refuted, and recorded so they are not re-reported:**

- **The Comments columns are not clipped.** Seven widths summing to exactly **1134**, the
  table's width and the holder's, with every first-row cell at `needs == gets`. What is visible
  is `ContentCell`'s deliberate two-line clamp.
- **The Dashboard's mismatched panel pair is gone.** Step 1 removed the right-hand one, so
  `Newest members` spans 1136px alone and the four cards are 116px each to the pixel.
- **`From` and `To` are the same width.** `F-067`'s 838.5 against 413.2 is 170 and 170 since
  the filter bar shell landed.

### `F-063` was measuring the wrong one of ten loading states

The finding says the loading state is a fixed 200px box and that "every screen short-circuits
to it while its first read is in flight". `PageLoader` has **ten** render sites, and that
sentence describes seven of them.

- **Corrected** the finding and [layout-audit.md](docs/coursework/layout-audit.md) §2.7. The
  list was produced by grep rather than from memory: seven in-page data loaders, one auth check
  in `ProtectedRoute.tsx:13`, and **two `Suspense` fallbacks**.
- The one that matters is `App.tsx:41`. **`AdminLayout` is itself `lazy`** (`App.tsx:13`) and it
  is the component that renders the `AppShell`, so while that chunk is in flight the fallback
  stands in for the **entire shell**: a 200px spinner on an empty page, no sidebar, no navbar,
  no gutters. That is the cold-load state on any signed-in route. `AdminRoutes.tsx:27`'s
  fallback sits *inside* `AppShell.Main` and keeps the sidebar, so the two are different states
  and the finding treated them as one.
- **Withdrew** the "could not be captured" claim. There is a screenshot.
- **Added** the reason the first attempt was blind rather than unlucky: the two `Suspense`
  states wait on **Vite chunk fetches**, not on API calls, so no delay injected at the network
  layer could have produced them whether or not `page.route` sat in front of the service worker.
  Two of the four waits were outside that measurement by construction.

### Unchanged on purpose

- There is still **no skeleton**, and one `PageLoader` still stands for four different waits.
  Splitting them is a design decision with a different answer per wait, and the correction is to
  the record rather than to the code.

### One filter bar, on all five screens that filter

`F-067`, and the largest change of this round. There were five layouts: two screens had a
`<form>` with its own panel, two had a bare panel and no Apply at all, and the catalogue had
no filter bar whatsoever - its search sat inside the table panel's header at **x=1067**, where
every other search is at **x=293**. None of that was decided; each screen had been written on
its own.

#### `src/components/FilterBar.tsx` - new

- **Added** the shell every filter bar now uses: a panel, a wrapping row of controls, and
  **Apply and Clear on a row of their own**. The buttons used to be the last two flex children
  of the same group as the controls, so where they landed was decided by how many controls a
  screen happened to offer. A row of their own makes that impossible rather than unlikely,
  which is why the shell owns the buttons instead of taking them as children.
- The shell renders a `<form>` only when there is something to submit. Comments and the
  catalogue filter as you type, so an Apply button there would have nothing to do.

#### `src/constants/layout.ts`

- **Added** `filterFieldWidth` - three shapes, `search`, `select` and `date`, each with a
  **`maxWidth`**. Every field had been written `flex: '<n> 1 <basis>'` with no upper bound, so
  its width was decided by what happened to wrap onto its row rather than by what goes in it.

#### Measured at 1440, before and after

- **Every search now starts at x=293**, the catalogue's having moved **774px** left.
- Comments' search: **922 -> 360**.
- Apply and Clear: still x=1147 and x=1295, now on a row the controls cannot reach.
- Audit Logs' end date: **838.5 -> 170**, against Activity Logs' **413.2 -> 170**. The widest
  spread between two identical controls is now **11px**, down from **425px**.

#### What did not close, said with the number

Both log screens still take **two control rows** at 1440, and the brief asked for Audit Logs
to fit on one. The content box is 1094px and Chromium gives `input[type=date]` an automatic
minimum size of about 170px rather than the 130px basis, so Audit's six controls need
**1140** - a 46px shortfall. Audit alone fits at **1090** with the search cut to a 240 basis
and the selects to 150; that was measured and **rejected**. Four pixels of slack is a
coincidence rather than a layout, and Activity Logs has a seventh control and reaches 1252
either way - so it would put the two log screens back on different layouts, which is the whole
of what `F-067` is. Both wrap identically now.

#### `src/features/catalog/`

- **Moved** the search out of `LecturesTable`, `ProfessorsTable` and `RatingsTable` into the
  page's filter bar, and **removed** `CatalogTablePanel`'s `controls` slot, which nothing used
  any more.
- **Changed** the tab from uncontrolled to controlled. The same cost `F-065` found on
  Comments: the control differs per tab - a text box for Lectures and Professors, a lecture
  select for Ratings - so the page has to hold the tab for the bar to follow it.

### Tests

- **Added** two assertions, both red first. `AuditLogsPage`: Apply and Clear are not in the
  container the search is in - `expect(element).not.toContainElement(element)` against the one
  `Group` that used to hold all ten. `CatalogPage`: the search precedes the tab strip in
  document order - `expected +0 to be truthy` - and the control **swaps** when the tab changes,
  which is the half that stops the bar being hoisted and then frozen on the first tab.
- Order and containment rather than coordinates, because jsdom has no layout. The browser
  measurement is in [docs/coursework/layout-audit.md](docs/coursework/layout-audit.md).
- **Changed** what `e2e/surfaces.spec.ts` pins for dialog contrast, from one number to two, and
  the measurement behind it is the point. The audit and activity detail panels each reported one
  more failure after the bar got taller, which reads exactly like a regression. It is not: both
  were measured **on either side of the change**, by stashing it and running the same tests. The
  audit panel went from `passed=10 failed=9 undetermined=1` to `passed=10 failed=10
  undetermined=0`, the activity panel from `passed=6 failed=6 undetermined=1` to `passed=6
  failed=7 undetermined=0`. **Same node count, same colours, one node decided instead of
  skipped** - the taller bar changed what axe can resolve behind the dialog, which is `F-035`'s
  entire subject.
- Chasing that turned up the larger problem: **`failed` alone was never a pinnable quantity.**
  Ten runs of the undo confirmation reported `failed` as 11, 10, 11, 11, 10 with the change and
  9, 10, 10, 10, 10 without it, so a single pinned integer goes red on roughly half of all runs
  while nothing about the panel has changed. What is stable across all ten, and across the
  change on all three log surfaces, is `passed` and `failed + undetermined`.
- **Changed** the map to pin those two per surface, for all eleven dialogs rather than the six
  that had a non-zero count. `notPassing` adds the two buckets together deliberately: `F-035` is
  the habit of counting `incomplete` as a pass, and this refuses to. The cost is stated in the
  file: a node sliding between `failed` and `undetermined` no longer turns anything red, because
  that is the timing artefact; a node moving in or out of `passed` still does, because that is
  the only move that means a colour changed. **Validated over 33 runs** - three repeats of all
  eleven - including runs where the undo confirmation reported 10 and 11.

### `F-073` had a second half, in the fixture its pin did not name

The Ratings fix changed `demoData.ts` and pinned it with a test called `demoData.unit.test.ts`,
which asserted over `demoBackend()` and nothing else. `sweepFixture.ts:145` carried the same
`{ content: 4, clarity: 5 }` and feeds the call-surface, resilience and accessibility layers, so
half the defect survived its own fix.

- **Changed** `src/test/msw/sweepFixture.ts` to `{ CONTENT: 4, CLARITY: 5 }`.
- **Renamed** the pin to `src/test/msw/fixtureEnums.unit.test.ts`, because it is about the
  fixtures rather than about one of them, and gave it two halves: a behavioural check over both
  builders, and a source sweep that finds fixture modules with `import.meta.glob` so a third one
  is covered without anybody remembering to add it.
- The lesson is the part worth keeping: **a pin that names its subject is only as complete as
  whoever wrote the name.** The first pin was not weak, it was narrow, and nothing said so.

### Tests

- Both halves **red first**: `expected [ 'content', 'clarity' ] to deeply equal []`, and
  `[ '/src/test/msw/sweepFixture.ts: content', '/src/test/msw/sweepFixture.ts: clarity' ]`.
- The sweep was **broken deliberately, twice**, to show it can still fail. Pointed at a glob
  that matches nothing it reports ``no `scores` literal was found to check: expected 0 to be
  greater than 0`` - the anti-vacuity guard `callSurface.integration.test.ts` established.
  Given a lowercase key in `demoData.ts`, a file it does not name, it reports
  `/src/test/msw/demoData.ts: clarity`.

### A killed end-to-end run could stop the lint from running at all

`F-074`. `.gitignore` naming a directory does not make ESLint skip it, and the two lists had
drifted: `test-results/` and `playwright-report/` were in the first and not in the second.

- **Changed** `eslint.config.js` so `globalIgnores` names both. A Playwright run killed
  mid-flight leaves half-written trace resources behind, and `eslint .` then walked into one
  and died with `ENOENT ... test-results/.playwright-artifacts-0/traces/resources/<hash>.js`
  **before linting a single source file**. `npm run check` was red on this machine for a
  reason that had nothing to do with the code.
- **Removed** the 157 MB of artefacts that were sitting there from the previous session's
  killed run. Reproducible output, ignored by git, referenced by nothing.
- The failure is loud, so nothing shipped because of it. What it cost was the gate: a check
  that cannot run is a check nobody is reading.

### Two records from running the gate, and one claim withdrawn before it was written

- **Extended** `F-024`. The flaky one is the **file**, not the test in it. This round the full
  suite timed out on the dashboard marker at `App.integration.test.tsx:130`, the same file run
  **alone** then timed out on a different test (`heading: 'Audit Logs'`, `:187`), and the same
  command a minute later was 20/20 green. That contradicts the row's own sentence that the file
  alone is 25/25 green and that only the suite's parallelism reproduces it. Not a regression:
  both are `findBy*` waits, and the second is on a route this round did not touch.
- **Withdrew** a finding about the suite under-collecting a file. `npm test` reported 49 files /
  1213 tests and then 50 / 1215, which reads like a defect and is not one: a second session was
  committing into the same tree between the two runs, and `6843e77` (+1 test) and `5476999`
  (+1 file, +1 test) account for the difference exactly. **`0f8420c`'s counts were correct for
  the tree they were measured on.** Recorded in `docs/testfindings.md` rather than dropped,
  because the near-miss is worth keeping: two counts taken from a tree somebody else is
  committing into are not two measurements of one thing, and a dated snapshot needs the commit
  it was taken at, not only the date.

### Ratings categories read like every other label

`F-073`. The Scores column showed `content 4 · clarity 5 · difficulty 3` while every other
enum in the panel is title-cased.

**The renderer was not at fault.** `enumLabel` maps a word to
`charAt(0) + slice(1).toLowerCase()`, which preserves the first character's case: `CONTENT`
becomes "Content", `content` stays "content". The demo fixture wrote the three categories
lower case while **every other enum in the same file** - `role`, `status`, `severity` - is
SCREAMING_SNAKE, and `RatingsService.unit.test.ts` shows the wire shape is `{ CONTENT: 5 }`.
The fixture was the outlier; the screen was faithfully rendering what it was given.

- **Changed** the three keys in `src/test/msw/demoData.ts` to `CONTENT`, `CLARITY`,
  `DIFFICULTY`. No source change.

### Tests

- **Added** `src/test/msw/demoData.unit.test.ts`, red first with all six keys failing. It pins
  the fixture's **shape** rather than one string, so the next enum written the wrong way fails
  too.
- Two things `tsc` caught there, now handled rather than cast away: `demoBackend()` returns a
  `Partial<MswDb>`, so the ratings are asserted present - `F-041` is the round where a fixture
  serving nothing read exactly like a clean measurement - and `scores` is nullable on the wire,
  so the test defaults it the way `ratingMapper` does.


### One table cell padding, decided once

`F-069`. Seven tables carried **three** different vertical paddings - 13px on Users, 14px on
the catalogue and both logs, 16px on the moderation content and report rows. Three answers to
one question.

- **Added** `tableCellPadding` to `src/constants/layout.ts`, set to **14px 20px** - the value
  the majority already used, so the fewest rows move. Users gains 2px, the two moderation
  tables lose 4px.
- **Changed** five row-style modules to use it. `TableHeaderRow` keeps its own smaller
  padding on purpose.
- Row heights measured after: **53.8 / 54.3 / 66.1 / 66.1 / 66.1 / 69.6 / 90.4**.

**The remaining spread is content, and stays.** A Comments row draws a two-line excerpt and
an author chip; Professors lists every lecture. Equalising those would mean truncating
content, not aligning a layout - so the token decides the padding, not the height.

### `F-033` reproduced again, and cost time again

The step-5 gate reported `4 failed | 173 passed`. **All four were the same
`browserContext.close: ENOENT ... .trace`, and the run contained zero assertion failures** -
grepping the log for `expect(` returns nothing. The identical suite with `--trace=off` gives
**177/177 in 1.8 minutes**, against 3.5 with tracing on.

Third independent confirmation of the same diagnosis, and the second time it has briefly read
as a regression in unrelated work. That is the real cost of leaving it open; the fix is still
a config change estimated at ~20 minutes.

### Tests

- **Added** `src/constants/tableCellPadding.unit.test.ts`, red first on `expected '16px 20px'
  to be '14px 20px'`. It compares the row-style modules directly rather than a rendered row:
  a rendered assertion would pass just as well with the value copied into each module, which
  is precisely what had happened.


### The card row needed nothing, and that is a measurement

`F-068` closed **without a code change.** Re-measured after the tab-strip fix: at 1440 every
card on every screen is **273.5** wide at **x=272 / 559.5 / 847 / 1134.5**; at 1024 every
card is **353** at **x=272 / 639**. `statGridCols` is already `{base: 1, sm: 2, lg: 4}`, so
the row is a fixed four-column grid and the cards are equal-width and aligned everywhere.

What the finding actually recorded was the **count** - Users has 3 where the others have 4 -
and an empty slot there is an accepted outcome, not a defect. Audit and Activity keep zero,
which is right: an event stream has nothing to count.

Also surfaced and also not a defect: at 1024 Comments' cards start at y=138.8 against 117.8
elsewhere, because its longer page description wraps at that width. Content, not layout.


### The Dashboard's title is a title

`F-064` and `F-071`, closed together by one change. `PageHeader` is the only component in
`src/` that emits an `h1` and the only one that draws the accent bar; the Dashboard drew its
own title and so had **neither**. A cross-route sweep put every other title at x=288, y=32
and found nothing here, which made the panel's landing screen the one screen whose title did
not read as one, and the one a screen reader had no top-level heading to navigate by.

- **Changed** `DashboardHeader` to render `PageHeader` with the greeting as its title.
  Measured after: **all eight routes** report the title at **x=288, y=32, 28px** and the bar
  at **4x26, x=272**.
- **The hidden-text utility `F-064` expected to need is not needed.** The greeting *is* the
  title - it only had to be routed through the component that already emits the heading.
- **Unchanged on purpose, and visible:** the greeting drops from 32px to 28px. The size was
  per-screen too, which is the thing being fixed.

### Tests

- **Added** a dashboard assertion that an `h1` exists, carries the greeting, and sits in a
  `header` that also holds the decorative bar. Red first, failing with `Unable to find an
  accessible element with the role "heading"` - which is exactly what `F-064` recorded.


### The tab strip starts in the same place on every screen

`F-065`. Comments' strip started at **y=117.80** and the catalogue's and Bug Reports' at
**y=220.59** - 102.79px apart for the same control. All three are now at **220.60**.

- **Changed** `ModerationPage` to render the stat cards **above** `Tabs`, matching the
  catalogue, which already rendered `CatalogStats` once above its strip.
- **Changed** the tab from uncontrolled to controlled. This is the part the estimate in the
  finding missed: the catalogue's cards are the same on every tab, while Comments has a
  **different** set per tab (`ContentStats` vs `ReportStats`). Hoisting them means the page
  must hold the open tab so the numbers follow it. **3 files, not the 1 estimated.**
- **Removed** `ContentStats` from `ContentTab` and `ReportStats` from `ReportsTab`, which is
  where they used to live.

### Tests

- **Added** two assertions, both red first: the cards precede the tab strip in document
  order, and the numbers **swap** when the tab changes. The second exists because hoisting
  the cards and then freezing them on the first tab's numbers would pass the first.
- Order is asserted rather than a coordinate, because jsdom has no layout; the browser
  measurement that this order produces the same y everywhere is in the audit.
- **Changed** one Playwright assertion in `e2e/moderating-a-comment.spec.ts`, and it is worth
  saying why rather than calling it a flake. `getByText('Skript ist veraltet - Stand 2019.')`
  matched **two** nodes - the table cell and the edit dialog's own textarea, which holds the
  same string. The locator was always ambiguous and passed only while the modal happened to
  finish animating out first; the extra re-render from hoisting the cards changed that timing.
  **The modal does close** - `ContentEditModal` calls `onClose()` after a successful save,
  which was checked before the test was touched. It now waits for the dialog to be hidden and
  then looks for the text inside the tabpanel, pinning two real behaviours instead of one
  ambiguous match.


### Dashboard: stop showing the same number three times

`F-066`, option 2. **Removed** `SystemPulse` (the two progress bars) and
`ModuleNavigation` ("Jump to"), and `ModuleCard` with it, which nothing else used.

- The bars were a **third** rendering of the active share and a **second** of the admin
  count. "Jump to" repeated three destinations the sidebar offers at all times.
- **Overflow at 1440 goes from 223px to 0**, and 1280 likewise. 1024 goes from 642 to 204,
  which is real content at that width rather than repetition. Standalone numbers on the
  screen drop from 8 to 6.
- **Checked before removing anything:** `Last updated` is in the hero, labelled `Updated`.
  It was the one value with no second home, so it was confirmed present rather than
  assumed. Nothing moved.
- **Still repeated, and accepted under option 2:** the hero's `Reports waiting 1` and the
  card's `Open reports 1`.

### `F-034` closes with it, and not by changing a token

The panel's one measurable colour-contrast failure was the **"Head straight to any section."**
subtitle at 3.56:1 - the description of the "Jump to" block. Removing the block removed the
failing node. Measured after: `a11y Dashboard: contrast passed=4 failed=0 undetermined=56`, so
`e2e/a11y.spec.ts`'s known-violation map is now **empty** and no route is exempt any more.

**What this does not fix:** `chrome.textDim` is still used 60 times across 37 files, 30 of them
at `size="xs"`, on backgrounds axe cannot resolve (`F-035`). The risk `F-034` described is
unchanged; the one node that proved it is gone. A token change is still the real fix.

### Tests

- **Changed** the `F-030` pin in `src/App.a11y.integration.test.tsx` from "both progress
  bars are named" to "there are no progress bars", inverted rather than deleted so it still
  fails if an unnamed bar comes back.
- **Emptied** the known-violation map in `e2e/a11y.spec.ts`. It went red first, which is how
  `F-034`'s closure was noticed at all rather than assumed.
- **Added** a dashboard assertion that no bar, no "Jump to" and no "How things are running"
  render, that `Updated` still does, and that every counter the removed blocks were derived
  from survives. Seen red first.


### Layout audit, sections 3 to 9: one fix, seven findings, six standards proposed

Measurement round. **One declaration changed**; everything else is measured, costed and
left for a decision. Numbers in [docs/coursework/layout-audit.md](docs/coursework/layout-audit.md).

#### `src/layouts/components/SidebarNavButton.tsx`

- **Fixed** `F-072`: the active navigation item was **71.2px** tall against **54.4px** for
  every other one, and pushed the three items below it down by **16.8px** whenever the
  catalogue was open. The cause was not padding - the active state is `fw={600}`, bold is
  wider, and the label needed 145px in a 142.8px box, so it wrapped. `white-space: nowrap`
  is one declaration, changes no type and no colour, and **clips nothing**: 148px of text
  in a 148px box. Chosen after measuring three candidates in the browser rather than
  guessing - matching the inactive weight also works but changes type, and `fw: 500` still
  wraps. After: every nav button is **54.4 at 1024, 1280 and 1440**, and the items below
  are back at their baseline coordinates.

#### Findings opened, none fixed

`F-066` the Dashboard renders four facts eight times and overflows by 223px at 1440;
`F-067` five screens have five filter layouts; `F-068` the Users card row ends early;
`F-069` five row heights across seven tables; `F-070` row actions stop at two right edges;
`F-071` the Dashboard heading has no accent bar. Each has **one** proposed standard with a
file count, an hour estimate and the tests it would break.

### Three reported problems that the measurements refute

Recorded because a refuted observation is a result, not a non-event.

- **"The catalogue's STATUS column is truncated to ACT..."** - **no cell is clipped at any
  width.** `scrollWidth > clientWidth` was checked on every header and first-row cell at
  1024, 1280 and 1440: zero clipped. The column is *beyond the right edge* because the
  table needs more width than it gets and its holder scrolls - **that is `F-036`**, already
  recorded, and this audit opens nothing new for it. Holder overflow: 282px at 1024, 26 at
  1280, 0 at 1440.
- **"The Ratings SCORES column always shows a dash"** - it does not. Measured content:
  `content 4 - clarity 5 - difficulty 3`. `scoreLine` returns the empty marker only for an
  empty map. One real cosmetic issue is visible in that string: the category names render
  lowercase, because the fixture keys are lowercase and `enumLabel` passes them through.
- **"Both dashboard progress bars are 100%"** - they read **75%** and **25%**. The weaker
  form of the point stands and is why `F-066` exists: neither bar shows a number the page
  does not already show elsewhere.

Two more corrections, inside `F-067` and `F-068`: **Audit Logs already wraps to two rows at
1440**, so it is not Activity Logs alone; and the **three Users cards are not wider** than
the four elsewhere - every card in the panel is 273.5px, the row just ends early.


### Layout audit, section 2: what moves when something is pressed

Measurement only. **No code changed**, and the report says why for each of the three fixes
the brief pre-authorised. Numbers are in
[docs/coursework/layout-audit.md](docs/coursework/layout-audit.md); the measuring spec is
deliberately not in this repository, because `playwright.config.ts` is shared with CI and
is not touched before delivery.

- **Added** `docs/coursework/layout-audit.md`. Tolerance 1px, everything from
  `getBoundingClientRect`, `scrollWidth`/`clientWidth` or `getComputedStyle`.
- **Measured clean:** six modals open and close with **0.00px** drift on every anchor;
  tab switching on two routes moves nothing above the strip; typing and applying a filter
  move nothing; expanding a comment's answers leaves the rows above it at **0**. A warning
  strip costs exactly **70.00px** and moves everything below it together.
- **Opened** `F-062` to `F-065`: `scrollbar-gutter` is `auto` while overflow differs per
  route; the loading state is a fixed 200px box where 900-1123px of content goes; the
  Dashboard has no `h1`; the tab strip starts 102.79px lower on two routes.

### Unchanged on purpose

- **All three pre-authorised fixes were declined on the measurements**, not skipped.
  There is **no fake vertical scrollbar** - seven of eight routes report exactly 0
  overflow at 1440x900 and the Dashboard's 223px is real content. The **scrollbar-induced
  shift could not be reproduced**, because this Chromium's scrollbar is an overlay and
  took 0px of width on every route, so applying `scrollbar-gutter: stable` would be a fix
  with no number behind it. And there is **no skeleton to resize**.
- **`F-036` was referenced, not re-derived.** Horizontal table overflow at 1024 is already
  measured and recorded; this audit opened no new finding for it.

### Two limits of the measurement, recorded rather than glossed

- The **two-strip case is unmeasured**: `?fault=system-status` produces no strip on
  `/users`, so asking for both faults still rendered one.
- The **loading transition was not observed**, only computed: MSW answers from a service
  worker, and Playwright's `page.route` does not sit in front of one, so a 600ms injected
  delay changed nothing and `sawSpinner` was false on all eight routes.


### The em dash is gone from interface text, and there is now a rule saying so

`F-061`. The instruction was to remove every long dash from user-visible text. Two earlier
rounds measured this and changed nothing, because there was no rule to enforce and
`emptyValue.ts` argued the other way. This round the decision was made, so the rule was
written first and the change follows it rather than the other way round.

#### `docs/DESIGN.md`

- **Added** an **Interface text** section: no em dash and no en dash in a label, button,
  empty state, error message, tooltip, table header, placeholder, or in fixture data that
  reaches the screen. A clause that wants one takes a full stop, colon, semicolon or
  brackets instead. Code comments are exempt, and the section says why: they are read in
  the editor, and this repository's comments carry the reasoning that makes it reviewable.

#### `src/utils/emptyValue.ts` and its twelve consumers

- **Changed** `EMPTY_VALUE` from `'—'` to `'-'`. The file's doc comment is rewritten to
  record the reversal rather than quietly contradict itself: one meaning and one glyph was
  always the argument, and that half still holds.
- **Changed** the two bare `—` literals in `ContentRow.tsx` and `UserTableRow.tsx` to use
  the constant. They were the same "no value" decision written out twice by hand, which is
  how they escaped the last change to it.
- **Changed** `catalog.unit.test.ts` to assert `EMPTY_VALUE` rather than the character.

#### Copy, across 27 files

- **Rewritten, not hyphenated.** `"All quiet — nothing waiting."` became
  `"All quiet. Nothing waiting."`; `"Severe — data loss"` became `"Severe: data loss"`;
  `"The lectures stay — only the assignment is dropped."` took a semicolon;
  `"and — for a non-admin, non-self account — status"` took brackets. A hyphen between
  clauses is the wrong mark and would have read worse than the dash it replaced.
- **Changed** the catalogue's record separator to `${code} - ${name}`, and the on-screen
  fixture strings that mirror it.

### Tests

- **No tests added.** Six assertions that quote rewritten copy were updated to match, and
  two of those needed a second pass: a blanket rewrite had turned them into `:` where the
  copy actually took a full stop, and the suite caught it.

### Proof

`0` em and `0` en dashes outside comments across `src/` and `e2e/`, down from **82 in 48
files**, measured with a scan that tracks comment regions character by character rather
than matching lines that begin like comments. The 622 remaining are all inside comments. A
cruder grep reports six survivors; all six are JSX and CSS comment continuation lines,
which is exactly the case the cruder grep cannot see.


### Hand F-052 to the backend, and record the em dash as an open decision

Three delivery-eve jobs, no behaviour change and no new tests.

#### `docs/backend-tasks.md`

- **Added** §J3, which asks the backend team to confirm HTTPS enforcement and HSTS on the
  host that serves `https://ratemyprofessor.dev/`. Four specific questions rather than a
  general worry, because a general worry gets acknowledged and a specific one gets
  answered: the exact `Strict-Transport-Security` value if one is sent, whether `http://`
  returns a `301`/`308`, **which `server` block both live in**, and whether that proxy
  already sets `nosniff`/`X-Frame-Options`/`Referrer-Policy` host-wide. Two `curl` lines
  answer three of the four. It asks for **no change** — if HSTS turns out to be missing,
  adding it is their call, since a long `max-age` is hard to walk back and binds every
  service on that hostname.
- **Moved** the transport question out of §J1, which now covers only the `assets/` header
  problem that is genuinely ours. A `Content-Security-Policy` is still deliberately not
  asked for: it needs a decision about what the panel may load.

#### `docs/testfindings.md`, `docs/TODO.md`

- **Changed** `F-052` from "reported only" to **handed over on 2026-09-10, and open until
  answered** — delegated, not out of scope. The distinction matters at hand-in: one says
  we looked and stopped, the other says who has it now.
- **Added** a deferred item for the em dash. The instruction was to remove every long dash
  from interface text; it was **not** carried out, on purpose. **There is no rule to
  enforce** — DESIGN.md and all seventeen ADRs are silent on dashes — so removing them
  would have meant inventing a rule and applying it in the same commit. Worse,
  `src/utils/emptyValue.ts:1-12` argues *for* the em dash in writing, and twelve call
  sites depend on it, so a ban **overturns a recorded decision** rather than tidying
  strings. The item is therefore "write the rule, then apply it", with the note that
  `emptyValue.ts`'s rationale has to be re-read and either rewritten or cited as the
  exception. The measurement — **41 em dashes over 40 lines in 27 files, zero en dashes**
  — stands as `A7` of the audit. ~30 min to write the rule, ~2 h to apply it.

### Unchanged on purpose

- **`.gitignore`.** The previous entry in this file said `test-results/` was not ignored
  and that `git add -A` could sweep in Playwright trace zips. **That was wrong.**
  `.gitignore:51-52` already carries `playwright-report/` and `test-results/`, and they
  work. The bad check was `git check-ignore test-results` without a trailing slash on a
  path that did not exist at the time — git cannot tell an absent path is a directory, so
  a directory-only rule appears not to match. Re-tested by creating both directories with
  files in them: `git status` and `git add -A` report nothing. No line was added, because
  the right line is already there.


### Release-readiness audit: measured everything, changed four things

A pass before the hand-in, run as **measure first, fix only what carries no visual risk**.
Eighteen findings recorded (`F-043`…`F-060`): **three fixed in the same round and fifteen
deferred**, each with an estimate in [TODO.md](docs/TODO.md). `F-031`, which predates this
pass, is closed as well — four fixes in all. What was in scope, and more usefully what was
ruled out and why, is [testplan.md §11](docs/testplan.md).

The panel is an internal tool behind a login wall, so the public-site checklist does not apply
to it: no privacy policy, terms, cookie banner, sitemap, social preview, analytics or marketing
copy. That is written down in the test plan rather than silently skipped, because "we did not
do it" and "it does not apply" are different answers and only one of them is defensible.

#### `index.html`, `public/robots.txt`, `public/favicon-32.png`

- **Added** `<meta name="description">` and `<meta name="robots" content="noindex,nofollow">`,
  and a `robots.txt` that disallows everything. An admin console on a public host had nothing
  discouraging a search index. `F-043`.
- **Added** `favicon-32.png`, the existing mark resized with ImageMagick — no new artwork. The
  favicon had been the 512x512, 139,062-byte Play Store launcher icon, which loads correctly
  and looks right and is 136 KB to fill a 16 px square.
- **Unchanged on purpose:** `<title>` and `lang="en"`. Both were already correct, which was
  measured rather than assumed — a Vite starter's leftover `Vite + React + TS` is the usual
  finding here and this was not one.
- **Not achieved, and recorded rather than glossed:** the small favicon **cost about 1.5 KB
  instead of saving 135 KB**, because `BrandMark` still imports the full-size PNG for the mark
  it draws at 34 px, and the browser used to serve both from that one file. Shrinking that
  asset is `F-054` and wants a look on a HiDPI display. Separately, under the `/admin/` base
  path `robots.txt` is served where no crawler reads it, leaving the meta tag as the half that
  works — `F-047`, and a job for the host proxy.

#### `src/features/users/components/WarnForm.tsx`

- **Fixed** the one unlabelled input in the panel: the warning message field had a placeholder
  and no accessible name, so a moderator's `Textarea` announced as a bare textbox. Its sibling
  `WarningEditor` already sets exactly this label, which is what makes it an omission rather
  than a decision. `F-044`.

#### `src/features/dashboard/components/RecentRegistrations.tsx`

- **Fixed** a control named by a glyph. "See everyone →" had no `aria-label`, so the arrow was
  part of the button's accessible name. The arrow stays on screen; it is now drawn and not
  announced. `F-045`. Worth noting how it survived: a search for emoji across all of `src/`
  returns **zero**, and this is the banned "glyph as an icon" pattern in a character that
  search does not match.

#### `src/features/auth/`

- **Fixed** `F-031`: the sign-in email field now reports `aria-invalid` and an
  `aria-describedby` that resolves to the refusal, so a screen-reader user who tabs back to
  the field hears why it was rejected instead of silence.
- **How, because the obvious route does not work.** Mantine's `Input` builds its own
  `aria-describedby` from the wrapper context and spreads it *after* the caller's props, so an
  `aria-describedby` handed to `TextInput` is silently overwritten with `undefined`. That was
  measured against the library, not guessed. The association therefore goes through the one
  slot Mantine will point at: `description` carries the sentence and is `clip`-hidden,
  `error` carries it so `aria-invalid` is reported, and `withErrorStyles={false}` plus a
  wrapper order without `'error'` stop Mantine drawing or colouring anything for it.
- **The cost, recorded.** The sentence is now in the DOM twice, so six existing queries that
  matched it unscoped had to be scoped to the alert — four in `App.integration.test.tsx`, one
  in `LoginPage.integration.test.tsx`, and one Playwright locator that strict mode rejected
  outright. Those queries now assert the message is *in the alert*, which is what they always
  meant. Doing this nine more times is the wrong answer; `F-049` says the right one is a real
  `validate` config per form.
- **One thing the approach nearly cost, caught by measuring instead of asserting.** Mantine
  reserves a 5px gap under an input whenever a description exists, so hiding the description
  was not enough — the submit button still moved down 5px the moment an address was refused.
  Measured in Chromium by comparing the input-to-button distance in both states (56px, then
  61px), then pinned to 0 in the same styles object. It is 56px in both states now, the border
  stays the theme's `rgb(33, 38, 45)` rather than red, and `data-error` is `null`. **"No visual
  change" is a claim that had to be measured, and the first version of this fix would have
  failed it.**
- **Unchanged on purpose:** the field is not given Mantine's `error` styling, which would turn
  it red. The message is already on screen and this round changed nothing visual.

### Unchanged on purpose

- **Source maps.** Already absent from production — `vite.config.ts` sets no `build` key, so
  Vite's `sourcemap: false` default applies, and a clean build emits no `.map`. Verified on the
  built output rather than read off the config, and left alone: there was nothing to fix.
- **Every A7 design violation.** Six categories, listed in `F-055`…`F-060`: two accent ramps
  outside the KIT palette reaching the screen, 27 colour literals outside the theme (one of
  them the exact yellow `palette.ts` says it rejected), five shadows on chrome that does not
  float while the modals the rule reserves them for have none, 19 off-scale radii, two font
  stacks that disagree about Inter, and a fifth font weight. Every one of them moves something
  on screen, which is the pass [DESIGN.md](docs/DESIGN.md) asks for and not a freeze.
- **The nginx headers.** `A6` of the audit was explicitly a read. The three headers that exist
  are not inherited into the `assets/` block, there is no CSP and no HSTS, and whether HTTPS is
  enforced **cannot be established from this repository** because TLS terminates on a proxy
  that is not in it. `F-052`, and it belongs in the deployment request rather than in a commit
  here.
- **The 404 screen.** Deferred, not excluded: `F-046` records that an unknown path lands on the
  dashboard silently. A new screen needs a design pass.

### Tests

- **Added** `e2e/document-head.spec.ts` — five tests over title, `lang`, description, the two
  indexing blocks, and a favicon byte budget. Three were red before the fix.
- **Added** `src/features/users/components/WarnForm.integration.test.tsx` — the field has a
  name *and* still has its placeholder, so removing either goes red. `WarnForm` is reached only
  through a modal, which is why no route scan could ever have caught `F-044`.
- **Added** `controls that name themselves in words` to `src/App.a11y.integration.test.tsx` —
  every route, every focusable control, failing on any accessible name containing an arrow or
  geometric-shape glyph. Red on the dashboard first.
- **Changed** the `F-031` assertion in the same file from `expect(tied).toBe(false)` to `true`,
  so it went red before the fix and green after, and **scoped six queries** across three files
  to the alert.
- **Verified by generation, not by hand:** the route/link cross-check in `A4` was produced by
  parsing `constants/routes.ts` and the `<Route>` elements and diffing them against every
  navigation target in `src/` — 9 declared, 9 mounted, 15 targets, no orphans in either
  direction, so there is no broken internal link.


### The Activity Log screen is back, and the two logs are one feature now

**[ADR 0002](docs/adr/0002-delete-the-activity-log-screen.md) is superseded by
[ADR 0016](docs/adr/0016-the-activity-log-screen-returns.md).** 0002 deleted the screen on
2026-09-09 on the grounds that nobody was reading it. That was wrong, and the person who can
settle it has said so. Nothing else changed: the backend never stopped serving `/activity-logs`
or `/activity-logs/meta`, with the same parameters, the same cursor contract and the same entry
shape.

0002 predicted the cost — *"restoring it means writing it again… the cost is a copy, not a
design"* — and this is about not paying it that way. `src/features/audit-logs/` is now
`src/features/logs/`, holding **both** screens over one reader, one filter bar, one table, one
row and one details modal. They read two halves of one backend table separated by `actor.type`;
two feature folders sharing 90% of their files would have been the liability 0002 named.

#### `src/api/logs`

- **Added** `LogReaderService<TEntry>` and `LogMetaService`, replacing their `AuditLog*`
  namesakes, parameterised by a `LogResource` — the path, and the key the list arrives under.
  That is the whole difference between the two endpoints, which is the reasoning `ContentService`
  already applies to `/comments` and `/answers`. Both halves are written down rather than one
  derived from the other: the path is kebab and the key is camel, and inventing a conversion
  would put a naming rule in the panel that the backend never promised.
- **Added** `ActivityLogsService` — two services, not three. There is no reverter and no room
  for one: these entries are creations, sign-ins and refusals, none of which the backend will
  undo. The absence is the difference between the two logs.
- **Split** `auditLogMapper.ts` into `logMapper.ts`. `toLogEntry` defaults `changes` and
  `metadata` — the `F-021` fix, which both logs need — and `toAuditLog` adds the three revert
  defaults on top. An activity entry is not mapped through the second, so revert fields the
  shared table might carry are dropped rather than modelled.
- **Renamed** `AuditLogPage.auditLogs` to `LogPage<TEntry>.entries`. The wire key belongs to
  `LogResource`; naming it in the domain type too would make a caller that pages both logs read
  two different fields for the same thing.

#### `src/domain/auditLog.ts`

- **Added** `ACTIVITY_ACTIONS` — the ten the backend documents: eight student actions and the
  two refusals — plus `ActivityAction`, `LogAction`, and `REFUSAL_ACTIONS` with its guard. A
  list rather than an `_REFUSED` suffix rule, because a rule would quietly claim every future
  action ending that way is a refusal the panel understands.
- **Added** three administrative actions the list never had: `BUG_REPORT_ISSUE_CREATED`,
  `LECTURE_CREATED`, `PROFESSOR_CREATED`. That is `C-10` in `docs/consumer-findings.md` — the
  compiled list was three values behind — and restoring one half of the vocabulary carefully
  while leaving the other stale would have been an odd place to stop.

#### `src/features/logs`

- **Added** `logScreen.ts`, holding what actually differs as one value: title, columns, the
  row's summary, the badge colour, whether the actor-type filter is offered, and the wording. A
  component that asked "which log am I?" would be the second copy in disguise, and there would
  be nowhere to look to find out what the two screens disagree about.
- **Undoing is deliberately not a field on that record.** A field would imply the activity
  screen could have one. `LogDetails` takes a slot and `AuditLogsPage` composes `ChangeList` and
  `RevertSection` into it; `ActivityLogsPage` is typed on `AuditEntry`, which carries no
  `revertible`, and imports neither the section nor the hook nor the confirmation. A test
  asserts the absence three ways.
- **Added** the actor-type filter, which closes `C-11`. `toLogQueryParams` has always built an
  `actorType` parameter and `AuditLogFilters` has always declared it; the control went with the
  activity screen in September. The audit screen deliberately does **not** offer it — every
  entry there is administrative, so it would narrow a list that is already narrowed, and adding
  a control to a shipped screen is a visual change this cycle does not make.
- `LogFilterInputs.tsx` is shared again. It lived in `src/components/` until it was moved *into*
  the audit feature because the activity screen — its second importer — had been deleted.

### `F-028` reduced from 14 cases to 12, and its account of two of them corrected

Sharing the row meant guarding it. The action now goes through `logEnumLabel` (label when it is
a non-empty string, the shared empty marker otherwise) and through `auditActionColor`, which
takes `unknown` — it was typed on the `AuditAction` union so a caller could not pass a typo, and
every caller turned out to be a log row handing over `entry.action` straight off the wire, where
that union is a claim about the backend rather than about the code.

**The finding's account was wrong and this corrects it.** It attributed the audit screen's two
cases to `auditActionColor` alone. Removing each guard on its own turns **both** cases red on its
own, so the action went through *two* unguarded mechanisms stacked, and the original triage could
not see the second because the first crashed first.

`enumLabel` itself is **not** touched: guarding it would close ten more cases across four
screens, and what an unknown enum should read as there is a wording decision this cycle does not
make.

### Every modal, form and keyboard path measured in a browser

The browser layer measured eight routes and nothing inside them — `docs/worklog.md` calls that
the previous round's largest stated gap. **10 specs / 68 tests → 13 specs / 172 tests.**

#### `e2e/measure.ts` — new

The measurements, written once, after being four inline `page.evaluate` bodies with four
different ideas of what a control's name is. The first read `aria-label` and nothing else, so
every `<label>`-associated input came back nameless and the first run reported a dozen unnamed
controls that are in fact labelled. A function cannot be passed into an `evaluate` body, so the
only way to have one definition is to have one call. It also measures links, `[role=button]`,
inputs and selects — not just `<button>`, which is why `F-037` names exactly one link.

`settled()` waits for a modal to finish animating. Without it axe read half-faded surfaces and
the same page answered `3 passed / 0 failed / 5 undetermined` on one run and `7 / 1 / 0` on the
next; the first set of pins written was wrong for that reason.

#### `e2e/surfaces.ts`, `e2e/surfaces.spec.ts`, `e2e/keyboard.spec.ts`, `e2e/faults.spec.ts` — new

Eleven modals and four forms, each measured at 800, 1024 and 1440 for overflow, target size,
contrast in three buckets, tab order, focus trap, Escape and focus return. Four flows driven with
**no `click()` in the file**. Every `?fault=` state measured rather than screenshotted.

The registry is hand-written — whether a control opens a dialog is only knowable by pressing it —
so two guards keep it honest: every entry must really open a dialog with the name it claims, and
every route must either appear in it or be named as having none, with a reason.

### Fixed

#### `src/theme/components.ts`

- **`Modal` sets `closeButtonProps`, `Select` and `MultiSelect` set `clearButtonProps`.**
  Mantine draws an unlabelled close button unless it is given a name, so a screen reader
  announced the first control of **all eleven dialogs** as "button". The jsdom accessibility
  layer scans each route as it first renders and never opens a modal, which is exactly why it
  passed all nine routes while this was true of every dialog. Set on the theme rather than on
  eleven elements, because it is one decision and the eleventh is the one that gets forgotten.
  No visual change: an accessible name is not painted.

#### `src/components/ConfirmModal.tsx`

- **Added** a `useEffect` that captures what had focus when the modal opens and restores it when
  it closes. Mantine restores focus itself, but only for a modal still mounted when it closes,
  and three of the four callers render this as `{confirming && <ConfirmModal … />}` — so Escape
  left a keyboard operator on `document.body`. `AdminLayout` already treats exactly this as a
  defect for its own notice; the panel had the opinion and had not applied it here.

### Tests

- **Layer 1** — three sweep rows, so `API_ENDPOINTS` goes **42 → 44** with no counter to edit;
  `API_CALLS` is 49. A new case serves each log under the other's noun and requires both to
  throw: a shared reader whose two halves could drift would read an empty page off a working
  backend.
- **Layer 3a** — nothing written. It reads `API_ENDPOINTS`, so 589 → 617 cases on their own.
- **Layer 3b** — a seventh screen with **an empty `crashesOn`**, which is the assertion: it is
  the screen most likely to be handed an action the panel has never heard of.
- **Layer 5** — a ninth route, clean.
- **Layer 4** — now measures at **800px** as well. It said "nothing below 1024", one width more
  cautious than its own finding requires.
- **MSW** — `handlers/auditLogs.ts` becomes `handlers/logs.ts`, generic over the resource the way
  `contentHandlers` already is over comments and answers. Revert is mounted on the audit path
  only, so a panel that tried to revert an activity entry fails the suite loudly.
- `src/App.integration.test.tsx` — the two assertions that pinned the screen as *gone* are
  **inverted rather than deleted**, so the record of what changed is in the test as well as in
  the ADR.

### Found and recorded, not fixed

- **`F-038`** — contrast fails inside six of the eleven dialogs. The half of `F-035` the gradient
  was hiding: a modal sits on a flat surface, so axe can decide it, and it fails.
- **`F-039`** — three controls per catalogue editor that nothing names. `NumberInputProps`
  exposes no naming prop for its steppers, which is why the other two were fixed and these were
  not.
- **`F-040`** — touch targets under 24x24 inside the two catalogue editors.
- **`F-041`** — **the demo backend served no lectures, professors or ratings at all**, so the
  catalogue's modals were unreachable by any test and every catalogue figure the browser layer
  had recorded was measured against an empty table. Seeded, and it immediately produced a
  `22x22` touch target that had been invisible.
- **`F-042`** — once the `Professors` field has been focused, **Escape never closes the lecture
  editor again**, and the second press drops focus on `document.body`.

### Unchanged on purpose

- **`enumLabel` is still unguarded**, and `F-028` is still open with 12 of its 14 cases.
- **The audit screen still offers no actor-type filter**, though the control now exists.
- **`F-012`, `F-019`, `F-022`, `F-026`, `F-027`, `F-029`, `F-031` … `F-037`** are all still on
  the deferred list. Everything fixed this cycle was one file and invisible; everything else
  either changes behaviour, changes the theme, or wants a visual pass.
- **At and below 768px is still recorded as *not measured*, not passed** — `F-019`.

### The deployed panel calls its own origin now, and can be logged into again

**`Was:`** `VITE_API_BASE_URL=https://8a1babdc-…ka.bw-cloud-instance.org` — an absolute URL, baked
into the bundle by `.gitlab-ci.yml`.
**`Now:`** empty. Every request goes out relative, to whatever origin served the page.
**You have nothing to change** unless you build the image by hand; see below.

The panel is served from `https://ratemyprofessor.dev/admin/`, so with an absolute base the
browser was making a **cross-origin** call to a second hostname. It preflighted, and the backend
answered `403` because `https://ratemyprofessor.dev` was not in its CORS allowlist. Nothing
downstream of that ran: `POST /auth/request-login` never reached a controller, so no login code
was ever sent and the panel could not be signed into at all.

#### `.gitlab-ci.yml`

- **Changed** `VITE_API_BASE_URL` to `""`.
- **Why empty and not `/api`, measured rather than reasoned.** The deployment host routes
  `/admin/` to this container and hands *everything else* to the backend **unchanged** — there is
  no location that strips a prefix. `GET https://ratemyprofessor.dev/api/health` answers
  `404 {"message":"Not found"}`, which is the backend's own body and not nginx's, so a `/api`
  prefix would arrive at the backend intact and `404` exactly the same way. `/api` works in
  development only because the dev server rewrites it.
- **Why not `/`.** `ApiRequestBuilder.url()` concatenates without normalising
  (`src/api/client/apiRequest.ts:70-72`), so `/` builds `//auth/request-login`, and a browser
  reads a leading `//` as a protocol-relative host.
- **The empty value was verified end to end, not assumed to propagate.** A build with the
  variable empty produces a bundle whose only difference from the deployed one is the URL being
  replaced by `''` — a one-token diff, nothing else moved. `--build-arg VITE_API_BASE_URL=`
  overriding the `ARG …=/api` default was confirmed under **Kaniko**, the tool CI actually uses,
  not just under a local Docker.

#### `Dockerfile`

- **Unchanged on purpose.** `ARG VITE_API_BASE_URL=/api` stays: it is the standalone-build
  default and matches `.env`, and CI overrides it explicitly. It was only going to change if the
  empty build-arg had failed to propagate, and it did not fail.

#### `vite.config.ts`, `.env`, `README.md`, `wiki.md`, `docs/deployment.md`, `docs/consumer-contract.md`

- **Corrected every statement that said production bakes an absolute URL.** They were true when
  written and are now false, which is the kind of drift that costs the next reader an afternoon.
- `TEST_API_BASE_URL` stays `/api`. The suite's request assertions name absolute paths and need
  *some* fixed base; the base only prefixes the path, so what the backend sees is the same suffix
  either way. `F-025` is why it is pinned here instead of inherited.

### Unchanged on purpose

- **The `/admin/**` backend routes stay unreachable in production.** This container answers
  everything under `/admin/`, including paths the backend also claims, so its API routes are
  shadowed. Nothing breaks — this panel calls the unprefixed legacy paths and always has — but
  the backend task asking us to move every call onto `https://<host>/admin` must **not** be
  carried out: it would aim every request at this container's own static server, and reads would
  come back as `index.html`.

### `F-030` fixed — the dashboard's progress bars have names now

**One line, and it is the only production change in this package.** `SystemPulse` draws a
`Progress` bar per metric with the visible label in a *sibling* `<Text>`, so a sighted operator
read "Active accounts 62%" while a screen reader read an unnamed progressbar twice — axe's
`aria-progressbar-name`, at `serious`, on both nodes.

#### `src/features/dashboard/components/SystemPulse.tsx`

- **Added** `aria-label={metric.label}`. No visual change: an accessible name is not painted.
- **Where the label lands was measured, not assumed.** The violation is on the element carrying
  `role="progressbar"`, which is `Progress.Section` and not the component's root, so passing
  `aria-label` to `<Progress>` only works if Mantine forwards it down. It does — checked by
  reading the rendered attribute back, rather than by reasoning about the component.

#### `src/App.a11y.integration.test.tsx`

- **Removed** the dashboard's pinned violation, so the route scan now expects a clean result.
- **Added** a test asserting the two accessible names directly. The scan alone was not enough:
  it would go equally green if the bars stopped rendering at all, and a rule that passes because
  its subject vanished is the failure this whole package was written against.
- Both turn red when the attribute is removed, which is how the fix was verified.

### Unchanged on purpose

- **Everything else on the deferred list stays there** — `F-012`, `F-019`, `F-020`, `F-022`,
  `F-026` … `F-029`, `F-031` … `F-037`, `ErrorAlert`'s two theme divergences and the swallowed
  `415` on sign-out. `F-030` was taken on its own because it is one line in one file with no
  visual effect; every other item either changes behaviour, changes the theme, or wants a visual
  pass, and none of those is a last-day change.


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

**No production code changed by the layers themselves.** Twelve findings were opened and every
one was left alone at the time — including `F-030`, a single `aria-label` on one line with no
visual effect. It was fixed afterwards, on its own and in its own entry above; every other
finding is still on the deferred list.

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

**43 files / 348 tests → 47 files / 1138 tests and 3 skipped.** Playwright **4 specs / 11 tests →
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

- **Twelve findings opened, none fixed by the layers.** `F-026` … `F-037`. Eleven are in
  [docs/TODO.md](docs/TODO.md) under *Known, measured, deliberately deferred* with what it is, how
  it was measured, why it was not fixed, and what fixing it costs. The twelfth, `F-030`, was fixed
  afterwards in a change of its own.
- **`F-030` was the exception, and it was taken separately.** One line, one file, no visual
  effect. It is the entry at the top of this release rather than part of the layer work, so the
  claim that the layers changed no production code stays exactly true.
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


### Added — elevated permissions for `unzhz@student.kit.edu`

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
