# 0012 — A model is a module, not a class

**Status:** Accepted
**Date:** 2026-09-09

## Decision

The `model/` packages stay as they are: an exported type describing the data, and
exported functions operating on it, in one module. They are not converted to
classes with methods.

## Context

`src/features/{catalog,feedback,moderation,users}/model/` each hold a data
interface — `ModeratedItem`, `UserEditDraft`, `CatalogDeletion` — plus the
functions that read and transform it. There is not one `class` in `src/features/`.

Read against a checklist, that is the **anemic domain model**: a type with no
behaviour, and the behaviour somewhere else. The criterion is a real one and the
question deserves an answer rather than a shrug, because a reviewer will ask it.

The reason it comes up now is that the same review asks for the Geheimnisprinzip —
each decision encapsulated in one place, and no module handing out a mutable
reference to its internals. Those two are usually taken to point the same way,
towards a class. Here they do not.

## Alternatives considered

**Convert the models to classes.** `ModeratedItem` becomes a class with
`matches(query, status)` and `withReplies(replies)`; `UserEditDraft` gets
`buildUpdate(user, access)`. It satisfies the criterion on its own terms, and it is
what the criterion was written for.

Rejected on what it costs *here*. These objects arrive as JSON from `fetch` and are
held by TanStack Query, which stores, serialises and compares them as plain data. A
class instance that enters the cache comes back out as a plain object, so every
read boundary needs a rehydration step — and every one of those is a place to
forget. React's rendering compares by reference, so a method that returns `this`
changes nothing and a method that returns a new instance changes everything;
neither is what the components want. The gain would be method-call syntax. The cost
would be a serialisation seam at every boundary in the app.

**Convert only the drafts, which never enter the cache.** Half the models as
classes and half as modules, decided by where each object happens to live. That is
a worse rule than either alternative, because it cannot be stated without naming
the cache.

**Keep the modules and say nothing.** What was happening. It leaves the reviewer's
question unanswered and reads as an oversight rather than a decision.

## Rationale

**A module is an encapsulation boundary.** The secret the Geheimnisprinzip asks to
hide is *the decision*, not the syntax used to reach it. `content.ts` owns what a
`ModeratedItem` is **and** every operation on one — the filter that keeps a
comment for the sake of a matching reply, the nesting of answers under parents, the
lookup that resolves a report to its content. Nothing outside that module makes
those decisions. The barrel is the published surface; the module is the unit.

**What "anemic" actually names is a bad thing that is not happening here.** The
anti-pattern is logic *scattered away* from the data — into services, controllers
and screens — so that changing a rule means finding its pieces. The test is not
"are there methods?" but "if this rule changes, how many places must I edit?". For
`narrowContent`, `buildUserUpdate` and `getCatalogDeletion`, the answer is one, and
the module boundary is what makes it one.

**Where behaviour genuinely had leaked, it was moved back** rather than defended.
This ADR is not a licence for the models to stay thin: `getCatalogDeletion` now
picks the deletion call alongside its wording, because `CatalogPage` was making the
same choice a second time over the same discriminant with no exhaustive check. That
is the anti-pattern, and it was a real defect, and it is fixed.

**Immutability is carried by the type system instead.** The other half of the
Geheimnisprinzip — not handing out a mutable reference — is done with `readonly`
collections and frozen singletons, which a class would not have given for free and
which a `private` field with a getter returning the array would have quietly lost.

## Consequences

**The criterion is not met on its own terms**, and a reviewer applying it
mechanically will mark it. That is knowingly accepted, and this record is the
answer: the boundary is the module.

**A function cannot be overridden.** Polymorphism, where the panel needs it, is a
lookup table keyed by a discriminant — `CONTENT_SERVICES`, `AUDIT_ACTION_COLORS`,
`RESPONSE_ERRORS` — rather than a subclass. That is a real limitation, and it is
also why every one of those tables is exhaustive or has an `assertNever` behind it.

**Nothing stops a new model file from being written thin**, with its logic in the
component. The check that catches it is review, not the compiler.

**The one place classes *are* used stays.** `src/api` is class-based —
`HttpService`, `ModerationService<TItem, TReport>`, the error hierarchy — because
those have state, inheritance and genuine subtype polymorphism. The distinction is
deliberate: services are objects, models are modules.

## Sources

New decision, prompted by the Entwurf criteria. The behaviour that *had* leaked out
of the models is recorded in `CHANGELOG.md` under the Entwurf pass.
