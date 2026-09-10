# Layout audit

Measured, not looked at. Every number here comes from `getBoundingClientRect`,
`scrollWidth`/`clientWidth` or `getComputedStyle` in Chromium against the MSW mock
backend. **Tolerance is 1px; anything above that is a finding.**

The measuring spec is deliberately **not** in this repository. It lives in the session
scratchpad with its own Playwright config, because the tracked `playwright.config.ts` is
shared with CI and is not touched before delivery. To watch a run:

```bash
HEADED=1 SLOWMO=250 npx playwright test --config=<scratchpad>/layout/playwright.config.ts
```

| Run | Viewport | Note |
| --- | --- | --- |
| 1 | 1280x720 | `devices['Desktop Chrome']` overrode the requested viewport; caught and corrected |
| 2 | 1440x900 | viewport pinned after the device spread |

Both are recorded because they disagree in a way that matters: how much a route overflows
vertically depends on the viewport, and that is the whole of section 2.7.

---

## 2. Shift after an interaction

The question: when something is pressed, does anything behind it move?

### 2.1 Modal open and close — no drift

Six modals, opened and closed with Escape, measuring `pageTitle`, `pageDescription`,
`sidebarFirstItem`, `sidebarLastItem`, `main`, `firstRow` and `tabList` before, during and
after.

| Modal | Route | Dialog width | Open drift | Close drift | Gutter before/during |
| --- | --- | --- | --- | --- | --- |
| user profile | Users | 620 | none | none | 0 / 0 |
| content editor | Comments | 620 | none | none | 0 / 0 |
| delete-content confirmation | Comments | 380 | none | none | 0 / 0 |
| lecture editor | Lectures & Professors | 620 | none | none | 0 / 0 |
| bug report | Bug Reports | 620 | none | none | 0 / 0 |
| audit detail | Audit Logs | 620 | none | none | 0 / 0 |

**Every anchor held to 0.00px on every modal, on open and on close.** Not one value
exceeded the 1px tolerance, so there is nothing to list.

Measured in passing, and it answers one of section 4's questions early: **there are two
distinct dialog widths, 620 and 380**, the narrow one being the confirmation. The brief
asks for a report if there are more than three. There are two.

The scrollbar question asked in the brief was measured separately and is answered in 2.6:
`document.documentElement.clientWidth` did not change when a dialog opened
(`gutterBefore = gutterDuring = 0` on all six), so no horizontal shift occurred.

### 2.2 Tab switching — strips hold

| Route | Tabs | Anchors that moved above the strip |
| --- | --- | --- |
| Lectures & Professors | Lectures, Professors, Ratings | none |
| Comments | All comments (3), Reports (2) | none |

`tabList`, `pageTitle` and the sidebar held at 0.00px through every switch. The only
deltas were **inside** the panel and are the point of switching: on the catalogue the first
row narrowed by 26.00px (Professors) and by 26.00px / 15.29px (Ratings) because those are
different tables; on Comments the content block shrank by 37.50px and the first row grew
28.80px taller. **Nothing above the tab strip moved.**

### 2.3 Filtering and typing — no drift

Users, `Search` filled then `Apply filters`:

| Step | Drift | Rows after |
| --- | --- | --- |
| typing one character | none | - |
| applying the filter | none | 4 |

### 2.4 Row expansion — rows above hold

Comments, expanding the answers under the first row:

- `rowsAboveDeltaY = [0]` - the row above the expanded one did not move.
- The only change was the content block growing **94.39px** taller, which is the answers
  appearing.

### 2.5 Warning strips — measured, and one case could not be produced

Measured on `/users` at 1440x900 against the existing `?fault=` registry.

| Case | Strips rendered | Movement |
| --- | --- | --- |
| no strip (baseline) | 0 | `h1` at y=32.00 |
| `?fault=session-check` | 1 | `h1`, first panel, table and first row **all +70.00px down**; `h1` at y=102.00 |
| `?fault=system-status` | **0** | none |
| `?fault=session-check,system-status` | **1** | +70.00px, identical to the single case |

