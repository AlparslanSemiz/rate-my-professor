# Architecture Decision Records

One file per decision that shaped this panel and would be expensive to reverse.
An ADR is not a changelog entry: `CHANGELOG.md` records *what changed and why*
at the time; an ADR records *what was decided, what else was on the table, and
what the project now has to live with*.

## Format

Every record carries the same five headings, in this order:

| Heading | What goes in it |
| --- | --- |
| **Decision** | One sentence. What was decided, in the present tense. |
| **Context** | The situation that forced a choice. What was true before. |
| **Alternatives considered** | The options that were genuinely weighed, each with its cost. An ADR with no alternatives is a description, not a decision. |
| **Rationale** | Why this one. Named trade-offs, not adjectives. |
| **Consequences** | What follows: including what got worse. A record that lists only benefits is not honest. |

Plus a **Status** (`Accepted`, `Accepted: not yet implemented`, `Superseded by
NNNN`) and a **Date**.

## Two rules

**Nothing here is invented.** Every record cites where its reasoning already
existed: a `CHANGELOG.md` entry, a `README.md` paragraph, a comment at the code.
Where a decision predates this folder, the record says so and reconstructs it from
those sources rather than from memory.

**A superseded record is not deleted.** It gets a `Superseded by` status and stays.
The wrong turn is part of the reasoning.

## Index

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-tanstack-query-as-the-data-layer.md) | TanStack Query is the data layer | Accepted |
| [0002](0002-delete-the-activity-log-screen.md) | The Activity Log screen is deleted, not merged into the audit log | Superseded by [0016](0016-the-activity-log-screen-returns.md) |
| [0003](0003-remove-the-system-status-screen.md) | The System Status *screen* is removed; the endpoint stays | Accepted |
| [0004](0004-elevated-operator-is-behaviour-not-a-role.md) | The elevated operator is a behavioural privilege, never a role | Accepted |
| [0005](0005-central-theme-no-hex-literals.md) | Colour, spacing and typography come from the theme; components carry no hex literals | Accepted |
| [0006](0006-cursor-pagination.md) | Long lists page on an opaque cursor, not on an offset | Accepted |
| [0007](0007-route-based-lazy-loading.md) | Code is split at route boundaries and nowhere else | Accepted |
| [0008](0008-generated-schema-is-the-contract-authority.md) | The generated OpenAPI schema is the authority on the API contract | Accepted: not yet implemented |
| [0009](0009-msw-slice-by-slice.md) | MSW is adopted one feature at a time, not in a big-bang rewrite | Accepted: implemented, amended twice |
| [0010](0010-admin-email-list-in-the-bundle.md) | The admin address list ships in the frontend bundle | Accepted |
| [0011](0011-session-in-browser-storage.md) | The session lives in browser storage, with the XSS surface that implies | Accepted |
| [0012](0012-a-model-is-a-module-not-a-class.md) | A model is a module, not a class | Accepted |
| [0013](0013-errors-are-types-not-status-codes.md) | Errors are types, not status codes | Accepted: applied twice since |
| [0014](0014-public-data-is-readonly.md) | Public data is readonly, and services get a narrow transport | Accepted |
| [0015](0015-panel-test-layers-answer-the-panels-own-questions.md) | The panel's test layers answer the panel's questions, not the backend's | Accepted |
| [0016](0016-the-activity-log-screen-returns.md) | The Activity Log screen returns, on the audit log's own code | Accepted |

0002 and 0016 are the pair worth reading together: the first deleted a screen on the strength
of "nobody is using it", and the second put it back a day later. Neither is deleted, and 0016
says what 0002 assumed and what that assumption cost.

0010 and 0011 are the two the panel is most likely to be challenged on. Both are
written as defences rather than as announcements, and both state what they cost.

0012 is the third: it answers a design criterion the panel deliberately does not
meet on that criterion's own terms, and says why the module boundary is the
encapsulation instead.
