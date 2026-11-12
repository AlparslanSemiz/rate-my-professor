# 0005 — Colour, spacing and typography come from the theme; components carry no hex literals

**Status:** Accepted
**Date:** 2026-09-09

## Decision

`src/theme/` and `src/constants/colors.ts` are the only places a colour is chosen.
A component that needs one imports a token. Accent and neutral chrome are kept in
separate modules and are not merged.

## Context

`src/theme.ts` already defined the full KIT ramp and a set of neutrals described in
its own comments as "warmer, softer — less cold GitHub-clone feel". Almost nothing
used them. The panel was painted with **386 hex literals across 67 files**, and its
inputs and modals were styled by handing the same two objects to `styles={...}` at
**42 call sites in 22 files**.

The literals were not a palette. `#1c2128`, `#1e2028`, `#1b1f27`, `#21262d` and
`#232935` were all "a hairline", within five points of each other, and which one a
component used was down to whoever wrote it. Two accents were not KIT colours at
all: `#a855f7` on the Professors card and `#f59e0b` on Ratings and the admin
counter.

## Alternatives considered

**Leave it and write the rule down.** Rejected: the rule already existed, in
`src/theme.ts`'s own comments, and 386 literals had accumulated under it. A
convention nothing enforces is not a convention.

**One flat token file.** Rejected because it is what causes the drift. Accent and
neutral chrome answer different questions — "what does this mean?" versus "what
surface is this?" — and keeping them apart is why a Mantine `Badge` and a
hand-built table row sit next to each other without clashing. The chrome values are
deliberately *not* the Mantine `dark`/`gray` ramps for the same reason.

**Tailwind, or CSS custom properties throughout.** Rejected as a second styling
system alongside Mantine's, in a project whose components are Mantine's.

**A lint rule banning hex literals in `src/components/`.** Not rejected — deferred.
It enforces the outcome but does nothing about the 386 that already existed, and
the interesting work was deciding which of five near-identical greys survived.

## Rationale

Collapsing five hairlines into `border` and `borderSubtle`, and four near-identical
raised surfaces into `surface`, produces a difference that is **invisible on screen**.
That is the point: the value of the change is that there is now one place to change
it, not that anything looks different.

Each input component is listed separately in `components.ts` because Mantine cascades
`defaultProps` from `Input` but **not** `styles` — theming `Input` alone would have
left `Select`, `NumberInput` and `MultiSelect` unstyled, and silently.

## Consequences

**This class of change fails quietly**, which is why `src/theme/theme.unit.test.tsx`
exists. An input that stops being themed still renders, only paler, and no other test
would notice. Any style moved into the theme gets an assertion there in the same
commit.

**Two literals survive on purpose**, both documented at the code: the dashboard hero's
two green-tinted gradient stops — the only green-tinted surface in the panel, so
naming them in `chrome` would imply they are reusable chrome — and a doc comment.

**One thing genuinely got worse-looking, and it was already wrong.** The sign-out
button drew its label from `KIT.red` (`#c77a7b`) and its border and wash from a
hand-written `rgba(239,68,68,…)` — `#ef4444`, a brighter red from no palette in this
project. It is one colour now, and slightly softer than it was.

**The stylesheet was not converted.** `src/interactive.css` still holds `#171b23`,
`#14171e`, `#232935` and two more — including one of the five hairlines this record
retired. It is a genuine leftover, not an exception, and it wants CSS custom
properties fed from `chrome`. Recorded in `docs/DESIGN.md`.

**Some `rgba()` literals remain in component files** — the yellow of a warning
surface, the blue of a form note, the red of a reported-content preview. They are
Tailwind-family values, not KIT ones, and they are the same class of leftover in a
different syntax.

## Sources

`CHANGELOG.md` — refactor step 2; `docs/DESIGN.md`.
