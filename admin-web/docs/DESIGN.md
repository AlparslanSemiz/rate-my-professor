# Design

How the admin panel is meant to look, and the rules for changing it. Written
against what the code actually does today: where the panel already follows a
rule this says so, and where it breaks one that is recorded too, with the reason.
A standard that quietly contradicts the codebase is worse than none.

The source of truth is `src/theme/` and `src/constants/colors.ts`. This file
explains them; it does not restate them. When the two disagree, the code is
right and this file is stale.

## The feel

Calm, readable, evenly set. An operator works one case across three screens —
a report, the profile behind it, the audit entry it produced — so the panel's job
is to stay out of the way and be legible at a glance, several hours in.

It is an internal tool, not a landing page. Nothing here needs to persuade
anyone.

## Source of truth

| Where | What |
| --- | --- |
| `src/theme/palette.ts` | The ten Mantine ramps. What Mantine's own components draw from. |
| `src/theme/chrome.ts` | The panel's neutral chrome: 6 surfaces/borders, 7 text greys. |
| `src/theme/components.ts` | Per-component styles declared once (inputs, modal). |
| `src/theme/index.ts` | `createTheme` — radius scale, shadows, font, primary colour. |
| `src/constants/colors.ts` | Accent colour only: `KIT`, `moduleAccent`, and the state→colour maps. |
| `src/interactive.css` | Hover and focus. Owned by CSS, not by JavaScript handlers. |

**Accent and chrome are kept apart on purpose.** `constants/colors.ts` holds only
accent; `theme/chrome.ts` holds only neutrals; and the chrome values are
deliberately *not* the Mantine `dark`/`gray` ramps. That separation is why a
Mantine `Badge` and a hand-built table row sit next to each other without
clashing. Do not merge them, and do not reach for a Mantine grey when a `chrome`
token exists.

## Colour

**One accent scale, one neutral scale.** The accent is KIT green; `moduleAccent`
gives each section its own hue so the sidebar item and the dashboard card for the
same screen agree. Accent carries meaning — a link, a section's identity, a
status — never decoration.

**No neon.** Accents stay at their KIT values. Do not brighten one to make
something stand out; if it needs to stand out, it is a hierarchy problem.

**No pure black, no pure white.** The darkest surface is `chrome.well` `#0b0d12`
and the brightest text is `chrome.textBright` `#f1f5f9`. Both sides stay inside
those bounds.

**No new grey.** Seven text greys and six surfaces exist, and they were arrived
at by collapsing 386 hex literals across 67 files down to thirteen names. Adding
an eighth grey because none looked quite right re-opens exactly that. If a hex
literal is about to be typed into a component, the answer is a `chrome` token.

## Typography

One family: Inter, with a system fallback stack. Headings are weight `650`.

Weights in use are **500, 600 and 700** alongside the heading weight. That is one
more than the three this standard would prefer; it is recorded rather than
enforced retroactively, and the rule going forward is that a new component picks
from those, not from a fifth.

Sizes are Mantine's `xs`–`xl` scale. The panel is dense tables and forms, so it
does not use the 17–19px body size a reading-oriented site would; what matters
here is that **`xs` is the floor** — nothing meant to be read goes below it, and
`chrome.textFaint` and `iconFaint` are for things that are not meant to be read.

## Space

Mantine's spacing scale, 4px based. The rule worth stating: **vertical space
between sections is at least three times the space inside an element.** A page
whose sections are separated by the same gap as its rows reads as one long list.

Line length is bounded on anything paragraph-shaped — help text, descriptions,
empty-state copy. A table row is not paragraph-shaped and is exempt.

## Surface, border, radius

**A 1px border, not a shadow, is how two surfaces are separated.** `chrome.border`
is the standard hairline; `chrome.borderSubtle` is for rows inside an
already-bordered surface. Shadows exist in the theme (`sm`/`md`/`lg`) and are for
things that genuinely float — a modal, a dropdown — not for making a card look
raised.

Radius comes from the theme scale: `xs` 6px, `sm` 9px, `md` 12px (the default),
`lg` 16px, `xl` 22px. This is looser than a print-set standard would allow. The
rule is **do not add a larger one**, and prefer the smaller end for anything
dense.

## Motion

Motion exists, and it is small. `--interactive-ease` is `140ms ease`, and every
hover transition in the panel runs through `src/interactive.css` rather than
through mouse-enter handlers writing to `element.style` — which is what used to
happen, and which fought the transition declared next to it.

What is allowed:

- **Hover and focus transitions.** Background, border, shadow.
- **One movement**: `.card-interactive:hover` lifts `translateY(-2px)`. Two
  pixels, on the dashboard's module cards only. Nothing else moves, and nothing
  moves further than this.

What is not:

- Scroll-triggered entrance animation.
- Anything that changes an element's size or position enough to shift what is
  around it.
- Animating a property that forces layout.

`@media (prefers-reduced-motion: reduce)` already removes the transitions and the
2px lift. **Any new animated class is added to that block in the same commit.**

## Interface text

