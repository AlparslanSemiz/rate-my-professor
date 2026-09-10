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