**A strip costs exactly 70.00px, and everything below it moves together** - no element
moved relative to another, which is what "the layout is intact" means here.

**The two-strip case is unmeasured.** `system-status` produces no strip on `/users`
because it degrades a dashboard read, so asking for both faults still rendered one. This
is a gap in the measurement, not a finding about the panel, and it is listed as such.

### 2.6 Scrollbar gutter — cannot be reproduced in this browser

| Measurement | Value, all 8 routes |
| --- | --- |
| `window.innerWidth - documentElement.clientWidth` | **0** |
| `getComputedStyle(documentElement).scrollbarGutter` | `auto` |
| `body` / `main` overflow style | `visible` |

The scrollbar in this Chromium is an **overlay** and takes no layout width, so a scrollbar
appearing or disappearing cannot shift anything here, and no shift was observed. See
`F-062` for what this does **not** rule out.

### 2.7 Loading to loaded — not observable, so stated as arithmetic

**The spinner could not be caught.** The mock backend answers from a service worker, and
Playwright's `page.route` does not sit in front of a service worker, so a 600ms delay
injected at the network layer changed nothing: `sawSpinner: false` on all eight routes.

What can still be stated with numbers, marked clearly as **source-derived rather than
browser-measured**: `PageLoader` is `<Center h={200}>` - a fixed 200px box - and the
loaded document heights measured at 1440x900 are:

| Route | Loaded `scrollHeight` | Change from a 200px loader |
| --- | --- | --- |
| Dashboard | 1123 | +923 |
| Users | 900 | +700 |
| Comments | 900 | +700 |
| Lectures & Professors | 900 | +700 |
| Bug Reports | 900 | +700 |
| Audit Logs | 900 | +700 |
| Activity Logs | 900 | +700 |
| Help | 900 | +700 |

See `F-063`. Note the panel has **no skeleton**: the brief's "does the skeleton match the
content height" question has no subject, and that absence is the finding.

**Corrected 2026-09-10.** The paragraph above measures the **in-page data loader** and then
says "every screen short-circuits to it", which is not what `PageLoader` is. Grep finds **ten**
render sites: seven in-page loaders, one auth check (`ProtectedRoute.tsx:13`), and **two
`Suspense` fallbacks**. `AdminLayout` is itself `lazy` (`App.tsx:13`) and it is what renders the
`AppShell`, so `App.tsx:41`'s fallback replaces **the whole shell** - a 200px spinner on an empty
page, no sidebar, no navbar, no gutters. That is the cold-load state, and there is a screenshot
of it, so "the spinner could not be caught" is withdrawn as well. `AdminRoutes.tsx:27`'s fallback
is inside `AppShell.Main` and keeps the sidebar, which is a different state again.

And the reason the first attempt saw nothing is larger than the service-worker gap it names: the
two `Suspense` states wait on **Vite chunk fetches**, not on API calls, so no delay injected at
the network layer could ever have produced them. Two of the four waits were outside the
measurement by construction.

### 2.8 Position across routes

At 1280x720, every signed-in route:

| Anchor | Value | Consistent? |
| --- | --- | --- |
| `h1` x | 288.00 | yes, on the 7 routes that have one |
| `h1` y | 32.00 | yes, on the same 7 |
| sidebar first item | x=12.00 y=87.00 w=215.00 h=54.39 | yes, all 8 |
| `main` | x=0.00 w=1280.00 | yes, all 8 |

Two deviations, both above tolerance:

- **The Dashboard has no `h1` at all** (`F-064`).
- **The tab strip sits at two different heights**: Comments y=117.80, Lectures &
  Professors y=220.59, Bug Reports y=220.59 - a **102.79px** difference (`F-065`).

---

## Findings opened by section 2

| ID | What | Fixed? |
| --- | --- | --- |
| `F-062` | `scrollbar-gutter` is `auto`, and vertical overflow differs per route | no - see below |
| `F-063` | The loading state is a fixed 200px box where 900-1123px of content will go | no |
| `F-064` | The Dashboard renders no `h1` | no |
| `F-065` | The tab strip sits 102.79px lower on two routes than on Comments | no |