**No em dash and no en dash.** Not in a label, a button, an empty-state sentence, an
error message, a tooltip, a table header, a placeholder, or in fixture data that reaches
the screen. A clause that wants an em dash wants a full stop, a colon, a semicolon or a
pair of brackets instead, and choosing which is part of writing the sentence.

This is a rule as of 2026-09-10, and before that date it was not one. The panel had **41
em dashes across 27 files** and zero en dashes, and an earlier round deliberately left
them alone on the grounds that removing them would mean inventing a rule and applying it
in the same commit. The rule is written here first so that the change has something to
point at.

**Where there is no value, the marker is `EMPTY_VALUE` in `src/utils/emptyValue.ts`**, a
plain hyphen, and it is the only glyph for that meaning. That file used to argue for an em
dash; it now records why it changed rather than pretending it always said this. One
meaning, one glyph, was always the point - the em dash was never the point.

Code comments are exempt. They are not interface text, they are read in the editor, and
this repository's comments carry the reasoning that makes the code reviewable.

## Banned

Gradient text. Glassmorphism and blurred cards. Emoji used as an icon — the panel
uses `@tabler/icons-react`. Fabricated statistics, testimonials or activity.
Carousels. Sticky pop-ups. Marketing furniture generally: "trusted by" logo
strips, triple icon-card sections, stock hero sentences. Lorem ipsum — if the
real copy does not exist yet, ask for it.

## Where the panel diverges, and why

Recorded so nobody has to rediscover it, and so nobody "fixes" a deliberate one.

**Gradients.** A strict reading of this standard bans gradient backgrounds
outright; the panel has eleven. Most are not decoration — they are a vertical
wash between two adjacent chrome tokens (`surface` → `pageBase`), which reads as
a flat surface with a slight fall-off. Those are fine and are not counted here.
The four that are genuinely doing something are:

| Where | What it is |
| --- | --- |
| `index.css` app background | Two very low-alpha radial washes in KIT green and lime. |
| `DashboardHero.tsx` | The one green-tinted surface in the panel; two literal stops, documented at the file. |
| `PageHeader.tsx` | The accent bar under a page title, KIT green → the institute's unsoftened `#009682`. |
| `SidebarNavigation.tsx` | The active nav item, in its section's colour at 14%/6% alpha. |

Each is deliberate and each is documented where it lives. **No fifth is added.**

**`src/components/ErrorAlert.tsx` holds a raw `rgba()` and renders pure white.** Two
divergences in one component, both predating its second level and both left alone
deliberately. Its red is `rgba(239,68,68,…)` written by hand — not `KIT.red`, not a
`chrome` token, and the one place the no-hex-literal rule is broken in a component
rather than in a stylesheet. And Mantine's `Alert` colours the message `#ffffff`,
against the rule above that the brightest text is `chrome.textBright` `#f1f5f9`.
Correcting either restyles **seventeen** call sites at once, which is a visual change
in its own right and not one to fold into an unrelated commit. The `warning` level
added for the session notice uses `KIT.yellow` through `withAlpha`, so the new half of
the component follows the rule; the old half is recorded here rather than quietly
matched. `docs/TODO.md` carries it.

**`src/interactive.css` still holds hex literals.** `.panel` is written with
`#171b23`, `#14171e` and `#232935`, and `.card-interactive:hover` with `#1c212b`
and `#181c25`. Refactor step 2 converted the TypeScript but not the stylesheet,
and `#232935` is one of the five near-identical hairlines that step retired in
favour of `chrome.border`. This is a genuine leftover, not an exception. It wants
CSS custom properties fed from `chrome`.

**Radius and weights** run looser than this standard's ideal, as noted above.

## Method for any visual change

In order, and the first one is not optional.

1. **No code first.** Produce the design tokens and a short written style note,
   and get them approved before anything is implemented.
2. **Three directions for the same screen**, described at the level of typography
   and layout — not three colour schemes. Explain how they differ and what each
   costs. One gets picked.
3. **One component at a time.** When it is done, screenshot it, critique your own
   output against the rules above in writing, then fix what the critique found.
   A change is not finished at "it renders".
4. **Real content.** Never lorem ipsum. If the copy does not exist, ask.

## Checking your work

Playwright's Chromium is cached per platform — `~/.cache/ms-playwright` on Linux,
`~/Library/Caches/ms-playwright` on macOS — so a visual check is possible and there is
no excuse for shipping a style change unseen.

**A state nothing reaches by clicking is still a state that has to be looked at.** An
alert region has to be seen while it is *showing*, and getting there used to mean
editing a handler, screenshotting and editing it back — which is how a state gets
signed off unseen. `?fault=<name>` on any URL under `VITE_MOCK_BACKEND` now serves a
named failure from `src/test/msw/browser.ts`. Test-only, and absent from a production
build with the rest of the mock backend.

`src/theme/theme.unit.test.tsx` exists because moving styles into the theme fails
**quietly** — an input that stops being themed still renders, only paler, and no
other test notices. Any style moved into `src/theme/` gets an assertion there in
the same commit.
