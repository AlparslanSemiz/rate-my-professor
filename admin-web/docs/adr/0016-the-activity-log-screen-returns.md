# 0016 — The Activity Log screen returns, on the audit log's own code

**Status:** Accepted
**Date:** 2026-09-10
**Supersedes:** [0002](0002-delete-the-activity-log-screen.md)

## Decision

The Activity Log screen is restored, and the two log screens are **one feature with two
vocabularies** rather than two features that resemble each other.

## Context

[0002](0002-delete-the-activity-log-screen.md) deleted the screen on 2026-09-09. Its argument
was not that the code was duplicated — it said so explicitly: *"The 1187 duplicated lines were
the symptom; the cost was two screens to keep true as the backend's vocabulary changed, for one
of which nobody had a question."* The decision rested on the claim that nobody was reading the
second screen.

That claim was wrong, and the person who can settle it has said so. Nothing else changed: the
backend never stopped serving `/activity-logs` or `/activity-logs/meta`, with the same
parameters, the same cursor contract and the same entry shape. `docs/backend-tasks.md` §H1 —
worded as a notice rather than a request, and asking that the endpoints not be removed on the
panel's account — is why restoring the screen cost a rebuild rather than a negotiation.

0002 also predicted the cost: *"Restoring it means writing it again. Accepted: the audit log is
the reference implementation, so the cost is a copy, not a design."* This record is about not
paying that cost the way it was predicted.

## Alternatives considered

**Write it again as a second copy, as 0002 predicted.** The cheapest thing to do, and the
version of this change with the shortest diff. Rejected because it would recreate exactly the
liability 0002 named — two screens to keep true as one backend vocabulary changes — while
throwing away the one thing that had been learned in the meantime, which is that the audit
screen's structure is already generic in everything but its nouns.

**Merge them into one screen with an actor-type filter.** 0002 rejected this and it is still
the wrong answer, for its reason and not a new one: *"an operator opens the audit log to answer
'who changed this record, and can I put it back'; the activity log answers 'what has this
student been doing'. Merging them produces a screen where the Revert column is meaningful for a
minority of rows and blank for the rest, and where the default view is dominated by login
events."* Two questions, two screens.

**Keep it deleted and answer the question another way.** There is no other way in this panel:
`LOGIN_REFUSED` and `ACCESS_REFUSED` are recorded nowhere else, and they are the entries an
operator most needs when an account cannot get in. The audit log does not serve them — they
are the student half of the table.

**Share the code by having `activity-logs/` import from `audit-logs/`.** Rejected: a feature
folder that another feature reaches into is not a boundary, and `scripts/check-cycles.mjs`
exists because this codebase has had three cycles inside features already.

## Rationale

**One folder, because the two screens are one screen.** They read two halves of one backend
table separated by `actor.type`, with one set of query parameters and one entry shape. The
audit log's own structure had already been factored that way without anyone intending it:
`LogFilterInputs.tsx` was generic, and had been moved *into* the audit feature only because the
activity screen — its second importer — had been deleted. Moving it back is the whole change in
miniature.

**What differs is a value, not a shape.** `logScreen.ts` holds it: the title, the columns, the
row's summary, the badge colour, whether the actor-type filter is offered, and the wording. A
component that asked "which log am I?" would be the second copy in disguise, and there would be
nowhere to look to find out what the two screens actually disagree about.

**Undoing is expressed by type, not by a flag.** The domain already split `AuditEntry` from
`AuditLog extends AuditEntry`, with the comment *"Only the audit log carries these: what a
student did in the app is not the panel's to reverse."* The activity screen is typed on
`AuditEntry`, which has no `revertible`; `LogDetails` takes a slot and the audit page composes
`RevertSection` into it. A `revertible: boolean` field on the screen record would have implied
the activity screen could have one. It cannot, and now it cannot be given one by accident.

## Consequences

**One folder now serves two screens.** A careless change to `LogRow` changes both. That is the
cost, stated plainly, and it is the cost 0002 chose to avoid by deleting a screen. The layer 3b
resilience matrix covers both screens with a generated case list, which is what makes it
survivable.

**A recorded finding shrank as a side effect of a feature.** Sharing the row meant guarding it,
and guarding it closed `F-028`'s two audit cases — the finding is now open with 12 of its 14,
on four other screens. That is a good outcome and an uncomfortable precedent: a feature commit
changed the status of a defect the project had deliberately deferred. It is written down in
three places rather than discovered later.

**The panel's compiled action list grew by three.** `BUG_REPORT_ISSUE_CREATED`,
`LECTURE_CREATED` and `PROFESSOR_CREATED` were missing — `consumer-findings.md` C-10 — and
restoring one half of the vocabulary carefully while leaving the other three values stale would
have been an odd place to stop.

**`docs/backend-tasks.md` §H1 is withdrawn rather than deleted**, and says what it got wrong.
The backend was told the panel had stopped calling those endpoints; it has not.

**The next reversal is cheaper, and so is the next log.** A third view of the same table — a
refusals-only screen, say — is a `LogScreen` value and a route.

## Sources

`docs/backend-tasks.md` §H1; `docs/admin-api.md` §Audit and §Student activity;
`docs/consumer-findings.md` C-10 and C-11; ADR [0002](0002-delete-the-activity-log-screen.md);
`CHANGELOG.md` — "Removed — the Activity Log screen", and this cycle's entry.