**Nothing in section 2 was fixed, and that is a measurement result rather than a
reluctance.** The three changes the brief pre-authorised were a fake scrollbar, a
scrollbar-induced shift, and a skeleton height mismatch:

- **No fake vertical scrollbar exists.** Seven of eight routes report `scrollHeight -
  clientHeight = 0` exactly at 1440x900; the Dashboard's 223px is real content. There is
  nothing to remove.
- **No scrollbar-induced shift could be reproduced** (2.6), so applying
  `scrollbar-gutter: stable` would be fixing something with no number behind it.
- **There is no skeleton**, so there is no height to match. Making `PageLoader` match
  would mean a different height per route, which is not one CSS value.

## Referenced, not re-opened

Horizontal table overflow at 1024 is **`F-036`**, already measured and recorded. Every
table needs roughly 1300px; at 1024 all four overflow inside a holder that scrolls. This
audit did not re-derive it and opens no new finding for it. Below 1024 the panel is
unmeasurable for the reason `F-019` records.

---

# Sections 3 to 8: symmetry, repetition and the sidebar

Measured at 1024, 1280 and 1440 unless a row says otherwise. Tolerance 1px.

## 3. The Dashboard repeats itself

### 3.1 Section heights

| Section | 1024 | 1280 | 1440 |
| --- | --- | --- | --- |
| Title `Welcome back, ...` | 35.2 | 35.2 | 35.2 |
| Description | 20.3 | 20.3 | 20.3 |
| **Hero, "Today at a glance"** | **350.2** | **242.8** | **242.8** |
| **Stat card row** | **247.2** | **115.6** | **115.6** |
| **"How things are running"** | **295.5** | **295.5** | **295.5** |
| **"Jump to"** | **401.3** | **221.2** | **221.2** |
| document `scrollHeight` | 1542 | 1123 | 1123 |
| **overflow past the viewport** | **642** | **223** | **223** |

### 3.2 Which numbers appear more than once

Every standalone number rendered on the Dashboard at 1440, with the block it sits in:

| Value | y | Where |
| --- | --- | --- |
| 75% | 302 | Hero, "Active accounts" |
| 1 | 302 | Hero, "Reports waiting" |
| 4 | 440 | Card, "Total users" |
| 3 | 440 | Card, "Active accounts" |
| 1 | 440 | Card, "Admin accounts" |
| 1 | 440 | Card, "Open reports" |
| 75% | 620 | Bar, "Active accounts" |
| 25% | 660 | Bar, "Admin share of accounts" |

**Your three observations, checked one at a time:**

1. **"The hero's three numbers repeat in the cards below" - confirmed.** `Reports waiting 1`
   (hero) and `Open reports 1` (card) are the **same number with two names**. `Active
   accounts` appears as **75%** in the hero and as **3** in a card: one datum, two forms.
2. **"Both bars are 100% and carry no information" - refuted on the numbers.** They read
   **75%** and **25%**, not 100%. But the weaker claim holds: `Active accounts 75%` is a
   **third** rendering of the same datum, and `Admin share 25%` is a second rendering of
   the card's `Admin accounts 1`. Neither bar introduces a number the page does not
   already show.
3. **"Jump to duplicates the sidebar" - confirmed.** Its three cards go to Users, Bug
   Reports and Comments; all three are in the sidebar, which is on screen at the time.

**Net: 4 distinct facts are rendered 8 times.**

### 3.3 Options, not applied

| | Removes | Saves at 1440 | Information lost | Files | Tests |
| --- | --- | --- | --- | --- | --- |
| **1. Least** | `SystemPulse` (the two bars) | ~0 - it shares a grid row with Recent Registrations, which sets the row height | **none** - 75% and 25% are both derivable from the cards, which stay | 2 | `App.a11y` pins both bar labels (`F-030`); `DashboardPage` tests | 
| **2. Middle** | `SystemPulse` **and** `ModuleNavigation` ("Jump to") | **221.2 + 28 margin = 249.2**, which clears the 223px overflow at 1440 | **none** - every destination stays in the sidebar | 3-4 | as above, plus the dashboard navigation test | 
| **3. Most** | Both of the above **and** the hero collapses to one line of context | **~490**, and 1024 drops from 642 to ~150 | the "last updated" timestamp, unless it moves to the header | 5-6 | above plus `DashboardHero` and degraded-payload cases |

