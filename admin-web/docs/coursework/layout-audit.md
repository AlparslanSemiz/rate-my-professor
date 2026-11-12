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

# Section 10: the screenshot round (2026-09-10)

Eleven observations taken from screenshots, measured at 1440x900 against the mock backend.
**Nothing here was fixed.** Three of the eleven did not survive measurement and are recorded
as refutations, which is worth as much as the eight that did.

## 10.1 The STATUS badge is clipped, and the earlier measurement looked at the wrong box

Section 7 says "no cell is clipped at **any** width - zero clipped cells", from
`scrollWidth > clientWidth` on every `th` and first-row `td`. That is still true and it is not
the question. **The badge clips itself.** Mantine's `Badge` root carries `overflow: hidden` and
its label carries `white-space: nowrap; text-overflow: ellipsis`, so when the badge runs out of
room the text disappears *inside* the badge and the cell never overflows. Measuring the cell
could not have found it.

Measured per badge: the label's `scrollWidth` against its `clientWidth`.

| Table | Badge | label needs | label gets | short by | column w | badge root |
| --- | --- | --- | --- | --- | --- | --- |
| Catalog / Lectures | `INACTIVE` | 49 | **34** | **15** | 92 | 50 |
| Catalog / Lectures | `ACTIVE` | 36 | **34** | **2** | 92 | 50 |
| Catalog / Professors | `INACTIVE` | 49 | **43** | **6** | 101 | 52 |
| Catalog / Professors | `ACTIVE` | 36 | 36 | - | 101 | 52 |
| Users | `BLOCKED` | 48 | 48 | - | 134 | 74 |
| Users | `ACTIVE` | 36 | 36 | - | 134 | 63 |

**The chain, all four links measured.** The catalogue's Status column is **92px** wide; the
cell's `14px 20px` padding takes 40, leaving 52; the badge's `max-width: 100%` puts its root at
**50**; the badge's own horizontal padding takes ~16, leaving **34** for a label that needs 49.
Users' Status column is **134px** and nothing clips.

Neither `LectureTableRow` nor `UserTableRow` sets a width, a `max-width` or a `text-overflow` on
the badge - every one of those comes from Mantine. What differs is only the column, and the
column is decided by `table-layout: auto` against the other columns' content. Both tables
report `needs=1134 gets=1134`, so **this happens with zero table overflow**, which is why it is
not `F-036`.

