# 0007 — Code is split at route boundaries and nowhere else

**Status:** Accepted
**Date:** 2026-09-09 *(recorded; the decision predates this folder and is
reconstructed from `README.md` and `src/layouts/AdminRoutes.tsx`)*

## Decision

Every page is a `React.lazy` chunk behind a route, with `PageLoader` as the
`Suspense` fallback. Nothing below a route is split.

## Context

Without splitting, the browser downloads the JavaScript for all seven admin pages —
tables, modals, forms, the icon set — before it can render the login screen, which
is the only screen an unauthenticated visitor will ever see.

## Alternatives considered

**No splitting.** Simplest, and it makes the login screen pay for the whole panel.

**Split further, per modal or per heavy component.** Rejected: the modals are opened
from the page that already loaded them, so a second round trip buys nothing and adds
a spinner in the middle of an interaction the operator started. Route boundaries are
where a wait is already expected.

**Split by vendor rather than by route.** Not an alternative — Vite already does it,
and the two compose. Mantine lands in a shared `theme` chunk used by every page.

## Rationale

A route change is the one moment the user has already accepted a wait, and it is the
one boundary that matches how the panel is used: an operator opens two or three
screens in a session, not seven.

The split is real and visible in the build. `LoginPage`, `AdminLayout` and each of
the seven pages are separate chunks; `CatalogPage` and `CommentsPage` — the two
heaviest, at roughly 27 kB each — are downloaded only by someone who opens them.

## Consequences

**`PageLoader` is on the critical path of every first navigation**, so it stays
trivial: a centred `Loader`, in the main bundle.

**The route table is its own file.** `AdminRoutes.tsx` was split out of
`AdminLayout.tsx` because the seven `lazy()` imports and the route table were half of
a file named after the shell. The shell is now only the shell.

**A chunk that fails to load is an error boundary's problem**, not the router's, and
`react-error-boundary` wraps the app.

**Lazy loading is tested as routing behaviour**, not as a bundling detail — the
routing tests assert that visiting a path renders that page, which is what a broken
chunk boundary would break.

**This is about JavaScript only.** API data is already loaded independently by each
feature's hooks ([0001](0001-tanstack-query-as-the-data-layer.md)); the two are not
related and should not be conflated in a defence.

## Sources

`README.md` §Lazy Loading and Code Splitting; `src/layouts/AdminRoutes.tsx`;
`CHANGELOG.md` — refactor step 11.