**Where the removed information still lives**, which is the question that decides whether
an option is allowed at all:

- `Active accounts 75%` -> the card `Active accounts 3` and `Total users 4`.
- `Admin share 25%` -> the card `Admin accounts 1`.
- `Reports waiting 1` -> the card `Open reports 1`.
- "Jump to" destinations -> the sidebar, always visible.
- **`Last updated`** appears **only** in the hero. Option 3 must move it, not drop it.

Estimates: option 1 ~30 min, option 2 ~1 h, option 3 ~3 h plus a design pass.

## 4. A. The filter bar - five pages, five layouts

At 1440. Search box x, and where Apply/Clear sit:

| Route | Own form? | Controls | Rows | Search x / w | Apply x | Clear x | Bar h | Gap to table |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Users | yes | 6 | 1 | 293 / 352.5 | 1143.5 | 1294.6 | 94.8 | **87.1** |
| Catalog | **no** | 1 | - | **1067** / 320 | none | none | - | - |
| Comments | **no** | 2 | 1 | 293 / **922** | none | none | 66 | - |
| Audit Logs | yes | 8 | **2** | 293 / 305.3 | 1143.5 | 1294.6 | 167.6 | **62.8** |
| Activity Logs | yes | 9 | **2** | 293 / 295.3 | 1143.5 | 1294.6 | 167.6 | **62.8** |

**Two corrections to the brief.** Audit Logs does **not** fit on one line: at 1440 it is
already two rows, the same as Activity Logs. And the Catalog search is **not** in the table
header - it is in the table's panel, right-aligned at **x=1067**, which is why it reads as
part of the header.

**One more, found while measuring:** Audit Logs' end-date input is **838.5px** wide on the
second row, where the identical control on Activity Logs is **413.2px**. Same control,
same job, twice the width, because it is the only field on that row and it stretches.

Good news: **Apply and Clear are already at x=1143.5 and x=1294.6 on all three pages that
have them.** They never move horizontally; they move *vertically* when the bar wraps.

**Proposed standard (one, not a menu):** one `FilterBar` shell used by all five screens:
a panel of its own, search always first at x=293 with a fixed width, then filter controls
in a wrapping group, and **Apply + Clear pinned to the bar's own last line** so they are
never pushed by control count. The Catalog search moves into that bar. Gap to the table
fixed at one value.
**Cost:** ~6 files, ~4 h. Breaks `e2e/surfaces.spec.ts` (the two filter-bar form tests),
the Catalog search tests, and the log filter tests. `F-067`.

## 5. B. Stat cards

Card geometry is **identical everywhere it appears**: w=273.5, h=74.8, padding 16px 20px,
gap 14, icon 18x18, value 22px, label 12px.

| Route | Cards | Row filled? |
| --- | --- | --- |
| Users | **3** | no - one empty 273.5px slot at x=1134.5 |
| Catalog | 4 | yes |
| Comments | 4 | yes |
| Audit Logs | **0** | - |
| Activity Logs | **0** | - |

**Correction:** Users' three cards are **not** wider. They are 273.5 like every other card;
the row simply ends early. `F-068`.

**Proposed standard:** the card row is a fixed four-column grid on every screen that has
one. Users gains a fourth card (`Blocked`, which the backend already counts). Audit and
Activity keep **zero** - they are event streams with nothing to count, and that is a
deliberate difference rather than an omission.
**Cost:** ~2 files, ~1 h. Breaks the Users stat tests.

## 6. C. Tab strip position - the mechanism behind `F-065`

| Route | Cards y | Tab strip y |
| --- | --- | --- |
| Comments | 173.8 | **117.8** (above the cards) |
| Catalog | 117.8 | **220.6** (below the cards) |
| Bug Reports | 117.8 | **220.6** (below the cards) |