Worth stating because the report that prompted this said "ACTI..." and "INA...": the rendered
text is uppercase (Mantine's default `text-transform`), so the two glyph counts differ from the
label strings above.

## 10.2 Three fields on one row, at three different heights

The `Status` / `Role` / `Credibility score` row in the user profile modal, measured by input:

| Field | input y | description height | description |
| --- | --- | --- | --- |
| Credibility score | **667** | **0** | none |
| Status | **686** | 14 | "Deleting is a separate action." |
| Role | **700** | **29** | "Demoting an admin also signs it out." |

**33px of spread, and it is exactly the description heights.** Mantine stacks label,
description, input, so a taller description pushes its own input down while its neighbours stay
put. Credibility has no description at all when the field is editable, Status has one line, and
Role's 36 characters wrap to two at a third of a `size="lg"` modal.

The row above does the same thing at smaller scale: `Username` at **485** and `KIT email` at
**505**, 20px apart, because only one of them has a description.

## 10.3 The warnings badge and the warning history disagree

Measured from the rendered modal text for `Mira Kowalski`:

> ... umira@student.kit.edu **3 warnings** Joined 20 Jan 2026 ... **Warning history (0)** **No
> warnings issued.**

Two numbers for one fact, 40px apart on screen. See `F-076` for where each comes from.

## 10.4 The catalogue counts two of its three tabs

`["Lectures (3)", "Professors (3)", "Ratings"]`.

## 10.5 The Person filter truncates its placeholder

Measured with a canvas against each input's own computed font, comparing the text width with
the room inside the box:

| Field | text | needs | room | verdict |
| --- | --- | --- | --- | --- |
| Person | `Everyone the backend lists` | **175** | **136** | **truncated by 39px** |
| Search | `Name, email, or target...` | 160 | 261 | fits |
| Who | `Everyone` | 61 | 136 | fits |
| Action | `All actions` | 67 | 136 | fits |
| Target | `All targets` | 67 | 136 | fits |

One field of seven, and it is the longest placeholder in the panel.

## 10.6 The session strip is above the title

`/users?fault=session-check` at 1440:

| Element | y | height |
| --- | --- | --- |
| session notice, `role="status"` | **32** | 58 |
| `h1` "Users" | **102** | 31 |

A page-level error renders *below* the `h1`, because the page renders it after `PageHeader`
while the shell renders the session notice before the routes. Only the strip above was produced
in this run; the one below is read from the source, and that is stated rather than blurred.

## 10.7 Refuted: the Comments columns are not clipped

The report was that `LECTURE` and `CONTENT` are cut off while the right side has a large gap.
Measured at 1440:

| Column | width | cell needs / gets |
| --- | --- | --- |
| Content | 318 | 318 / 318 |
| Author | 159 | 159 / 159 |
| Lecture | 170 | 170 / 170 |
| Visibility | 102 | 102 / 102 |
| Reports | 79 | 79 / 79 |
| Posted | 193 | 193 / 193 |
| (actions) | 113 | 113 / 113 |

**The widths sum to exactly 1134**, which is the table's width and the holder's width, and no
cell overflows. There is no gap and nothing is clipped. What is visible is `ContentCell`'s
deliberate two-line clamp with a tooltip past 90 characters, which is a design decision with a
comment on it rather than a layout fault. Refuted at 1440 only; below 1300 every table scrolls
sideways, which is `F-036`.

## 10.8 Refuted: the Dashboard's two panels are gone

The report was that the left and right panels are different heights with a gap under the left.
Measured after step 1:

| Panel | x | y | w | h |
| --- | --- | --- | --- | --- |
| Total users | 272 | 389 | 272 | 116 |
| Active accounts | 560 | 389 | 272 | 116 |
| Admin accounts | 848 | 389 | 272 | 116 |
| Open reports | 1136 | 389 | 272 | 116 |
| Newest members | 272 | 532 | **1136** | 295 |

**There is no side-by-side pair any more.** `SystemPulse` was the right-hand panel and step 1
removed it, so `Newest members` spans the full width alone. The four cards are the same height
to the pixel. Not fixed here; fixed by `F-066` and re-measured because the report predates it.

## 10.9 Closed by step 6: the From and To widths

The report was that `From` is narrow while `To` takes the full width. That is `F-067`'s
838.5px measurement and it closed with the filter bar shell: both are **170** now. Section 6
above carries the numbers.

# Section 11: the seven-item round (2026-09-10)

Measured at 1440x900 and 1024x900 against the mock backend, tolerance 1px. Items 1 to 3 are
fixes and carry before/after; items 4 to 7 are measurement only.

## 11.1 Every multi-line box was two and a half lines tall, whatever it asked for

`minRows` is declared at all five call sites and applied at none of them. Mantine's
`Textarea.tsx` reads `const autosizeProps = shouldAutosize ? { maxRows, minRows } : {}`, so
without `autosize` the two props are dropped before they reach the DOM and the browser's
default `rows=2` stands. Every box measured **2.5 rows** including padding.

| Field | asks for | rows before | rows after | box before | box after |
| --- | --- | --- | --- | --- | --- |
| comment editor / Text | 5 | **2.5** | **5.6** | 54 | **121** |
| bug report / Description | 4 | **2.5** | **4.6** | 54 | **99** |
| warn form / Warning message | 3 | **2.5** | **3.5** | 51 | **71** |
| user edit / Biography | 2 | **2.5** | **2.5** | 54 | **55** |
| warning editor / Warning message | 2 | **2.5** | **2.5** | 46 | **47** |

The two that ask for 2 were already getting about 2, which is why this survived: the defect is
invisible in the two smallest fields and worst in the largest.

### What was cut off, in characters

The seeded value is the fixture's own content; `long` is the `long-content` fault's 264-character
German prose, the longest string the fixtures hold.

| Field | value | shown before | shown after |
| --- | --- | --- | --- |
| comment editor | 191 (seeded) | **164** - cut at "…Wer das ohne Tutorium s" | **191** |
| comment editor | 264 (long) | **152** | **264** |
| bug report | 264 (long) | **142** | **264** |
| warn form | 264 (long) | **153** | **264** |
| biography | 264 (long) | **142** | **264** |
| warning editor | 264 (long) | **160** | **264** |

The comment editor is the one an operator meets: **27 of 191 characters hidden mid-sentence**
on the fixture's own comment, with no scrollbar drawn until the box is focused.

### The ceiling, and what it protects

Filled with 1500 characters, the comment editor stops at **275px (12.7 rows)**, takes
`overflow-y: auto` and scrolls **inside itself**. The dialog stays 556px and does not scroll;
the document stays 900 and does not grow; Save stays on screen at y=675.

### The dialog was never the problem, and the brief's second requirement was already met

| viewport | dialog max-height | dialog scrollHeight | dialog scrolls | body overflow | document grows |
| --- | --- | --- | --- | --- | --- |
| 900 | **810** | 1130 | **yes** | hidden | no |
| 700 | **630** | 1130 | **yes** | hidden | no |

Mantine's `.mantine-Modal-content` already carries `max-height: calc(100dvh - 2 x yOffset)` with
`overflow-y: auto`, and `body` is `overflow: hidden` while a dialog is open. So a dialog taller
than the viewport already scrolls itself and cannot scroll the page. **A modal body cap was
planned and then not applied**: it would have nested a second scroller inside one that works.
Measured, not assumed - an earlier reading of this took `.mantine-Modal-body` (1069px,
`overflow: visible`) for the scroller and concluded the opposite.

Dialog heights after, all inside the 810 cap: comment editor 335 -> **402**, bug report
583 -> **627**, warn form 737 -> **778**, biography 810 -> **810**, warning editor 586 -> **622**.

### Not changed under this item, and why

`MetadataList.tsx:43` sets `wrap="nowrap"` on a metadata value with no `minWidth: 0`, and
`ChangeList.tsx`'s value box has no `maxHeight`. Both are read-only text in the audit detail
panel, not inputs, and neither pushed anything in this round's measurements. Left alone rather
than swept in.

**Opened by 11.1:** `F-084`.

## 11.2 Deactivating a lecture, measured before and after (`F-006`, `F-085`)

Not a layout measurement, and here because it is the round's second item and the numbers belong
with the rest. Chromium at 1440x900, against the mock backend.

### Before: the door the panel warns about does not exist in any test

| | lectures listed | after switching one to Inactive | after a reload | row still on screen |
| --- | --- | --- | --- | --- |
| as measured | **3** | **3** | **3** | **yes**, with an `Inactive` badge |

Calls observed: `GET /api/data/lectures`, `GET /api/data/professor`, `PATCH
/api/data/lectures/lecture-1`. No `/all` anywhere. The mock served every row from the
active-only reads, so `InactiveVisibilityNotice` was warning about something that did not
happen. `F-085`.

### With the handlers corrected, the door reproduces

| filter | rows |
| --- | --- |
| default | **2** - the fixture's inactive `Lineare Algebra I` is gone |
| after deactivating `Programmieren` | **1** |

### After: the round trip

| step | filter | rows |
| --- | --- | --- |
| loaded | Active (default) | **2** |
| widened | Inactive | **1** - `Lineare Algebra I`, reachable from no screen before |
| widened | All | **3** |
| deactivated `Programmieren` | Active | **1** |
| looked for it | Inactive | **2** |
| switched it back on | Active | **2** |

Calls after: `GET /api/data/lectures/all`, `GET /api/data/professor/all`, `PATCH
/api/data/lectures/lecture-1`.

**Closed by 11.2:** `F-006`. **Opened and closed by 11.2:** `F-085`.

## 11.3 Refuted: opening a detail view does not move the page behind it

The brief says the background shifts "in some places". It does not, in any of them. This
extends §2.1, which sampled seven anchors on **six** modals at 1440: here it is **eleven**
surfaces - `e2e/surfaces.ts`'s whole registry - at **1440 and 1024**, with two anchors added
that §2.1 never sampled.

Anchors: `pageTitle`, `pageDescription`, `tabList`, **`cardRow`**, **`filterStrip`**,
`tableFirstRow`, `sidebarFirstItem`, `sidebarLastItem`, `main`. Sampled before opening, while
open, and after Escape. Tolerance 1px.

| | surfaces | anchors each | readings | over tolerance |
| --- | --- | --- | --- | --- |
| 1440x900 | 11 | 9 | 297 | **0** |
| 1024x900 | 11 | 9 | 297 | **0** |

Dialog widths, measured again and unchanged: **620** for the nine editors and detail panels,
**380** for the confirmations. Two values, as §2.1 found.

### The scrollbar question, asked again and answered the same way

| Measurement | before open | while open |
| --- | --- | --- |
| `window.innerWidth - documentElement.clientWidth` | **0** | **0** |
| `getComputedStyle(documentElement).scrollbarGutter` | `auto` | `auto` |
| `body` overflow | `visible` | `hidden` |

Mantine locks the body while a dialog is open, and this Chromium's scrollbar is an overlay
taking no width, so there is nothing for the lock to compensate for and nothing moves. **The
brief pre-authorised `scrollbar-gutter: stable` and said to write it down instead if the
measurement came back zero. It came back zero.** `F-062` still stands, unfixed, for the same
reason it did in §2.6: it needs a browser with classic scrollbars to confirm.

### One number that was not zero, and was mine

The first run reported `tableFirstRow` moving **-382px** on Comments, **-282** on the
catalogue, **-142** on Professors and **-42** on Ratings at 1024, on open *and* still after
close - and only on dialogs opened from a row-action button, never from a row click. Those are
`F-036`'s overflow figures exactly. The cause was the measurement: Playwright scrolls an
element into view before clicking it, so the reading charged the modal for a scroll the click
had caused. Bringing the opener into view **before** taking the `before` sample gives zero on
all 22 combinations.

It is still real for an operator, though, and is recorded as `F-086` in 11.4 rather than
thrown away.

**Opened by 11.3:** nothing. **Refuted by 11.3:** the premise.

## 11.4 Reaching a row action at 1024 scrolls the table sideways, and it stays scrolled (`F-086`)

| Table | holder overflow at 1024 | `scrollLeft` before | while the dialog is open | after Escape |
| --- | --- | --- | --- | --- |
| Comments | 382 | 0 | **382** | **382** |
| Lectures | 282 | 0 | **282** | **282** |
| Users | 162 | 0 | 0 | 0 |
| Audit Logs | 182 | 0 | 0 | 0 |

At 1440 every holder overflows by 0 and nothing moves.

Users and Audit Logs hold still because **they have no row-action column** - nothing in them
sits far enough right to have to be scrolled to. The two that move are the two whose actions
live in the last column of a table `F-036` says is wider than its holder.

The cost is not the scroll, it is that it does not come back: the operator closes the dialog
and the table is still scrolled fully right, with the Content and Lecture columns - the ones
that say what the row *is* - off the left edge.

## 11.5 List symmetry: what steps 4 to 6 left behind (`F-087`)

Measured at 1440x900, eleven screen states. **Nothing here was changed** - the brief asks for
the deviations and one proposed standard each, and the choice is the maintainer's.

### The one that reopens a closed finding

| screen | tab strip y | filter strip y | order |
| --- | --- | --- | --- |
| Comments (both tabs) | **220.6** | 276.6 | tabs, then filter |
| Bug Reports | **220.6** | none | - |
| Catalogue (all three tabs) | **306.6** | 220.6 | filter, then tabs |

`F-065` was closed on the sentence "the tab strip starts in the same place on every screen",
measured at 220.59. It does not any more: the catalogue's strip sits **86px lower**, because
`F-067` put a filter bar above it and Comments keeps its filter *inside* the tab panel. Two
screens that both tab and filter, in the opposite order. **`F-087`.**

*One standard, proposed:* the filter bar belongs above the tab strip on both, because it is the
same shell in the same place on the five screens that filter. That moves Comments' strip down
to 306.6 and makes the catalogue the reference rather than the outlier - and it costs the
Comments filter its per-tab content unless the page holds the tab, which it already does.

### Where each band starts

| band | values measured | screens |
| --- | --- | --- |
| page title | **32** | all eleven - the one number that never varies |
| card row | **117.8** | Users, Comments, Catalogue, Bug Reports; the two logs have no cards; the Dashboard's own is 388.6 |
| filter strip | **117.8** / **220.6** / **276.6** | logs / Users and Catalogue / Comments |
| table panel | **349.4** / **362.6** / **379.4** | logs / Comments and Catalogue / Users |
| first row | 435.7 / 448.9 / 473.2 / 490 | logs / Comments / Catalogue / Users |

The spread follows from what is above each table rather than from four different paddings, so
the standard worth proposing is the one above: fix the **order** of the bands and the y values
follow.

### Row actions do not share a right edge

The table panel's right edge is **1408** on every screen. The rightmost row control is not.

| table | rightmost control | inset from the panel | controls, in order |
| --- | --- | --- | --- |
| Comments All | **1361.6** | **46.4** | expand, author, edit, delete |
| Comments Reports | **1387** | **21** | author, author, edit, delete, withdraw |
| Lectures | **1387** | **21** | edit, delete |
| Professors | **1387** | **21** | edit, delete |
| Ratings | **1356.7** | **51.3** | delete |
| Users | - | - | **none** |
| Audit / Activity Logs | - | - | **none** |

Three insets - 21, 46.4 and 51.3 - a **30px spread**, and the order is consistent where the
same action exists (edit before delete, destructive last).

*One standard, proposed:* every row-action group ends **21px** from the panel edge, which is
the value three of the five already use. Comments All and Ratings are the two to move.

### Two empty states, not one

| screen | height | padding | icon |
| --- | --- | --- | --- |
| Users, Catalogue | **101** | 40px | none |
| Comments, Bug Reports | **191** | 60px | yes |

*One standard, proposed:* the taller, iconned one, which is what the majority of list surfaces
already draw; the two table-cell states are the ones to raise.

### Table minimum widths: seven tables, seven decisions

**1100** Comments, **1000** Lectures, **960** Reports, **900** both logs, **860** Professors,
**760** Ratings, and **none at all** on Users. Column counts are 7, 7, 8, 6, 5, 5 and 8.

*One standard, proposed:* leave them. The number is a per-table judgement about its own columns
and a single value would either cramp Comments or pad Ratings; what wants deciding is
`F-036`, which is the same question asked properly.

### Asked and answered without a deviation

- **Modal widths: two values, 620 and 380.** The brief asks for a report above three. Under.
- **Cell alignment: uniform.** Every data cell in all seven tables is left-aligned through
  `TableHeaderRow`; only empty states centre. Numeric columns are left-aligned like text
  everywhere, so they are consistent, if not conventional.
- **Column order by data type is not consistent, and it is not obviously wrong either.** The
  date column is **first** on both logs (`Time`) and fourth to eighth everywhere else; the
  status badge sits at index 3 on Professors, 4 on Users, 5 on Lectures and 6 on Reports. A log
  is read by when, a list by what, so this is recorded as a divergence rather than a defect.
- **Row heights** run 53.8 to 119.2 and are content-driven; `F-069` already decided the one
  padding token underneath them.

**Opened by 11.5:** `F-087`.

## 11.6 Where every filter bar breaks, 1024 to 1440

Control rows occupied by each bar, with the controls per row in brackets. The action row, where
a bar has one, is counted separately and is always its own row.

| Bar | controls | 1024 | 1152 | 1280 | 1366 | 1440 | breaks at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Users | 4 | **2** (3+1) | 1 (4) | 1 | 1 | 1 | between **1024 and 1152** |
| Comments All | 2 | 1 | 1 | 1 | 1 | 1 | never |
| Comments Reports | 3 | 1 | 1 | 1 | 1 | 1 | never |
| Catalog Lectures | 2 | 1 | 1 | 1 | 1 | 1 | never |
| Catalog Professors | 2 | 1 | 1 | 1 | 1 | 1 | never |
| Catalog Ratings | 1 | 1 | 1 | 1 | 1 | 1 | never |
| Audit Logs | 6 | **2** (3+3) | **2** (4+2) | **2** (4+2) | **2** (5+1) | **2** (5+1) | **always** |
| Activity Logs | 7 | **2** (3+4) | **2** (4+3) | **2** (4+3) | **2** (5+2) | **2** (5+2) | **always** |

**The break points are not consistent across routes, and they are not arbitrary either: they
follow control count.** One to three controls never wrap at any measured width; four wrap only
at 1024; six and seven wrap at every width there is. There is no shared breakpoint to name,
because nothing here is written against one - the bar is a wrapping flex row and the wrap is
decided by what fits.

The panel's inner width at each viewport, which is what everything above is competing for:
**678** at 1024, **806** at 1152, **934** at 1280, **1020** at 1366, **1094** at 1440.

### The empty space on the right, which is the visible half of the complaint

Distance from the last control on the final control row to the panel's inner right edge:

| Bar | 1024 | 1152 | 1280 | 1366 | 1440 |
| --- | --- | --- | --- | --- | --- |
| Audit Logs | 113 | 453 | 581 | 849 | **923** |
| Activity Logs | 0 | 241 | 369 | 667 | **741** |
| Users | 477 | 0 | 0 | 23 | 97 |
| Comments All | 105 | 233 | 361 | 447 | **521** |
| Catalog Ratings | 317 | 445 | 573 | 659 | **733** |

At 1440 the Audit bar's second row holds **one 170px control with 923px of nothing beside it**,
and then the action row below that. That is the shape the brief calls bad, and the number.

## 11.7 The two log bars: four options, costed (`F-088`)

### First, a correction to this document

§Step 6 concludes that after `F-067` "row one is the search and the selects, row two is the
dates" and that this is "the same wrap on both". Measured at 1440:

| Bar | row 1 | row 2 |
| --- | --- | --- |
| Audit Logs | Search 319, Admin 189, Action 189, Target 189, **From 159** | **To 170** |
| Activity Logs | Search, Person, Who, Action, Target | From, To |

Audit splits its two date fields **across** the two rows; Activity keeps them together. The
claim is true of Activity and false of Audit - and §Step 6's own date table already said so,
listing Audit's `From` at 159 "because it sits on the crowded first row and never grows to its
170 cap". The summary sentence and the table underneath it disagreed, and the summary was the
part that got quoted. **`F-088`.**

### The constraint, restated with the measured numbers

Panel inner width **1094** at 1440. `input[type=date]` has a Chromium minimum of about **170**.
Six Audit controls at their caps need 360 + 3x200 + 2x170 = 1300; at their bases,
260 + 3x160 + 2x170 = 1080, plus five 12px gaps = **1140**. Short by **46**. Activity has a
seventh control: 1240 + 72 = **1312**, short by **218**.

### The options

| # | Change | Audit at 1440 | Activity at 1440 | Cost |
| --- | --- | --- | --- | --- |
| **A** | Narrow search to 240 and selects to 150 | 240 + 450 + 340 + 60 = **1090** - fits, 4px spare | 240 + 600 + 340 + 72 = **1252** - **still wraps** | Already measured and rejected in §Step 6: four pixels is a coincidence, and it puts the two log screens back on different layouts, which is the whole of `F-067` |
| **B** | Replace the two native date inputs with one range control (~200px), keeping today's widths | 260 + 480 + 200 + 48 = **988** - fits, 106 spare | 260 + 640 + 200 + 60 = **1160** - **still wraps** | A range control is a new component the panel does not have; native `type=date` gives the browser's own picker and keyboard behaviour for free, and dropping it is an accessibility change that wants its own look |
| **C** | **B** plus narrowing search to 200 and selects to 150 | 200 + 450 + 200 + 48 = **898** | 200 + 600 + 200 + 60 = **1060** - **fits**, 34 spare | The only option measured to put **both** bars on one row. Costs the new control *and* narrower fields; `F-067` sized those fields by what goes in them, and `F-082` is already a placeholder truncated at 136px |
| **D** | Keep two rows, let each row stretch to fill the width | Audit 3+3, each control ~357 | Activity 4+3 | No new component and the right-hand gap goes to zero, but a `Select` over four options drawn 357px wide is exactly the unbounded growth `F-067` added `maxWidth` to stop - it would be reintroducing that on purpose |
| **E** | Keep two rows, move Apply and Clear onto the last control row's right | Fills 235 of the 923px gap | Fills 235 of 741 | Satisfies both stated goals at once and costs nothing new - but it undoes the specific thing `F-067` did: the buttons' position becomes a function of how many controls happened to wrap, which is what put them at two different heights on three screens before |

**Nothing applied.** `E` is the cheapest and reverses a deliberate decision; `C` is the only one
that fits both bars on one row and costs a new control plus narrower fields. The choice is the
maintainer's.

**Opened by 11.7:** `F-088`.

## 11.8 Ratings: the scores on screen are the fixture's, not the backend's (`F-089`)

Three questions, three answers. **Nothing applied.**

### Are the scores real?

Under the mock backend, yes and they look convincing: the Scores cell reads
`Content 4 · Clarity 5 · Difficulty 3`. Against the deployed backend it is a dash.

Verified by handing `toRating` the payload `docs/adminweb-tasks-from-backend.md` §2a documents,
rather than by reading the code and inferring:

```
in   {"id":"rating-1","student":{...,"name":"Lena Hoffmann"},"lectureLabel":"CS101 - Algorithms",
      "topics":[{"category":"LECTURE_UNDERSTANDABILITY","value":4.5},{"category":"LECTURE_CONTENT","value":3}],
      "createdAt":"..."}
out  {"id":"rating-1","lectureId":"lecture-1","authorName":"Unknown","createdAt":"...","scores":{}}
```

| Column | reads | backend serves | on screen against the real backend |
| --- | --- | --- | --- |
| Scores | `rating.scores` (open map) | `topics: [{category, value}]` | **`-`** on every row (`scoreLine({})` returns `EMPTY_VALUE`) |
| Rated by | `rating.author.name` | `student.name` | **`Unknown`** on every row |

Both reads are optional-chained with a fallback, so neither fails - they produce wrong data
quietly. **Why nothing caught it:** the mapper, `RatingsService.unit.test.ts:24-35`,
`sweepFixture.ts`, `demoData.ts` and the MSW handler all use the panel's own field names, so
the whole stack is self-consistent and wrong together. Only the backend's own sweep saw it.

### Can a rating be edited?

**No, and the panel is right not to offer it.** Verified on both sides: the whole call surface
holds `ratings.list` and `ratings.delete` and no write at all, `RatingDeletionService.ts:6` and
`RatingsTable.tsx:21-24` both say a rating is someone's own assessment, and the backend's
document says "a rating can be removed, never rewritten". Nothing in the brief asks for
anything against that.

### So what should the row click do?

Open a **read-only detail view**, not an editor - which is also the shape `F-083` wants, since
the Ratings row is one of the two in the panel that answer a click with nothing. It has content
to show that the table cannot: the per-category scores in full rather than a truncated single
line, who rated and when, and the lecture. Deletion already exists as a row action and would
move into the dialog beside the rest.

*Proposed, not applied:*
1. Fix `ratingMapper.ts` to read `student` and `topics` and to keep the category order the
   backend sends. **This breaks `fixtureEnums.unit.test.ts:45-69`**, which hard-codes the regex
   `/scores:\s*\{...\}/` and asserts it matched something, so that sweep has to learn the new
   shape in the same change - which is the sweep working, not a cost.
2. Then a `RatingDetailsModal`, opened by `ClickableRow` the way the other five tables do it.

Doing 2 before 1 would put a detail view on screen whose every field is `Unknown` and `-`
against a real backend.

**Opened by 11.8:** `F-089`.

# Section 12: the two applied, and what moved (2026-09-10)

Two of §11's proposals were taken, two were left. Measured at 1440x900 before and after, plus
1024 to 1440 for the bars.

## 12.1 Every dialog was sliding 30px as it opened (`F-090`)

§11.3 sampled the page's anchors 700ms after a dialog opened and found nothing moving. It was
measuring the wrong thing: the background does not move, and **the dialog does**. Sampled every
40ms from the click instead:

| Dialog | enters at | settles at | travel | height change |
| --- | --- | --- | --- | --- |
| user profile | 169 | 199 | **30** | 0 |
| content editor | 219 | 249 | **30** | 0 |
| lecture editor | 132 | 162 | **30** | 0 |
| bug report | 208 | 238 | **30** | 0 |
| audit detail | 99 | 129 | **30** | 0 |
| activity detail | 223 | 253 | **30** | 0 |

Mantine's default entrance is `fade-down`. `DESIGN.md` §Motion permits one movement in the
panel, `translateY(-2px)`, and says nothing moves further. After `transition: 'fade'`: **0px,
one position, all twelve dialogs.**

## 12.2 The tab strip, the row actions and the empty states (`F-087`)

| | before | after |
| --- | --- | --- |
| tab strip - Comments / Bug Reports / catalogue | 220.6 / 220.6 / **306.6** | **220.6 / 220.6 / 220.6** |
| filter strip - Comments / catalogue | 276.6 / **220.6** (above the tabs) | **276.6 / 276.6** |
| table panel - Comments / catalogue | 362.6 / **358.6** | **362.6 / 362.6** |
| row actions, rightmost control | **1387 / 1387 / 1387 / 1361.6 / 1356.7** | **1387** on all five |
| empty state height | **101 / 191** | **192 / 191 / 141** * |
| empty state padding | 40px / 60px / 56px | **60px** everywhere |

\* The three heights that remain are content, not padding: Users draws an icon and one line,
Comments two lines, the catalogue one line with no icon in the ratings case. The decision -
what padding an empty state gets - is now one value in one place.

## 12.3 The log bars fill their width, and still take two rows (`F-088`, partly)

The four options in §11.7 stay on the deferred list; none of them was taken. What was taken is
the narrower request: **stop leaving dead space on the right.**

| Bar | 1024 | 1152 | 1280 | 1366 | 1440 |
| --- | --- | --- | --- | --- | --- |
| Audit, right gap before | 113 | 453 | 581 | 849 | **923** |
| Audit, right gap after | **0** | **0** | **0** | **0** | **0** |
| Activity, right gap before | 0 | 241 | 369 | 667 | **741** |
| Activity, right gap after | **0** | **0** | **0** | **0** | **0** |

Two changes, and the second is the one that matters. Dropping `maxWidth` for the log fields
lets a wrapped row fill the width it is given - but on its own it made Audit's second row **one
1094px date field**, which is worse than the gap it replaced. So the two dates are now one flex
item that never splits.

That also fixes what `F-088` recorded as a documentation error: Audit used to wrap `To` alone
while Activity wrapped both. Both now wrap the pair, so the two log screens finally have the
shape §Step 6 claimed they already had.

Audit at 1440 after: row one Search 387, Admin 224, Action 224, Target 224; row two the date
pair across 1094. Activity: five controls, then the pair. **Cost, stated:** each date box is
about 541px, wider than its content needs. That is the price of filling the row without
collapsing to one line, which was the instruction.

**Opened by section 12:** `F-090`, fixed in the same round.

