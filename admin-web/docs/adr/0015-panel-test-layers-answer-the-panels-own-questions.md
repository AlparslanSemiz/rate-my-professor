# 0015 — The panel's test layers answer the panel's questions, not the backend's

**Status:** Accepted
**Date:** 2026-09-09

## Decision

The suite is organised into layers named for the **questions this panel has**, not for the
backend's five. The backend's layers are `unit → API/role → contract → integration → E2E`; this
repository's are:

| Layer | The question |
| --- | --- |
| **1 — Call surface** | What did we actually send? |
| **2 — Contract** | Does the backend agree? *(not built — no schema)* |
| **3 — Resilience** | What happens when the answer is wrong? |
| **4 — Real browser** | Does it fit, and can it be operated? |
| **5 — Accessibility** | Can it be used without a mouse or without colour? |
| **6 — End-to-end** | Do two whole flows work? |

Only one name is shared, and it is shared on purpose: **Contract** means the same thing in both
repositories and is ranked the same way by [ADR 0008](0008-generated-schema-is-the-contract-authority.md).

## Context

The backend repository finished a seven-batch test programme and wrote it up in
`docs/test-plan.md` as five layers with a stated question each. Both documents are read side by
side at the Abnahme, and the obvious move was to mirror the five names so the two plans line up
row for row.

They do not line up, and the reasons are structural rather than stylistic:

- **There is no unit/integration split to make here.** The backend's unit layer is "no Spring
  context, no database, no network" — a real boundary with a real cost on the other side of it.
  This panel's equivalent boundary is jsdom, and it is free: `src/test/setup.ts` runs for every
  test. What separates a cheap test from an expensive one here is whether it **renders**, which
  is not the same cut.
- **"API / role" has no counterpart at all.** Its subject is authorization — which routes which
  role may reach — and that is decided entirely in the backend. `src/utils/adminAccess.ts` is
  documented as a usability gate and not security. A layer named for it would measure a decision
  this repository does not make.
- **"Integration" means "against a real PostgreSQL"**, and the panel's equivalent — against a
  real backend — is exactly what this suite deliberately never does. Section 1 of
  `docs/testplan.md` has said so since it was written.
- **The panel has questions the backend does not.** Does the table fit at 1024px. Does focus
  return to the control that opened a modal. Is the status badge legible to someone who cannot
  separate green from orange. No backend layer covers any of those, and they are where four of
  this round's twelve findings came from.

## Alternatives considered

**Mirror the five names exactly.** The version that was actually attempted first, on the grounds
that two documents in the same format are easier to review together. Rejected once it became
clear what the mirrored table would have to say: an "API / role" row reading "not applicable" and
an "integration" row reading "never, by design" are two rows of five that measure nothing, and
the three questions that produced most of this round's findings would have had no row at all.
A shared format that hides the subject is worse than two formats that show it.

**One flat list of test files, with no layers.** What the suite had. It is honest and it is what
`docs/testplan.md` §6 already documents per file. Rejected because it cannot express the thing
this round set out to fix: that no test *swept* anything, so a new service method could arrive
untested and nothing would notice. A layer is a claim about coverage of a **question**; a file
list is a claim about coverage of *files*, and the two failures are different.

**Layer by feature — a Users layer, a Comments layer.** Rejected: it is how the suite was already
organised, and it is why `F-002` survived. A field the backend renamed is invisible to every
feature test at once, because they all replace the service. Cutting by question puts the
call-surface sweep somewhere it can see all forty-two endpoints together.

**Adopt the backend's mutation-testing layer too.** Rejected on cost, and recorded in
`docs/TODO.md` rather than dropped. The property mutation testing establishes — that the suite
notices when the code is wrong — was obtained per layer instead by deliberately breaking
something and watching the layer go red, which is written into `CHANGELOG.md` for each of the
five. That is cheaper and less complete, and saying which is which is the point.

## Rationale

**A layer earns its name by what it can rule out.** The value of the split is that each layer's
scope sentence names something it does *not* answer, and those sentences are what make the
negative results readable: "layer 1 found nothing" is worth something only next to "across 106
methods and all 42 endpoints, and it says nothing about whether the backend agrees".

**The split follows where a failure actually occurs, not where it is convenient to test.** The
clearest case is layer 3. A `503` is decided once, in `ApiResponseParser`, so it is asked once
per endpoint at the service layer — asking eight screens would be the same answer eight times at
the cost of eight renders. A **missing field** passes the parser without complaint and breaks in
a component, so it has to be asked of a rendered screen. Two halves of one question, cut where
the code cuts it.

**Two layers exist because jsdom answers wrongly rather than not at all**, which is the panel's
version of the backend's "questions H2 cannot answer go to Postgres". Every element in jsdom is
0x0, so a table twice as wide as its container and a table that fits produce identical numbers.
That is worse than no answer, and it is why layers 4 and 5 are split along the same seam: axe
runs in jsdom for every rule that does not need a box, and `color-contrast` and `target-size` are
switched off **by name** and handed to Chromium.

## Consequences

**The two plans no longer line up row for row, and a reviewer has to read both.**
`docs/testplan.md` §3a therefore opens by saying so and pointing here, rather than leaving
somebody to notice the mismatch and assume one document is stale.

**Layer 2 is a row that says "not built".** Keeping the backend's name for it, in a table where
every other row is done, makes the gap harder to overlook than dropping the row would — but it
also means the panel's plan advertises a missing artefact on every read. That is the intended
trade and it is why the row cites ADR 0008 rather than restating it.

**Some findings are now attributable to a layer, and some are not.** `F-024` and `F-033` were
found by *running* the suites rather than by any layer, and `docs/testfindings.md` gives them
their own row rather than filing them under whichever layer was running at the time. A
distribution table that quietly credited a layer with a flake it merely surfaced would be the
same kind of untrue as a green that measured nothing.

**A layer can now be vacuous, and each one carries a guard against it.** The ratchet in layer 1
would pass over an empty discovery list; the axe specs would pass on a rule that never ran; the
table-overflow measurement skipped every table that could fail in its first version. Each of
those was found by trying to make the layer go red and failing. **Nothing in this structure is
self-verifying** — the deliberate break is, and it has to be repeated whenever a layer is
extended.

## Sources

New decision. It records reasoning that existed in three places and nowhere as a decision: the
scope sentences in each new test file's header comment, `docs/testplan.md` §3a's table, and the
handover note in `docs/worklog.md`. The backend's `docs/test-plan.md` is the document it is
written against, and its `P-7` reading rule is quoted in `docs/TODO.md` where mutation testing is
deferred.