The 102.79px in `F-065` is **the card row plus its margin**: Comments puts tabs first,
the other two put cards first. Already recorded; not re-opened.

**Proposed standard:** cards first, tabs second, on every screen - so the strip is at
**y=220.6** everywhere and the tab switch never moves the numbers above it. Comments is the
one screen that changes.
**Cost:** 1 file, ~30 min. Breaks the Comments tab tests.

## 7. D. Tables

| Table | Row height | Actions right edge | Numeric alignment |
| --- | --- | --- | --- |
| Users | **51.8** | - | left |
| Comments | **94.4** | 1361.6 | left |
| Catalog / Lectures | **66.1** | **1387** | left |
| Catalog / Professors | **69.6** | **1387** | left |
| Catalog / Ratings | **54.3** | 1356.1 | left |
| Audit Logs | 66.1 | - | left |
| Activity Logs | 66.1 | - | left |

- **Five distinct row heights across seven tables** (51.8, 54.3, 66.1, 69.6, 94.4).
- **Row actions end at two different right edges**: 1361.6 on Comments, 1387 on the
  catalogue - **25.4px** apart. Order (edit then delete) and size (22x22) are consistent.
- **Numeric columns are left-aligned in every table**, consistently.
- **Empty cells** all go through `EMPTY_VALUE`, which is now a single hyphen everywhere
  (`F-061`). The only blank cells are action columns, which have no value by design.

**Two claims in the brief, refuted by measurement:**

- **"STATUS is cut off to ACT..."** - no cell is clipped at **any** width. Checked
  `scrollWidth > clientWidth` on every `th` and first-row `td` at 1024, 1280 and 1440:
  **zero clipped cells**. What is happening is `F-036`: the catalogue table needs more
  width than it gets and its holder scrolls, so the column is *beyond the right edge*, not
  truncated. Holder overflow measured **282px at 1024**, 26 at 1280, 0 at 1440. Referenced,
  not re-opened.
- **"Ratings SCORES always shows a dash"** - it does not. Measured content:
  `content 4 - clarity 5 - difficulty 3`. `scoreLine` returns `EMPTY_VALUE` only for an
  empty map, and the demo data has scores. One real cosmetic issue is visible in that
  string: the category names render lowercase (`content`, not `Content`), because the
  fixture keys are lowercase and `enumLabel` passes them through.

**Proposed standard:** one row height token for all tables, one right gutter for action
columns, numbers stay left-aligned. `F-069`, `F-070`.
**Cost:** ~7 files, ~2 h. Breaks layout assertions in `e2e/layout.spec.ts`.

## 8. E. Page header

| Route | h1 | Accent bar |
| --- | --- | --- |
| 7 routes | x=288, y=32, 28px | 4x26 at x=272 |
| **Dashboard** | **none** | **none** |

The Dashboard is the only screen with neither. The missing `h1` is `F-064`; the missing
accent bar is new and is `F-071`.

**Proposed standard:** every route uses `PageHeader`, including the Dashboard, so the bar
and the `h1` are structural rather than per-screen. The greeting becomes the header's
title.
**Cost:** 2 files, ~45 min. Fixes `F-064` at the same time. Breaks the dashboard header test.

## 9. F. Sidebar - fixed

The one change permitted this round, and it was a single declaration.

| | Before | After |
| --- | --- | --- |
| Active `Lectures & Professors` height | **71.2** | **54.4** |
| Every other nav button | 54.4 | 54.4 |
| Distinct heights at 1024 / 1280 / 1440 | `[54.4, 71.2]` | **`[54.4]`** |
| `Users` y when the catalogue is open | 216.6 | **199.8** |
| `Comments` y | 273 | **256.2** |
| `Bug Reports` y | 329.4 | **312.6** |

**Cause, measured rather than guessed:** the active state is `fw={600}` and the inactive
`fw={400}`. Bold is wider - the label needed **145px** in a **142.8px** box and wrapped to
a second line, adding **16.8px** to that one button and pushing the three items below it
down by the same amount every time the catalogue was open. The oversight group lower down
never moved, because it is a separate nav block.

**Why `white-space: nowrap` and not something else.** Three candidates were measured in
the browser before touching the file:

| Candidate | Active height | Clipped? |
| --- | --- | --- |
| `white-space: nowrap` | **54.4** | no - 148px of text in a 148px box |
| `font-weight: 400` (match inactive) | 54.4 | no, but it changes type |
| `font-weight: 500` | 71.2 | still wraps |

`nowrap` is one declaration, changes no type and no colour, and clips nothing today. **The
trade it makes:** a longer label added later would overflow rather than wrap. That is
recorded in a comment at the change.

---

# Applied changes, before and after

## Step 1 - Dashboard, option 2 (`F-066`)

Removed: the two progress bars (`SystemPulse`) and the "Jump to" block
(`ModuleNavigation`, and `ModuleCard` with it, which nothing else used).

| Measurement | Before | After |
| --- | --- | --- |
| document `scrollHeight` at 1440 | 1123 | **900** |
| **overflow at 1440** | **223** | **0** |
| overflow at 1280 | 223 | **0** |
| overflow at 1024 | 642 | **204** |
| standalone numbers rendered | 8 | **6** |

**Verified before removing anything:** `Last updated` is in the hero, labelled `Updated`,
with seconds. It was the one value that existed nowhere else, so it had to be confirmed
present rather than assumed - it is, and nothing moved.

**What is still repeated, and is accepted under option 2:** the hero's `Reports waiting 1`
and the card's `Open reports 1` are still the same number under two names. Option 2 only
removed the bars and the navigation block; the hero stays.

1024 still overflows by 204px. That is real content at that width, not repetition.

## Step 2 - cards first, tabs second (`F-065`)

| Route | Tab strip y, before | after |
| --- | --- | --- |
| Comments | **117.80** | **220.60** |
| Lectures & Professors | 220.59 | **220.60** |
| Bug Reports | 220.59 | **220.60** |

The 102.79px gap is closed; all three strips now start in the same place.

**The estimate in the finding was wrong, and the reason is worth keeping.** It said "1 file,
~30 min". The catalogue renders `CatalogStats` **once, above** `Tabs`, so its cards are
tab-independent. Comments rendered a **different** card set inside each panel
(`ContentStats` for the comments tab, `ReportStats` for the reports tab). Hoisting them
above the strip therefore means the tab can no longer be uncontrolled: the page has to hold
the open tab so the numbers can follow it. **3 files**, not 1.

## Step 3 - the Dashboard uses `PageHeader` (`F-064`, `F-071`)

| Route | `h1` before | `h1` after | accent bar after |
| --- | --- | --- | --- |
| Dashboard | **none** | **288, 32, 28px** | **4x26 @ 272** |
| The other seven | 288, 32, 28px | unchanged | unchanged |

All eight routes now agree to 0.00px on both. The greeting becomes the header's title, so
the shape is structural rather than drawn per screen.

**One visible consequence:** the greeting was 32px and `PageHeader` sets 28px. That is the
change, not a side effect - the size was per-screen too.

## Step 4 - the card row (`F-068`), no code change

| Width | Card widths | x positions | Screens |
| --- | --- | --- | --- |
| 1440 | **273.5**, all | 272 / 559.5 / 847 / 1134.5 | Users (3), Catalog (4), Comments (4) |
| 1024 | **353**, all | 272 / 639 | same |

`statGridCols` is already `{base: 1, sm: 2, lg: 4}`. The row **is** a fixed four-column
grid, and the cards are equal-width and aligned on every screen at both widths - so the
standard asked for was already in place. What `F-068` recorded was the **count**, and an
empty slot on Users is now an accepted outcome rather than a defect.

Surfaced by the re-measurement and also not a defect: at 1024 Comments' cards start at
**y=138.8** against **117.8** elsewhere, because its longer page description wraps to a
second line at that width. Content, not layout.

## Step 5 - one row-height token (`F-069`)

Vertical cell padding, before: **13px** Users, **14px** catalogue and both logs, **16px**
moderation content and reports. After: **14px** everywhere, via `tableCellPadding`.

| Table | Row height before | after |
| --- | --- | --- |
| Users | 51.8 | **53.8** |
| Catalog / Ratings | 54.3 | 54.3 |
| Catalog / Lectures | 66.1 | 66.1 |
| Audit Logs | 66.1 | 66.1 |
| Activity Logs | 66.1 | 66.1 |
| Catalog / Professors | 69.6 | 69.6 |
| Comments | 94.4 | **90.4** |

14px was chosen because it is what the majority already used, so the fewest rows move.

**The remaining spread is content and stays.** A Comments row draws a two-line excerpt and
an author chip; Professors lists every lecture. Equalising those means truncating content,
not aligning a layout - so the token decides the padding, not the height.

## Step 6 - one filter bar shell (`F-067`)

Measured at 1440x900 against the mock backend, after the change.

### Where the search sits

| Route | x before | x after | width before | width after |
| --- | --- | --- | --- | --- |
| Users | 293 | 293 | 352.5 | 360 |
| Comments | 293 | 293 | **922** | **360** |
| Lectures & Professors | **1067** | **293** | 320 | 360 |
| Audit Logs | 293 | 293 | 305.3 | 319 |
| Activity Logs | 293 | 293 | 295.3 | 309 |

**Every search now starts at x=293.** The catalogue's moved 774px left, out of the table
panel's header and into a bar of its own. Comments' shrank from 922 to 360, because `flex: 1`
with no upper bound had let it eat every pixel its one neighbour did not want.

The three widths that are not 360 are the two log screens, where the search shares its row
with three or four selects and the bound is never reached. That is the basis doing its job
rather than a fourth width.

### Where Apply and Clear sit

| | before | after |
| --- | --- | --- |
| Apply x | 1143.5 | **1147** |
| Clear x | 1294.6 | **1295** |
| On a row of their own? | **no** - last two flex children of the control group | **yes** |
| Users: control row y / button row y | one row, buttons on it | 262 / **310** |
| Audit Logs: last control row y / button row y | buttons on the wrapped second row | 232 / **280** |
| Activity Logs | as above | 232 / **280** |

They were already at the same x on all three screens; what moved them was **vertical**, and a
row of their own is what makes control count unable to reach them.

### The date fields, which is where the worst number was

| Field | before | after |
| --- | --- | --- |
| Audit Logs `To` | **838.5** | **170** |
| Activity Logs `From` | 413.2 | **170** |
| Activity Logs `To` | 413.2 | **170** |
| Audit Logs `From` | - | 159 |

The 838.5 was never a width somebody chose: `flex: '1 1 150px'` with no `maxWidth` meant the
field absorbed whatever slack its wrapped row had, and Audit wrapped it **alone** where
Activity wrapped **two** of them. A bound is what makes the same control the same size. The
one field still off the bound is Audit's `From`, at 159, because it sits on the crowded first
row and never grows to its 170 cap - an 11px spread where there was a 425px one.

### What did not close, with the number that says why

**Both log screens still take two control rows at 1440**, and the brief asked for Audit Logs
to fit on one. Measured rather than asserted: the panel's content box is **1094px**, and
Chromium's `input[type=date]` has an automatic minimum size of about **170px**, not the 130px
basis - so the six Audit controls need 260 + 160 + 160 + 160 + 170 + 170 = 1080 plus five 12px
gaps, which is **1140**. It does not fit, and the shortfall is 46px.

Audit alone could be made to fit by cutting the search basis to 240 and the selects to 150:
240 + 150 + 150 + 150 + 170 + 170 + 60 = **1090**, four pixels inside the box. That was
measured and **rejected** for two reasons. Four pixels of slack is not a layout, it is a
coincidence waiting for a longer label. And Activity Logs has a seventh control, so the same
widths give 1252 and it wraps anyway - which would put the two log screens back on different
layouts, which is the whole of what `F-067` is about.

So the wrap is now **the same wrap on both**: row one is the search and the selects, row two
is the dates, row three is Apply and Clear. Recorded rather than fixed.
