# Test findings

The defects the unit test batches turned up, in one place. [test-plan.md](test-plan.md)
describes what is tested and how; this document holds only **what the tests found** and
where each finding stands.

Every finding is given together with the name of the test that pins it: a finding is only
really recorded if it lives in a test.

> **Class names and line numbers below are as they were when the finding was made.** A
> single-responsibility refactor has since split most of the large services, and these entries
> have deliberately not been rewritten: an entry that says where a defect *was* is a record,
> and editing it to name a class that did not exist then makes it a worse one.
> [test-plan.md](test-plan.md#the-single-responsibility-refactor) carries the old-to-new
> mapping. The findings themselves, and the tests that pin them, all moved with their code and
> are all still green.

## At a glance

**50 findings. 44 fixed, 2 closed as a recorded decision (P-3, P-7), 1 an existing protection
put under test (F-13), 1 documented rather than changed (F-30), 2 open — F-29, which needs a
rotation rather than a commit, and F-34, which needs a product decision.** Two of them — F-7
and F-8, both behind the "approximate location does not work" report — are the ones a *user*
reported. The other forty-eight nobody had seen.

**Two of the last three had been shipped and broken for the whole life of the product**, and
neither produced a signal anywhere: F-39 left the admin panel unable to sign anybody in, and F-40
meant every answer report the Android app ever filed was refused while the user was told it had
been sent. Both were found by reading the two consumer repositories' audits against this code,
with the suite green the entire time. That gap is what the consumer contract layer now covers.

Which kind of work turned each one up, because that is the part worth knowing when deciding
what to write next:

| Found by | How many | Which |
|---|---|---|
| **Unit tests** (batches 1–7) | 12 | BUG-3, F-1, F-2, F-3, F-5, F-7, F-9, F-10, F-11, F-12, F-13, F-18 |
| **API / role sweeps** (MockMvc, whole-route) | 4 | F-14, F-15, F-16, F-17 |
| **Contract layer** (OpenAPI schema vs. responses) | 1 | F-19 |
| **Integration layer** (real PostgreSQL) | 1 | P-5 |
| **End-to-end layer** (real HTTP, real database) | 1 | F-20 |
| **Reading the code while writing the tests** — no test run found these | 4 | F-4, F-6, F-8, F-21 |
| **Reading the code against a list of known defect shapes** — the 9 September pass | 7 | F-22, F-23, F-24, F-25, F-26, F-27, F-28 |
| **Sweeping those same shapes to the end** — the Kontrollphase pass | 7 | F-31, F-32, F-33, F-34, F-35, F-36, F-37 |
| **Measuring a gap an earlier finding had parked** | 1 | F-38 |
| **Consumer contract audit** — the two client repositories' contracts, read against this code | 3 | F-39, F-40, F-41 |
| **Secret scanning, once the rules matched this project** | 1 | F-29 |
| **Static analysis, run for the first time** | 1 | F-30 |
| **Concurrency layer** (two requests at once, real PostgreSQL) | 0 | — see [Negative results](#negative-results) |
| **Doing the measuring** — process findings about the suite itself, its own assertions, and its documentation | 7 | P-1, P-2, P-3, P-4, P-6, P-7, P-8 |

**The two rows of seven are the same method run twice.** The first was the 9 September pass;
the second finished it. Every one of the five shapes had been found once and searched in one
place — F-23 in a single class, F-26 on a single field, F-21 and F-27 in two spots each — and
sweeping each one across the module turned up seven more defects and closed two shapes for
good. The parse shape came back **nearly clean** (11 of 15 sites already guarded both failure
modes) and the `200 {"success": false}` shape came back down to one reachable instance, which
is the result worth having: a shape is finished when its coverage is written down, not when
somebody stops looking.

The row of seven above is the 9 September pass and it was not a new test layer: two of the seven were
already written down in the backlog, and the other five were found by taking each one's *shape*
— a status code that disagrees with its neighbours, an unguarded parse of caller input, a
collection with no order — and looking for the same shape elsewhere. F-23 and F-26 are the two
worth remembering. Both were **regressions of a fix the repository had already made**: the null
guard existed twenty lines above the crash and had not been mirrored, and `averageRating` was
moved to recompute on read while `ratingCount` beside it was left reading a column nothing
writes. A defect that has been fixed once is a defect worth grepping for.

That row of four is worth stopping on. It is the second-largest source, and none of those
four would have been caught by running anything: F-6 was seven methods with no caller, F-4 was
a route mapping missing its slash, and F-21 was a `Set` whose order nothing had needed to be
stable until a feature asked for it. Writing tests finds defects partly by making somebody read
the code closely enough to see them — and P-6 is the same effect turned on the tests
themselves, an assertion that could not fail, found by reading it rather than by running it.

And the shape of the list shifts by layer. The unit batches found **logic** — a wrong
comparison, a missing null check, an exception escaping a listener. The sweeps found **protocol**:
F-14 through F-17 are all "the right thing happened, with the wrong status code", and each was
wrong on every route at once rather than on one. The contract and end-to-end layers found
**gaps between the API and its own description** — a schema that declared a nullable field
non-nullable, a create that wrote no audit entry. Adding a layer did not find more of the same
defect; it found a different kind.

---

## Summary

| # | Finding | Impact | Status |
|---|---|---|---|
| [BUG-3](#bug-3--professor-assignment-order-silently-refuses-a-revert) | Professor assignment order refuses a revert | High — looks flaky to the user | **Fixed** |
| [F-1](#f-1--voting-writes-no-audit) | Voting writes no audit | High — moderation blind spot | **Fixed** |
| [F-2](#f-2--votetype-is-not-validated) | `voteType` is not validated, `null` turns into a 409 | Medium — wrong HTTP code | **Fixed** (`43e923b`) |
| [F-3](#f-3--a-vote-cannot-be-withdrawn) | A vote cannot be withdrawn (no toggle-off) | Medium — product gap | **Fixed** (`VoteType.NONE`) |
| [F-4](#f-4--the-slash-is-missing-from-the-voteanswer-route) | The slash is missing from the `/vote/answer` route | Medium — wrong route | **Fixed** (API/role batch) |
| [F-5](#f-5--failures-come-back-with-http-200) | Failures come back with HTTP 200 | Medium — silent error | **Fixed** |
| [F-6](#f-6--studentservices-second-moderation-path) | `StudentService`'s second, weaker moderation path | High — protections could be bypassed | **Fixed** (deleted) |
| [F-7](#f-7--normalizeip-crashed-on-a-lone-comma) | `normalizeIp` crashed on a lone comma | Medium — error in the login email | **Fixed** (`8fc2901`) |
| [F-8](#f-8--silent-failure-when-ipinfo_token-is-empty) | Silent failure when `IPINFO_TOKEN` is empty | Medium — undiagnosable | **Fixed** |
| [F-9](#f-9--a-write-inside-a-readonly-transaction) | A field write inside a `readOnly` transaction | Low — an integration question | **Fixed** (write removed) |
| [F-10](#f-10--typos-going-out-to-the-client) | Typos going out to the client | Low — cosmetic, but contract | **Fixed** (`edaf2bc`, `57658c3`) |
| [F-11](#f-11--a-checkapply-race-in-warning-reverts) | A check/apply race in warning reverts | Low — rare | **Fixed** (the refusal, not the race) |
| [F-12](#f-12--a-needless-administrator-query-on-an-empty-target-list) | A needless administrator query on an empty target list | Very low | **Fixed** |
| [F-13](#f-13--token-revocation-hangs-on-a-single-condition) | Token revocation hangs on a single condition | Info — the protection exists | Put under test |
| [P-7](#p-7--a-surviving-mutant-is-not-a-finding) | A surviving mutant is not a finding | Process — how to read the mutation report | **Closed — recorded as a reading rule** |
| [F-14](#f-14--500-when-a-required-query-parameter-is-missing) | 500 when a required query parameter is missing | Medium — wrong HTTP code | **Fixed** |
| [F-15](#f-15--500-for-the-category-list-of-an-unknown-lecture) | 500 for the category list of an unknown lecture | Medium — wrong HTTP code | **Fixed** |
| [F-16](#f-16--the-wrong-http-method-returns-404-instead-of-405) | The wrong HTTP method returns 404 instead of 405 | Medium — wrong HTTP code, on every mapped route (122 at the time; see `docs/TODO.md` item 28) | **Fixed** |
| [F-17](#f-17--an-unsupported-media-type-returns-500-instead-of-415) | An unsupported media type returns 500 instead of 415 | Medium — wrong HTTP code, on every route that reads a body | **Fixed** |
| [F-18](#f-18--the-project-id-reaches-gitlab-encoded-twice) | The GitLab project id reaches the tracker encoded twice | High — the integration is dead for a path-shaped id | **Fixed** |
| [F-19](#f-19--two-audit-response-fields-are-null-by-design-and-the-schema-said-otherwise) | Three audit response fields are null by design, declared non-nullable | Medium — the API contradicts its own schema | **Fixed** |
| [F-20](#f-20--creating-a-lecture-or-a-professor-was-not-audited) | Creating a lecture or professor wrote no audit entry | Medium — a hole in the administrative record | **Fixed** |
| [F-21](#f-21--the-professor-list-of-a-lecture-comes-back-in-a-different-order-each-time) | A lecture's professor list has no stable order | Medium — any title built from it reshuffles | **Fixed** |
| [F-22](#f-22--the-two-catalogue-detail-reads-answer-200-for-a-row-that-is-not-there) | `GET /data/lectures/{id}` and `/data/professor/{id}` answer 200 for a missing row | Medium — F-5's direction, two routes short | **Fixed** |
| [F-23](#f-23--reverting-a-refusal-answers-500) | Reverting a `LOGIN_REFUSED` / `ACCESS_REFUSED` entry answers 500 | High — a 500 on a button the panel shows | **Fixed** |
| [F-24](#f-24--the-four-social-submit-routes-answer-500-for-a-bad-or-missing-id) | The four `/social` submit routes answer 500 for a bad or missing id | Medium — the caller's fault, reported as ours | **Fixed** |
| [F-25](#f-25--two-more-unvalidated-request-bodies) | `POST /ratings/rate` and `POST /data/lectures` answer 500 for a missing field | Medium — same shape as F-24 | **Fixed** |
| [F-26](#f-26--ratingcount-on-a-professor-is-always-0) | `ratingCount` on a professor is always 0 | Medium — a field that has never been right | **Fixed** |
| [F-27](#f-27--the-rating-categories-come-back-in-a-different-order-each-run) | `GET /ratings/{lectureId}` orders its categories by identity hash | Medium — F-21's shape, on a public read | **Fixed** |
| [F-28](#f-28--submitting-a-rating-for-an-unknown-lecture-answers-200) | `POST /ratings/rate` answers 200 for an unknown lecture | Low — the last route on the old convention | **Fixed** |
| [F-29](#f-29--three-more-leaked-credentials-nobody-had-found) | Three more leaked credentials, in commits the rotation list did not name | High — unrotated, and one is in a document | **Open — needs a rotation at the provider, not a commit** |
| [F-30](#f-30--a-rate-limiter-that-is-only-correct-because-a-clock-in-another-file-is-utc) | The rate limiter is correct only because `TimeConfig` is UTC | Low today — a landmine under an unrelated change | **Documented** |
| [P-1](#p-1--the-coverage-baseline-number-was-wrong) | The coverage baseline number was wrong | Process | **Fixed** (re-measured) |
| [P-2](#p-2--integration-tests-hide-unit-targets) | Integration tests hide unit targets | Process | **Fixed** (method changed) |
| [P-3](#p-3--lombok-is-not-filtered-in-jacoco) | Lombok is not filtered in JaCoCo | Process | **Closed — decided against** |
| [P-4](#p-4--a-moved-test-file-was-copied-not-moved) | A "moved" test file was copied, not moved | Process | **Fixed** (duplicates deleted) |
| [P-5](#p-5--coverage-measured-without-clean-is-not-the-coverage-ci-measures) | Coverage measured without `clean` is inflated by the previous run | Process | **Fixed** (figures re-measured) |
| [F-31](#f-31--reverting-a-report-status-is-impossible-on-exactly-the-changes-worth-reverting) | Report-status reverts refused on every `ACTION_TAKEN` transition | High — the revert button cannot work where it matters | **Fixed** |
| [F-32](#f-32--each-catalogue-create-path-had-one-half-of-trim-then-check-then-store) | Each catalogue create path had one half of "trim, then check, then store" | Medium — a 409 one space away from being bypassed | **Fixed** |
| [F-33](#f-33--nobody-records-who-dealt-with-a-bug-report-and-a-guard-reads-that-column) | Nobody records who dealt with a bug report, and a guard reads that column | Medium — F-26's shape; a demotion guard one third blind | **Fixed** |
| [F-34](#f-34--a-route-the-security-chain-declares-and-no-controller-implements) | `PATCH /social/notifications/all` is declared and not implemented | Low — a half-built feature | **Open — a product decision** |
| [F-35](#f-35--four-more-lists-reaching-the-client-with-no-defined-order) | Four more lists reaching the client with no defined order | Medium — F-21/F-27's shape, unswept | **Fixed** |
| [F-36](#f-36--an-audit-value-the-code-no-longer-understands-crashes-the-revert) | An unreadable audit value answers 500 on revert | Medium — F-23's failure, one refactor away | **Fixed** |
| [F-37](#f-37--post-authvalidate-reported-an-authorization-failure-with-200) | `POST /auth/validate` reported an authorization failure with 200 | Medium — F-5's last instance | **Fixed** |
| [F-38](#f-38--a-body-over-the-upload-size-limit-answered-500) | A body over the upload size limit answered 500 | Medium — wrong status, seen in production logs | **Fixed** |
| [F-39](#f-39--get-authme-was-unmapped-and-the-admin-panel-could-not-sign-anybody-in) | `GET /auth/me` was unmapped; the admin panel could not sign anybody in | **Blocker** — a shipped client locked out, silently | **Fixed** |
| [F-40](#f-40--post-answersreport-was-never-served-and-every-report-from-the-app-failed-silently) | `POST /answers/report` was never served; every report from the app failed silently | **High** — a feature that has never worked on any release | **Fixed** |
| [F-41](#f-41--get-accountratings-served-its-ratings-in-no-defined-order) | `GET /account/ratings` served its ratings in no defined order | Medium — F-21's shape, on the list its sweep missed | **Fixed** |
| [P-8](#p-8--admin-apimd-drifted-four-times-and-nothing-noticed) | `admin-api.md` drifted from the code four times with no mechanism | Process | **Fixed** (under test) |
| [P-6](#p-6--a-sweep-asserted-not-refused-which-a-404-also-satisfies) | A sweep asserted "not refused", which a `404` also satisfies | Process | **Fixed** |

**F-42 has a number but is not one of the fifty.** It is a defect in the admin panel that this
API cannot pin with a test, recorded [at the end of the findings](#f-42--deactivating-a-catalogue-row-hides-it-from-the-only-list-the-panel-reads)
with the reason it is not an entry.

**Two entries are open: F-29, which no commit can close, and F-34, which is a product
decision rather than a defect.** Everything else is fixed or closed by a recorded decision.
Twelve were closed in one pass; P-5 came later from the
integration layer, F-19 and F-20 later still from the end-to-end work, and F-21 and P-6 last of
all — neither from a test run: one from asking what a still-open feature request would
actually need, the other from reading a sweep back against the routes it walks. What each one's
**Status** records is either the fix or, for P-3 alone, the decision not to make one. Four
changed a client-visible contract — F-3, F-5, F-16 and F-20 — and each was closed deliberately
rather than quietly; each says below what a client sees differently.

BUG-1 and BUG-2 (the cursor and approximate-location bug reports) are in
[test-plan.md](test-plan.md#findings); neither was reproducible on the backend and they stay
there. BUG-1 has since been driven through all four cursor endpoints against a real PostgreSQL
and did not reproduce there either — see [Negative results](#negative-results).

Three sweeps have now run and raised nothing — ownership/IDOR, the cursor endpoints, and the
read-only transaction sweep. What each covered is written down under
[Negative results](#negative-results), because a sweep that finds nothing is only worth
something if its coverage is recorded; two of the three also say how they were checked against
a defect they were meant to catch, since a green sweep and a sweep that cannot fail look alike
from outside. F-18 comes from batch 5 instead: the first defect found by a *unit* test in
several batches, and the only one so far that would have taken a feature down completely rather
than answering with the wrong status code.

---

## Code defects

### BUG-3 — Professor assignment order silently refuses a revert

**Where.** `CatalogueRevertHandler.LectureHandler.currentValues` (the read side) and
`ModerationCatalogService.updateLecture` (the write side).

**What happens.** `Lecture.professors` is a `Set<Professor>` — a type that defines no order —
but the handler turns it into an **ordered** `List`. `RevertValues.sameValue` compares two
collections through `asStrings(left).equals(asStrings(right))`, that is, position by
position. The result: a lecture whose professor assignment never changed gets marked
`VALUE_CHANGED` and **refuses a legitimate revert**, purely because the set's iteration order
does not match the order written into the audit JSON.

On the write side the same sensitivity works in the opposite direction: `updateLecture` builds
`before` from the `Set` and `after` from the order of `professorRepository.findAllById(...)`
and compares them with `!before.equals(after)` — so an unchanged assignment can write a
**bogus** `professors` change and a bogus audit event.

**Why it is serious.** `Professor` overrides neither `equals` nor `hashCode`, so identity
hashing is used and `HashSet` bucket distribution depends on object addresses. The order can
differ **on every run**. That is why the defect looks flaky in production: the same edit
reverts once and does not the next time. This is the most likely cause of a bug report that
cannot be reproduced.

**Tests.**
```
CatalogueRevertHandlerTests
  lectureHandler_currentValues_professorAssignment_carriesTheOrderOfAnUnorderedSet
  lectureHandler_professorAssignmentInAnotherOrder_comparesAsChangedByRevertValues
```
The test does **not** rely on real `HashSet` order: such a test would be flaky, and the
flakiness would be written into the test rather than into the defect. The defect was split
into two deterministic facts — with a `LinkedHashSet` fixture, that the handler produces an
order the declared type does not define, and that `sameValue` counts the same two elements in
reverse order as different (while they are equal as sets).

**Status. Fixed.** Both sides compare as multisets now.

`RevertValues.sameValue` sorts before comparing, and the scope of that change is exactly two
fields: a lecture's `professors` and a professor's `lectures` are the only collection-valued
things the audit records, and both are read out of a `Set`. It is sorted rather than
de-duplicated on purpose — dropping one of two identical entries is still a change, and a set
comparison would have called that pair equal. `ModerationCatalogService` got the same
treatment in `updateLecture` and `reassignLectures`, through one `sameAssignment` helper.

The two deterministic tests were inverted rather than deleted, which is the point of having
written them that way: neither depends on real `HashSet` order, so they state the fixed
behaviour as reliably as they stated the broken one.
`ModerationCatalogServiceTests.updateLecture_sameProfessorsInAnotherOrder_recordsNoChange` now
also asserts that **no audit event is written at all** — the bogus change and the bogus event
were two halves of the same defect.

---

### F-1 — Voting writes no audit

**Where.** `SocialService.voteComment`, `SocialService.voteAnswer`.

**What happens.** `submitComment`, `submitAnswer` and `submit*Report` in the same class all
call `auditWriter.writeStudentAction(...)`. The two vote methods do not. So **vote
manipulation does not appear in the moderation trail at all** — an account flipping hundreds
of votes leaves no trace on the audit side.

**Test.** `SocialServiceVoteTests` — `AuditWriter` was deliberately passed as `null` rather
than a mock in that test; the tests passed because the two methods never touched it, and the
moment they started to, it threw an NPE. `AuditWriter` being on that list *was* the finding.

**Status. Fixed.** `COMMENT_VOTED` and `ANSWER_VOTED` are new `ACTIVITY`-scoped
`AuditAction`s — activity, not administrative, and deliberately **not** in
`AuditRevertService.REVERTIBLE_ACTIONS`: a vote has no "before" to restore. The column is
`@Enumerated(EnumType.STRING)` with no check constraint behind it, so adding them is not a
schema change, and the admin API's action lists are computed from the enum rather than
listed, so they pick the two up on their own.

The direction travels as metadata (`{"vote": "UP"}`) rather than as a change set, for the
same reason: a first vote and an overwrite are the same action from the log's point of view.
A **withdrawal** is recorded too — `{"vote": "NONE"}`, see F-3 — and it is the entry a
manipulation case most needs to see.

Both methods are `@Transactional` now. `AuditWriter` joins the caller's transaction on
purpose, so without one a vote could commit while its entry did not, which is the same blind
spot in a smaller window. `AuditWriter` is a mock in `SocialServiceVoteTests` rather than a
null, and a refused vote is asserted to write nothing.

---

### F-2 — `voteType` is not validated

**Where.** `SocialService.voteComment`, `SocialService.voteAnswer`.

**What happens.** A `null` vote type travels unchecked all the way to `setVote(null)` and is
handed to `save`. The method returns `success = true`. The only thing that stops it is the
`nullable = false` column on `comment_votes.vote` — and only **at flush time**, outside a
transaction this method opened (neither method is `@Transactional`).

**Consequence.** `DataIntegrityViolationException` → `GlobalExceptionHandler:69` → **HTTP 409
"State conflict"**. The client gets a 409 where it expects a 400 for a malformed request, and
the message does not say which field is at fault.

**Tests.**
```
SocialServiceVoteTests
  voteComment_nullVoteType_isSavedAsANullVoteRatherThanRejected
  voteAnswer_nullVoteType_isSavedAsANullVoteRatherThanRejected
```

**Status.** **Fixed** — commit `43e923b`.

`VoteCommentRequest.voteType` and `VoteAnswerRequest.voteType` got `@NotNull`, and both
handlers became `@Valid @RequestBody`. Every endpoint in the codebase that validates does it
this way, and `AddLectureRequest` already carried exactly this pattern on an enum field
(`@NotNull SemesterSeason`). `GlobalExceptionHandler` turns the violation into **400 "Invalid
request"**.

**No guard was added to the service**: validation stays at the boundary. The reason is that no
method in `SocialService` throws (F-5) — putting an `ApiException` in the service would
introduce a second error contract into the class, and the service's only caller is this
controller.

The new tests are in `SocialApiIntegrationTests`:
`voteWithoutAVoteTypeIsRejectedAsABadRequest` (both an explicit `null` and the field being
absent), `votingOnAnAnswerWithoutAVoteTypeIsRejectedAsABadRequest`, and
`aVoteCarryingAVoteTypeIsStillAccepted` — the last one shows that the guard does not reject a
legitimate vote.

The two tests in `SocialServiceVoteTests` were not deleted, only renamed:
`voteComment_nullVoteType_reachesSaveBecauseValidationLivesAtTheBoundary` (and its `voteAnswer`
twin). The service still does not validate, and the tests now say so — and if a caller that
skips the boundary ever appears, these are the only record standing between it and the
constraint violation at flush.

Verification: with `@NotNull` temporarily removed, the new test goes red with
`Status expected:<400> but was:<409>` — so the defect was exactly as described and the test
really does catch it.

---

### F-3 — A vote cannot be withdrawn

**Where.** `SocialService.voteComment`, `SocialService.voteAnswer`, `VoteType`.

**What happens.** A second vote in the same direction rewrites the same value instead of
removing the vote. `VoteType` has only `UP` and `DOWN`; there is no third value (`NONE`) and
no delete path for removal. **A user cannot take back a vote.**

**Test.** `SocialServiceVoteTests.voteComment_repeatedIdenticalVote_isRewrittenRatherThanToggledOff`

**Status. Fixed** — with an explicit withdrawal rather than a toggle.

`VoteType` gains a third value, `NONE`, and it is a **withdrawal rather than a third
direction**: the vote row is deleted, so nothing ever stores it and `comment_votes.vote` can
stay `nullable = false`. Withdrawing a vote that was never cast is not an error.

The choice between the two possible fixes is the part worth recording. A toggle — a second
identical vote clears the first — would have changed what an existing client's retry does,
silently, on a request shape that already works. `NONE` is additive: a client that only ever
sends `UP` or `DOWN` cannot tell the difference, and the boundary needed no change either,
since `@NotNull` on the request already accepts any `VoteType` value. So the old
characterization test stays as it is, now describing a deliberate contract rather than an
accident: repeating an identical vote still rewrites it.

---

### F-4 — The slash is missing from the `/vote/answer` route

**Where.** `SocialController:95`.

**What happens.**
```java
@PostMapping("/comments/vote/answer{answer_id}")   // no slash
```
Because the class carries `@RequestMapping("/social")`, the real route becomes
`/social/comments/vote/answer<id>` — for example
`/social/comments/vote/answer7c9e6679-7425-40de-944b-e07fc1f90ae7`.
The sibling endpoint on the comment side (`:71`) is written correctly:
`/comments/vote/comment/{comment_id}`.

**Why the tests did not catch it.** This is a controller defect; the unit layer tests the
service, not route binding. No test makes an HTTP request to the vote endpoint — the finding
came out of reading the vote path.

**The whole class was swept — this is the only instance.** To check whether the route was a
class-wide defect, **all 110 verb+path routes** across 19 controllers were swept: there is no
other mapping missing its separator before a path variable.

The sweep checked three more things, none of which turned anything up: double slashes (0),
trailing slashes (0), and ambiguous (same verb + same path) mappings (0).

The one neighbouring point found during the sweep — not a defect:

- The method path at `RatingController:55` is `"own/{lectureId}"`, that is, with no leading
  slash. Spring inserts the separator itself when combining it with the class prefix, so the
  route works correctly (`/ratings/own/{lectureId}`). It is just written differently from the
  rest of the codebase.

So the sweep itself is repeatable: a sweep that does not account for the **array form** of a
class-level `@RequestMapping` (`@RequestMapping({"/admin/users", "/users"})`) produces six
false collisions — all the moderation controllers use that form.

**Status.** **Fixed** — in the API/role batch. The route is now
`POST /social/comments/vote/answer/{answer_id}` (`SocialController:96`).

The old route is **not served**: knowing it is a breaking change, the clean fix was chosen
over serving both routes for a while. Until a release that uses the new path ships, the
Android client gets a **404** on the vote call — the client change has to land with this.
Nothing changes on the authorization side: the route stays under the
`/social/comments/vote/**` matcher, so voting still requires a session.

---

### F-5 — Failures come back with HTTP 200

**Where.** `StudentService`, `AccountService`, `SocialService` — none of the three throws.

**What happens.** Every failure comes back as `BasicResponse(message, success = false)` and is
served with HTTP 200. A student that is not found, a comment that is not found, an account
that cannot be deleted — all of them are "successful" responses. A caller that only looks at
the HTTP status or at thrown errors mistakes a broken lookup for a successful one.

For comparison: `ModerationCatalogService` throws `ApiException` in the same situations and
`GlobalExceptionHandler` turns those into 400/404. So **two different error contracts** sit
side by side in the codebase.

**Tests.** This is why the negative-path tests are written against `response.success()` and
`response.message()` rather than `assertThatThrownBy` — if that is the contract, the test has
to pin it:
```
StudentServiceTests
  getUserInformation_unknownStudent_returnsTheAuthenticationFailureShape
  getUserRatings_unknownStudent_returnsTheAuthenticationFailureWithAnEmptyList
  deleteAccount_nullStudent_returnsTheAuthenticationFailure
  deleteAccount_emailNotInTheTable_returnsTheNotFoundFailureWithoutWriting
SocialServiceVoteTests
  voteComment_unknownComment_returnsAFailureWithoutTouchingTheVoteTable
  voteAnswer_unknownAnswer_returnsAFailureWithoutTouchingTheVoteTable
```

**Status. Fixed.** Nine failure sites across `StudentService` and `SocialService` throw
`ApiException` now — 404 for the lookups, 401 for `deleteAccount` with no principal at all.
`AccountService` only delegates and was not touched.

**What a client sees change is the status code and nothing else.** `ApiErrorResponse` is
`BasicResponse` plus a `reason` that is omitted when null, so the body a caller parses is
byte-identical: same `message`, same `success: false`. That is what made the largest of these
findings a small change. The one exception is `getUserInformation` and `getUserRatings`, whose
failure bodies used to carry the rest of the record's shape alongside the message — nulls and
an empty list — and now carry only the message.

The side note is fixed with it: `getUserInformation` said `"Error, cannot authenticate user"`
for a student that was not found, when authentication had already succeeded in the security
chain and all that failed was a row lookup. It says `"Student not found"`.

Fifteen tests pinned the old contract deliberately and all fifteen were rewritten — which is
the outcome this entry predicted, and the reason the change could not happen silently. One of
them asked for it in its own failure message:
`ApiOwnershipMatrixTests.markingAnotherStudentsNotificationAsSeenDoesNotTouchTheRow` said *"the
refusal now has a status of its own -- update this assertion and F-5"*. It still asserts the
untouched row first and the status second: a status is evidence about the answer, not about
the table.

**Closed out on 8 September: the last four sites.** The fix above left `LectureService` and
`ProfessorService` alone, because four characterization tests pinned the old answers there and
the change was parked in the backlog behind a heavier refactoring that had not been scheduled.
Parking it had a cost that was not obvious when the decision was made: `admin-api.md:572`
described the duplicate-name failure as *"`409`-shaped as `{"success":false}`, not an HTTP
`409`"* — so the panel team was being handed the old contract in writing, in the document that
is meant to be authoritative, for as long as the item stayed open.

The four sites now throw like the other nine:

```
POST /data/lectures    duplicate name          200 -> 409
POST /data/lectures    unknown professorId     200 -> 404
POST /data/professor   duplicate first+last    200 -> 409
POST /data/professor   unknown lectureID       200 -> 404
```

Bodies unchanged in all four, message text included — the same property that made the first
nine a small change. `CHANGELOG ///// 8.09 (5)` carries it, in the same commit as the code.

The four characterization tests were **inverted, not deleted**: they now state the intended
contract instead of the accident, in the `assertThatThrownBy(...).extracting(getStatus)` shape
`ModerationCatalogServiceTests` already used. Each was watched fail against a deliberately
wrong status before being left green — a test that asserts a status code but reads the body is
green either way, and there is no way to tell those apart without breaking it once.

Two audit-silence tests were caught by the same change and are worth naming, because the
handling differed. `addLectureRecordsNothingWhenItRefuses` and its professor twin both proved
"a refused creation writes no audit entry" *through* one of these failures, so both had to
move; neither was deleted, because the property they prove is unrelated to the status code.
A third test, `addLectureFailsWhenStudentIsNotAdmin`, **was** deleted — it pinned the
unreachable role check that came out in the same pass, which is dead code rather than
behaviour, and the security chain's `403` is already covered by `ApiAuthorizationMatrixTests`.

---

### F-6 — `StudentService`'s second moderation path

**Where.** `StudentService` — `deleteUser`, `blockStudent`, `unblockStudent`,
`findByKitEmail`, `addStudent`, `getAllUsers`, `getUser`.

**What was happening.** None of the seven methods had a caller anywhere in `src/`. The code
was asking the question itself: `//TODO: Why arent they in use?`.

The danger was less that they were dead code and more **what they did not do**. The live
administrator flow is `ModerationUserService` (`blockStudent:591`, `unblockStudent:617`), and
that one also does:

- `protectAdministrator(...)` — stops an administrator from being blocked
- an idempotency short-circuit
- the `blockedAt` / `blockedReason` bookkeeping
- `revokeTokens(target)` — closes the blocked account's sessions
- `auditWriter.write(... USER_BLOCKED ...)`

`StudentService`'s copies did **none** of that; only `setStatus` + `save`. So if one of these
methods were ever wired to a controller: no token revocation, no audit record, no administrator
protection — and no test would have noticed.

**Why deletion rather than tests.** Writing tests would have nailed down a second, quietly
weaker moderation path that nobody depends on, at the very moment the code is being reduced to
a single path.

**Status.** **Fixed.** The seven methods were deleted, and the unused
`import com.pse.user.service.StudentService;` in `RatingService` was removed as well.
`StudentService`'s only consumer in `src/main` is now `AccountService`, and it uses exactly
three methods.

---

### F-7 — `normalizeIp` crashed on a lone comma

**Where.** `LoginLocationService.normalizeIp`.

**What was happening.** `","` (an `X-Forwarded-For` consisting of nothing but a comma) took the
method down with an `ArrayIndexOutOfBoundsException`: Java's `split(",")` drops trailing empty
pieces, so the array came back empty and `[0]` blew up. Because `normalizeIp` runs **before**
the broad `try` block, this was the one input `catch (Exception)` did not catch — the exception
escaped `getLoginLocation` and surfaced as an uncaught error in the login email sent from the
`AFTER_COMMIT` listener. The login itself kept succeeding.

**Fix.** `rawIp.split(",", -1)` — the negative limit keeps empty pieces, so the result is
`[""]` and falls into the existing blank check.

**Test.** `LoginLocationServiceTests.getLoginLocation_addressOfOnlyCommas_returnsUnknownWithoutCallingIpInfo`

**Status.** **Fixed** — commit `8fc2901`.

---

### F-8 — Silent failure when `IPINFO_TOKEN` is empty

**Where.** `LoginLocationService.getLoginLocation`.

**What happens.** If `ipinfo.token=${IPINFO_TOKEN:}` falls back to empty, `getLoginLocation`
returns `"Unknown"` through `ipInfoToken.isBlank()` without making any HTTP call at all. This
is the most likely production cause of approximate location "not working any more", and it was
leaving **no trace whatsoever** per request.

**Fix.** `warnIfTokenMissing()` (`@PostConstruct`) now logs a WARN once at startup. Swallowed
exceptions are logged with a stack trace too, so 401/403/429 and timeouts can now be told apart
in the logs.

**Status. Fixed** — in two parts, because a log line could only ever do half of it.

The broad `catch (Exception)` is split into `RestClientResponseException` (logged **with the
status**, so a revoked token at 401/403 and an exhausted quota at 429 are distinguishable),
`ResourceAccessException` (network or timeout), and the catch-all. Six existing tests already
drove those six failure modes and asserted one generic sentence for all of them; each now
asserts its own.

The part a log cannot do is that a token revoked *after* startup leaves nothing but 401 WARNs
somebody has to go looking for. `LoginLocationService.isConfigured()` is reported as
`locationLookupEnabled` in `GET /system/status`, next to `gitlabEnabled` and for the same
stated reason — the panel shows the integration is off rather than the operator discovering it
by pressing the button, or here, by reading every login mail and noticing they all say
"Unknown". A per-request warning is still deliberately not added; that was never the fix.

---

### F-9 — A write inside a `readOnly` transaction

**Where.** `StudentService.getUserInformation`.

**What happens.** The method is `@Transactional(readOnly = true)` but calls
`student.setCredibilityScore(credibilityScore)` inside it — that is, it mutates a managed
entity inside a transaction intended for reading. The score is a computed value; it does not
look like it is meant to be persisted, but what dirty checking will do in a real persistence
context is not evident from the code.

**Why a unit test could not settle it.** There is no such thing as dirty checking against a
mocked repository; the behaviour is Hibernate's and the `readOnly` flag's business.

**Status. Fixed** — by removing the write, which closes the finding here rather than deferring
it. With no mutation there is no dirty-checking question to settle, so this no longer waits on
the integration layer. The computed score still reaches the response; nothing a caller sees
changes.

What the fix turned up is worth more than the finding was. The column is not scratch space:
`ModerationUserService` lets an administrator set `credibilityScore`, `UserRevertHandler`
reverts it, and the admin listing reads it. So the assignment was not only a write in a read
— it aimed at a value somebody else owns, and, if dirty checking did flush it, a student
opening their own profile would silently undo an administrator's adjustment.
`StudentServiceTests.getUserInformation_derivedScore_isReportedWithoutBeingWrittenBackToTheEntity`
pins both halves: the reported value is computed, the stored one is left alone.

---

### F-10 — Typos going out to the client

**Where.** `StudentService.deleteAccount`.

```
"Error, couldnt authenticate user"      // couldn't
"Error, couldnt find student"           // couldn't
"Deleted Account succesfully: ..."      // successfully
```

These strings go to the client inside `BasicResponse.message`, so they can appear in the user
interface.

**Status.** **Fixed** — commit `edaf2bc`. Three strings corrected:

```
"Error, couldn't authenticate user"
"Error, couldn't find student"
"Deleted Account successfully: ..."
```

The `StudentServiceTests` assertions that pin these strings were updated in the same commit —
they exist precisely so the text cannot change silently, which means they have to change with
it. `AccountServiceTests` also stubs `StudentService`'s failure message, so that stub moved
too; leaving it would have documented a string that no longer exists.

Two of the three are gone again since: F-5 replaced both `deleteAccount` failures with thrown
`ApiException`s, so `"Error, couldn't authenticate user"` and `"Error, couldn't find student"`
no longer exist as response text. The correction was not wasted — it was right for as long as
those strings were the contract — but the entry above would otherwise send a reader looking for
them.

**The remaining five are closed too** — commit `57658c3`. The same typo appeared in eight
places in `src/main`; the first commit covered only the three in `deleteAccount`, the second
one the rest:

| Location | Before | After |
|---|---|---|
| `ProfessorController:55` | `couldnt authenticate Admin` | `couldn't authenticate Admin` |
| `RatingService:168` | `couldnt find rating for Lecture: ` | `couldn't find rating for Lecture: ` |
| `SocialService:184` | `couldnt finde comment` | `couldn't find comment` |
| `SocialService:257` | `couldnt finde comment` | `couldn't find comment` |
| `SocialService:299` | `couldnt find answer` | `couldn't find answer` |

The two `SocialService` messages also said `finde`, so they did not just gain an apostrophe but
went back to `find`. The two tests that pin `ProfessorController`'s message
(`ProfessorControllerTests:119`, `ProfessorApiIntegrationTests:450`) were updated along with it;
no test asserted the `RatingService` and `SocialService` strings.

`src/main` now contains neither `couldnt` nor `finde`.

---

### F-11 — A check/apply race in warning reverts

**Where.** `WarningRevertHandler.applyInverse`.

**What happens.** Nothing holds a lock between the revertibility check (`currentValues`) and the
revert itself (`applyInverse`). The check can see the row and say "revertible", and the row can
be gone by the time the revert runs. The handler behaves correctly — refusing with
`ApiException(NOT_FOUND, "Warning not found")` rather than crashing — but the user gets an error
on an entry that **looked** revertible.

This shows up on this handler alone because it is the only one that runs its own query inside
`applyInverse`.

**Test.** `WarningRevertHandlerTests.applyInverse_warningWithdrawnSinceTheEntry_throwsNotFound`

**Status. Fixed** — the refusal, not the race.

Locking the row between the check and the revert would buy nothing: the operator's decision is
older than either query, so a lock would only move the window. What was actually wrong is what
the refusal *said*. `"Warning not found"` reads as a broken request, on an entry the panel had
just shown as revertible.

It refuses with `AuditRevertRefusal.TARGET_MISSING` and the same wording
`AuditRevertService` already uses for that refusal — *"The record this entry is about no longer
exists"*. `ApiException`'s `code` field exists for exactly this, as its own javadoc says: a
refused revert has several distinct causes and the panel has to tell the operator which one it
hit. So the check and the race now come back indistinguishable **on purpose**, because to the
operator they are the same fact.

---

### F-12 — A needless administrator query on an empty target list

**Where.** `UserRevertHandler.currentValues`.

**What happens.** `adminRepository.findAllAdminStudentIds()` is called **before** the loop, so a
query is issued even when the target list is empty. Harmless today: the revertibility pass only
calls this method with a non-empty id set.

**Test.** `UserRevertHandlerTests.currentValues_noTargets_doesNotQueryTheAdminIdList` — the
same assertion inverted rather than deleted, so the order of the two queries cannot drift back.

**Status. Fixed.** The students are loaded first and an empty result returns before the
administrator query is issued. Being harmless is why this sat open as long as it did; it cost
one line to close.

---

### F-13 — Token revocation hangs on a single condition

**Where.** `AccountService.deleteAccount`.

**What.** This is **not** a defect — it is an existing protection. It is recorded because losing
it would be expensive.

```java
if (response.success()) {
    authService.invalidateAllAuthTokensForEmail(student.getKitEmail());
}
```

Without this condition the account would go `DELETED` while every token issued to it stayed
valid until it expired — and the `app.auth.app-session-ttl` default is **`P365D`**, so a student
token lives for a year. The other direction of the condition matters too: on a **failed**
deletion the tokens must not be revoked, or a still-legitimate session gets closed.

**Tests.**
```
AccountServiceTests
  deleteAccount_successfulDeletion_revokesEveryIssuedToken
  deleteAccount_failedDeletion_leavesTheTokensAlone
```
The second test is the single most valuable one in this batch: it goes red if the protection is
ever removed.

**Status.** Put under test.

---

### F-14 — 500 when a required query parameter is missing

**Where.** `ProfessorController:68` (`GET /data/professor/id`).

**What happens.** Both parameters are required via `@RequestParam`:

```java
public UUID getProfessorID(@RequestParam String firstName, @RequestParam String lastName)
```

Called without them, Spring throws `MissingServletRequestParameterException`.
`GlobalExceptionHandler` **does not cover** that type — `MethodArgumentNotValidException`,
`HandlerMethodValidationException`, `ConstraintViolationException`,
`HttpMessageNotReadableException` and `MethodArgumentTypeMismatchException` are listed, but not
this one. So it falls through to the catch-all: **500 "Unexpected backend error"**, where it
should be **400**.

The endpoint is open to anonymous access, so triggering this does not even require a session.

**How it was found.** The route sweep in the API/role batch (`ApiAuthorizationMatrixTests`)
called every public route without a token in
`declaredPublicRoutesAreReachableWithoutAToken`; this route returned 500.

**Status. Fixed** — the one line this entry predicted:
`MissingServletRequestParameterException` joined `handleBadRequest`'s type list, and the route
answers 400.

The mechanism that made it happen is worth recording. The route was on
`PUBLIC_ROUTES_ANSWERING_SERVER_ERROR` and the test **expected** the 500, so the fix turned
that test red with *"no longer answers 500 — drop it from PUBLIC_ROUTES_ANSWERING_SERVER_ERROR
and close its finding"*. That list is empty and gone now; a public route answering 5xx is a
plain failure again.
`ProfessorApiIntegrationTests.getProfessorIDWithoutItsRequiredParametersIsABadRequestRatherThanAServerError`
is the replacement pin.

---

### F-15 — 500 for the category list of an unknown lecture

**Where.** `RatingService:187` (`GET /ratings/{lectureId}/categories`).

**What happens.**

```java
Lecture lecture = lectureService.getById(lectureId);
for (RatingCategory category : lecture.getLectureType().getDefaultCategories()) {
```

`getById` returns `null` when it finds nothing and there is no check in between, so a
non-existent lecture id gives a `NullPointerException` → catch-all → **500**. It should be a
404, or a 404-shaped body like the sibling endpoint produces.

This endpoint is open to anonymous access too; any random UUID is enough.

**How it was found.** The same sweep as F-14.

**Status. Fixed.** A null check between the lookup and the loop, throwing
`ApiException(NOT_FOUND, "Lecture not found")`, and the route left
`PUBLIC_ROUTES_ANSWERING_SERVER_ERROR` with F-14.
`RatingServiceTests.getRatingCategoriesUnknownLectureIsNotFoundRatherThanAServerError` pins it
at the unit level, which is where it belongs: the defect is a missing check, not a routing
fact.

---

### F-16 — The wrong HTTP method returns 404 instead of 405

**Where.** `GlobalExceptionHandler:77` (`handleWrongMethod`). The **whole** API — all 122
routes.

**What happens.** A request whose path exists but whose method does not match produces
`HttpRequestMethodNotSupportedException`. The handler turns it into **404 "Not found"**; it
should be **405** with an `Allow` header.

```java
@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
ResponseEntity<BasicResponse> handleWrongMethod(HttpRequestMethodNotSupportedException exception) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new BasicResponse("Not found", false));
}
```

**A deliberate contract decision, or a mis-catch?** `git log -S` shows a single commit:
**`c4286f1` "Api" / "APIs created." (2026-07-28)** — a bulk initial commit with no rationale.
The body is **copied verbatim** from the `NoResourceFoundException` handler right above it: same
status code, same `"Not found"` text. Every other handler in the file maps to a semantically
correct code (missing header → 401, integrity violation → 409, validation → 400); this is the
only mapping that is off. So it is **a mis-catch by somebody who wanted unknown paths to return
404**, not a chosen contract.

**But it is load-bearing now.** Six weeks later, commit `5a11d29` "split the admin API from the
app API" (2026-09-07) added two dependents on top of this behaviour:

- `docs/admin-api.md:48` and `:670`: "`POST /admin/reports` … a request to it answers `404`."
  What produces that 404 is exactly this mapping — `GET /admin/reports` exists,
  `POST /admin/reports` does not.
- `AdminApiPathSplitTests.studentBugSubmissionHasNoAdminTwin` asserts the same 404.

So the sequence is: the behaviour happened first, and six weeks later it was observed and
documented. Fixing it changes a documented statement and a passing test.

**How it was found.** The protocol sweep (`ApiProtocolContractTests`), by calling every path
shape with a method it does not map.

**Decision: fixed**, reversing what this entry recorded. The two documented dependents were
the reason to leave it, and both were documentation of the defect rather than uses of it —
`admin-api.md` describing the 404 and a test asserting it. Neither is a client depending on
the behaviour; the Android dependency was never established, and the answer it now gets is the
one the same document already told it to expect for every other error.

`handleWrongMethod` answers `405 "Method not allowed"` and sets `Allow` from the mapping's own
verb set. Three sentences of `admin-api.md` changed with it.

**Status. Fixed.** The claim that the test side was *"one line, not 122 assertions"* was
correct and got tested: flipping `com.pse.support.ApiContract.WRONG_VERB_STATUS` from 404 to
405 carried both suites — `ApiProtocolContractTests` across 93 refusals and
`AdminApiPathSplitTests` — with no other edit. The sweep gained
`everyWrongVerbRefusalNamesTheVerbsThatWouldHaveWorked`, because the header is half of a 405:
a caller told only that its verb is wrong still does not know which one would have worked, and
the body cannot carry that.

**Two mechanisms were conflated, and that was the real cost of the copy-paste.**
`handleNotFound` (`NoResourceFoundException` — "no such path") and `handleWrongMethod` (this
finding — "the path exists, the method does not") produced **exactly the same body**: same
status code, same `"Not found"` text, so which one ran was **indistinguishable** from the
response. The status now separates them, which is the part of this fix worth more than the
code itself.

The concrete consequence: `AdminApiPathSplitTests.studentBugSubmissionHasNoAdminTwin` was not
proving what its name claimed. The name says "no admin twin", implying the path does not exist;
but `/admin/reports` **does** exist — only GET maps, POST does not, and the 404 it saw was this
finding's 404. Since the distinguishing signal was not in the body, it was given a second
request: the same test also asserts that `GET /admin/reports` returns **200**. The status tells
the two apart now, and the second request is kept anyway — it is what stops the test from
quietly passing for the wrong reason if the path is removed entirely one day.

**Side finding — placeholder shadowing.** The sweep revealed that two literal paths are shadowed
by their UUID siblings: `GET /ratings/rate` falls into `GET /ratings/{lectureId}` and returns
**400** because `"rate"` is not a UUID; `GET /social/comments/report` and
`GET /social/comments/{lecture_id}` are in the same situation. Not a defect — Spring's normal
matching precedence — but the sweep would have skipped two routes silently if it had not
accounted for it. `ApiProtocolContractTests.verbsReaching` models this.

---

### F-17 — An unsupported media type returns 500 instead of 415

**Where.** `GlobalExceptionHandler` — a missing handler. **Every** route that reads a
`@RequestBody` (26 of them today).

**What happens.** A request whose body is sent with `Content-Type: text/plain` produces
`HttpMediaTypeNotSupportedException`. The class does **not** extend
`ResponseEntityExceptionHandler` and there is **no** `@ExceptionHandler` for this type, so
`@ExceptionHandler(Exception.class)` catches it before Spring's own resolver can answer 415.
Result: **500 "Unexpected backend error"**, where it should be **415**.

What makes the distinction clear: malformed JSON inside the **correct** media type returns a
clean **400** (`HttpMessageNotReadableException` is listed). So this is not "the endpoint
rejects garbage noisily", it is one unhandled exception.

**How it was found.** Predicted from the code first (phase 1 discovery), then confirmed in the
protocol sweep: `everyBodyReadingRouteAnswersAnUnsupportedMediaTypeWithTheDeclaredStatus` calls
every body-reading route with `text/plain` and all of them return 500.

**Same root cause, seen in production.** In the production logs,
`MaxUploadSizeExceededException` and Tomcat's 512-byte multipart header limit fall into the same
catch-all branch. Same cause: no handler for body/transport layer exceptions. Still to be
measured separately, and **F-18 is still free for it**: the ownership sweep that was going to
claim that number found nothing to record (see *Negative results* below). Fixing F-17 does
**not** cover it: the narrow handler claims one exception type and these are different types,
still falling to the catch-all.

**⚠ Do NOT fix this by extending `ResponseEntityExceptionHandler`.**

That is the first fix that comes to mind and it is wrong for three separate reasons. All three
were verified against this project's version — Spring Framework **7.0.7** (Boot 4.0.6),
`spring-webmvc-7.0.7.jar`.

1. **The application does not start.** Tried and measured: the context does not come up, and the
   `handlerExceptionResolver` bean fails with:

   ```
   IllegalStateException: Ambiguous @ExceptionHandler method mapped for
   [ExceptionHandler{exceptionType=org.springframework.web.HttpRequestMethodNotSupportedException,
   mediaType=*/*}]: {GlobalExceptionHandler.handleWrongMethod(...),
   ResponseEntityExceptionHandler.handleException(...)}
   ```

   Because the project **already** defines its own handler for
   `HttpRequestMethodNotSupportedException` (F-16) and the base class's bulk
   `@ExceptionHandler` maps the same type a second time.

2. **Deleting `handleWrongMethod` to "solve" that would silently close three findings at
   once.** The types mapped by the base class's `handleException` include
   `HttpMediaTypeNotSupportedException` (F-17), `HttpRequestMethodNotSupportedException` (F-16)
   **and** `MissingServletRequestParameterException` (F-14) together. F-16's 404 would turn into
   405 — that is, the contract documented in `admin-api.md` would break without anyone asking
   for it.

3. **The error body changes on every error path.** The base class produces a `ProblemDetail`
   via `createProblemDetail` (`application/problem+json`), not the project's `BasicResponse`
   `{message, success}` shape. The Android client's error parsing depends on that shape.

**The correct fix** is narrow: add `@ExceptionHandler(HttpMediaTypeNotSupportedException.class)`
and return 415 with the project's existing `BasicResponse` body. It touches neither of the other
two findings and does not change the body shape.

**Status. Fixed** — that narrow handler, `GlobalExceptionHandler.handleUnsupportedMediaType`,
and nothing else. `ApiContract.UNSUPPORTED_MEDIA_TYPE_STATUS` is now `415`.

How it was verified, in the order it was done: the handler was added **first**, with the pin
left at `500`. `everyBodyReadingRouteAnswersAnUnsupportedMediaTypeWithTheDeclaredStatus` then
went red and named **all 37** body-reading routes as having moved `500 → 415` — more than the
26 the finding first counted, because the legacy and `/admin` paths of the same handler are
separate mappings. That red run is the evidence the handler reaches every route rather than the
one probed by hand; only then was the constant flipped.

The other three tests in the class stayed green throughout, which is the part that matters for
the neighbouring findings: **F-16's 404 is untouched** and malformed JSON in the right media
type is still 400. The two answers did not collapse into each other.

One test was added rather than edited: `unsupportedMediaTypeCarriesTheProjectErrorBody` asserts
`{message: "Unsupported media type", success: false}`. The sweep only reads statuses, so it
would stay green if someone later replaced the narrow handler with
`ResponseEntityExceptionHandler` — the status would still be 415 while the body silently became
`application/problem+json`. That is reason 3 above, and now it has a test rather than a warning.

---

### F-18 — The project id reaches GitLab encoded twice

**Where.** `RestClientGitLabClient.createIssue`.

**What happened.** The path was assembled by hand:

```java
String path = "/api/v4/projects/" + URLEncoder.encode(projectId, UTF_8) + "/issues";
```

`RestClient.uri(String)` treats its argument as a URI template and encodes it as well, so the
percent sign of the first encoding was encoded again. A project id of `group/project` left the
backend as `group%252Fproject`. GitLab decodes that once, looks for a project literally named
`group%2Fproject`, and answers 404 — which the broad `catch (RuntimeException)` turns into the
same **502 "Could not reach GitLab"** an unreachable tracker gives.

**Why it matters.** GitLab addresses a project either by its numeric id or by its URL-encoded
path, and the path form is what its own documentation shows. A numeric id is unaffected —
`URLEncoder.encode("42")` is `"42"` — which is why nobody saw this: the deployment happens to
use a numeric `GITLAB_PROJECT_ID`. Configured the other way, **every** bug report submission
fails, and the log names only `HttpClientErrorException$NotFound`, so the cause is not visible
from the symptom.

**Fixed.** The id goes in as a URI variable instead, and `RestClient` encodes it exactly once:

```java
.uri("/api/v4/projects/{projectId}/issues", projectId)
```

**Test.**
```
RestClientGitLabClientTests
  createIssue_projectIdWithASlash_encodesItIntoASinglePathSegment
```
Written before the fix and red on the real URI (`group%252Fproject` against the expected
`group%2Fproject`), which is how the defect was found in the first place — the test was written
to state the intended request, not to reproduce a report.

**A second defect, found by the same batch and fixed in it.** Adding the package-private
constructor the test drives left the class with two constructors and neither marked, so the
container stopped being able to build the bean at all — `No default constructor found`, every
`@SpringBootTest` red. The public constructor now carries `@Autowired`. Worth recording because
of *which* tests caught it: the unit tests were green throughout; the API sweeps and the
context-loading tests are what refused. That is the argument for keeping both layers.


---

### F-19 — Two audit response fields are null by design and the schema said otherwise

**Where.** `AuditLogResponse.revertBlockedReason`, `AuditLogResponse.revertedByAuditId` and
`AuditTargetResponse.id`, against the generated OpenAPI schema.

**What happens.** All three are null in ordinary operation. `AuditRevertService.Revertability.YES`
is `(true, null, null)`, so a revertible entry reports no blocking reason and no reverting id; and
a refused request is audited against `AuditTargetType.ENDPOINT`, which is not a row and carries no
id. The schema declared all three non-nullable, so `GET /admin/audit-logs` and
`GET /admin/activity-logs` could answer with bodies the schema they publish says are invalid.

**Why it was not found when the other six were.** The contract layer fixed six fields of exactly
this kind. These three survived because `OpenApiResponseValidationTests` **seeded no data of its
own** — it validated whatever rows the previously-run test class happened to leave behind, and
Surefire orders classes by filesystem. With an empty audit log the fields are never rendered and
the sweep sees nothing.

That is the more interesting half of this finding. The suite passed on one checkout and failed on
another with the same commit: running it in a fresh worktree turned it red, and forcing
`ApiAuthorizationMatrixTests` to run first — a class that generates refusals in bulk — reproduced
it every time.

**Status. Fixed**, in two parts, because there were two defects. The three fields carry
`@Schema(nullable = true)`. And the sweep now empties the database and seeds the two shapes
deliberately: a refusal driven through the real refusal path (from a *signed-in* student —
`AccessRefusalAuditor` returns early with no principal, so an anonymous 401 writes nothing at all),
and a revertible entry. Each annotation was then removed one at a time to confirm the seed
actually reaches it; each removal turned the test red on exactly its own field. The suite now
passes in filesystem, alphabetical and reverse-alphabetical order.

`AuditTargetResponse.label` was left unannotated on purpose. Every writer seen supplies one, and a
refusal supplies `"VERB /path"`; declaring it nullable would claim an observation nothing makes.

---

### F-20 — Creating a lecture or a professor was not audited

**Where.** `LectureService.addLecture` and `ProfessorService.addProfessor`.

**What happens.** Nothing — which is the defect. Nine services write an `AuditWriter` entry for
every administrative mutation, `ModerationCatalogService.updateLecture` and `deleteLecture`
included. Creating the same row wrote none, so the record could show a lecture being renamed with
no entry saying where it came from, and a lecture appearing between two audited events with
nothing to say who added it.

**Found by reading, not by a test.** `docs/TODO.md` had carried it as "an audit gap worth its own
commit" for some time.

**Status. Fixed.** `AuditAction` gained `LECTURE_CREATED` and `PROFESSOR_CREATED`, both
`ADMINISTRATIVE`. Neither is revertible, and that follows the existing precedent rather than
inventing one: `USER_WARNING_CREATED` is already an administrative action that is recorded and not
revertible, and the mechanism is the `changes` key — a lifecycle event is written as
`exists: {before: false, after: true}`, and `exists` is in `AuditRevertService.LIFECYCLE_KEYS`, so
`isFieldDiff` refuses it. Undoing a creation is a deletion, which is its own audited action with
its own guards.

Both services now take the `AuthenticatedUser` rather than a bare `Student`, because
`AuditWriter.write` records the acting `Admin` and a `Student` alone cannot say which
administrator acted. Pinned by unit tests in both services (including that a refused creation
records nothing), by `AdminApiIntegrationTests.creatingALectureIsRecordedAndIsNotRevertible`, and
end to end by the admin journey. **Client-visible**, so it has a `CHANGELOG` entry: two new values
can appear in `/admin/audit-logs` and in its `meta`.

---

### F-21 — The professor list of a lecture comes back in a different order each time

**Where.** `LectureService.createLectureResponse`, and the same shape one record over in
`ProfessorService.createProfessorResponse`.

**What happens.** `LectureResponse.professors` is built by iterating `Lecture.professors`,
which is a `Set`, into an ordered `List`. `Professor` overrides neither `equals` nor
`hashCode`, so the iteration order is identity-hash order and can differ between two requests
in the same process. `ProfessorResponse.lectureIds` has it the other way round, out of
`Professor.lectures`.

**Why it matters now.** It was invisible while the field was only a list of names to render
somewhere on a page. The open item in [TODO.md](TODO.md) — a rating titled
`SS26 Algorithmen 1 — Peter Sanders, Übungsleiter 1, …` — turns that list into a **string**,
and an unstable order in a string is something a user sees: the same lecture is titled
differently on two consecutive refreshes.

**This is the read side of [BUG-3](#bug-3--professor-assignment-order-silently-refuses-a-revert).**
BUG-3 was the same `Set` reaching the audit comparison, where it refused legitimate reverts;
it was fixed by comparing as a multiset. That fix was scoped, correctly, to the comparison —
nobody was asking the read path to be ordered at the time. So the two halves were found a
month apart from opposite ends: one from a revert that would not apply, one from a title that
would not sit still.

**Tests.**
```
LectureServiceTests
  createLectureResponse_professorsInAnyOrder_answersThemByName
  createLectureResponse_sameLastName_ordersByFirstName
  createLectureResponse_carriesTheSemesterLabelAndTheTitle
ProfessorServiceTests
  createProfessorResponse_lecturesInAnyOrder_answersTheirIdsByLectureName
```
Built the way BUG-3's were, and for the same reason: the fixture is a `LinkedHashSet` in a
deliberately wrong order, never a real `HashSet`. A test that fed in a `HashSet` and asserted
on what came out would be asserting on identity-hash order — flaky, and it would have put the
flakiness in the test rather than in the defect. All four were run against the unsorted
builders first and fail there.

**Status. Fixed.** Both responses sort: a lecture's staff by last name, first name, id — the
order `ProfessorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc` already uses, so
the two surfaces agree — and a professor's lectures by name.

**What the fix deliberately does not do.** The order is alphabetical, and the item that
prompted it shows the lecturer first and the exercise leaders after. That ordering is not
available: `lecture_professors` records that a person teaches a lecture and nothing else, so
no query can tell a professor from an *Übungsleiter*. Producing the requested order needs a
column on the join table, which is a migration and an admin-API change, and that is the team's
call rather than something to infer from a name. Written up here so the difference between
"stable" and "by role" is on the record, and in [admin-api.md](admin-api.md) so a client
reading the contract sees it.

---

### P-6 — A sweep asserted "not refused", which a `404` also satisfies

**Where.** `ApiAuthorizationMatrixTests.studentSessionReachesTheEndpointsTheAppNeeds`.

**What it did.** The test walks a short list of routes the Android client depends on and, for
each, checked that a student session was not turned away:

```java
assertThat(status != 401 && status != 403)
```

An unmapped path answers `404`, which is neither. So the assertion passes both when the route
is reachable and when the route **is not there at all** — the two outcomes it exists to tell
apart. It was noticed while `GET /auth/me` was on that list and no longer mapped; that route's
removal was deliberate and is not a finding, but the assertion that could not see it is.

**Why the list is hand-written, when nothing else here is.** Every other sweep reads its routes
from Spring's `RequestMappingHandlerMapping`, because a hand-kept list goes stale in silence.
This one cannot: the question it asks is *which routes the app depends on*, and Spring has no
opinion about that. The trade-off inverts — the list stays correct and the application drifts
out from under it — and only an assertion strict enough will say so.

**Fix.** `isEqualTo(200)`. A route that stops answering now fails the sweep.

**Status. Fixed.**

---

### P-7 — A surviving mutant is not a finding

**Where.** The `pitest` profile in `pom.xml`, and how its report is read.

**What happened.** Mutation testing was added on 8 September and its first run scored 67%:
1194 mutants, 797 killed, 73 survived, 324 with no coverage. (Re-measured 9 September: **1134
mutants, 840 killed — 74% — 72 survived, 222 with no coverage.** The figures in this paragraph
are the first run's, kept because the rest of the entry is about what that run taught.) One survivor read as serious --
`removed call to protectAdministrator` in `ModerationUserService.warnStudent`, which is an
authorization guard with two rules ("you cannot moderate your own account", and an ordinary
administrator cannot modify an administrator account). A guard whose deletion no test notices
is exactly what mutation testing exists to find, and three unit tests were written to close it.

**They were then deleted, because there was nothing to close.** Removing the
`protectAdministrator` call from `warnStudent` for real turns **two** tests in
`AdminApiIntegrationTests` red — `adminAccountsAndEmptyWarningsAreProtected:548` and
`elevatedAdminStillCannotModerateItself:628`, both `expected:<409> but was:<200>`. The guard
was covered on every path all along, including the elevated case, with stronger assertions than
the ones written to replace them.

**The cause is the profile's scoping, and it is not a mistake.** PIT runs only the eighteen
context-free service unit test classes. Pointing it at the whole suite would start a Spring
context per mutant and take the run from under two minutes to hours, which is the difference
between a nightly job and one nobody enables. But it means the report has to be read like this:

| Status | Means | Does **not** mean |
|---|---|---|
| `KILLED` | a unit test fails when the code is wrong | — |
| `SURVIVED` | these eighteen classes do not kill it | that the suite misses it |
| `NO_COVERAGE` | the unit tests never reach the line | that the line is untested |

**Status. Closed as a reading rule rather than a fix.** A survivor is a *candidate*: worth
opening, not worth a test until it has been checked against the API, integration and
end-to-end layers. Writing one anyway produces exactly the duplication
[P-4](#p-4--a-moved-test-file-was-copied-not-moved) is about, and [P-2](#p-2--integration-tests-hide-unit-targets)
already says the general form of this — "there is no unit test" and "the lines are not covered"
are not the same thing. P-7 is that sentence again, arrived at from the other direction, and it
is recorded because the first reading of the first report got it wrong.

P-2's own test applies to whether a duplicate is worth keeping anyway: it kept
`UserRevertHandlerTests` over a two-line coverage gain because the value was writing down *why*
the branches are the way they are. The three deleted tests did not pass that test — the API
tests state the same rules, on more paths.

**What the run is still good for.** Survivors in classes whose only tests *are* unit tests
carry no such ambiguity. Two worth naming, both in `RateLimitService` and both live after this
entry: `<init>:46` (removing `setPropagationBehavior(PROPAGATION_REQUIRES_NEW)` kills nothing)
and `consume:65` (the retry-attempt boundary). The first is load-bearing for the isolation the
concurrency layer depends on -- see the negative result below.


---

### F-22 — The two catalogue detail reads answer 200 for a row that is not there

**Where.** `LectureService.getLecture` and `ProfessorService.getProfessor`.

**What happens.** Both answered `200 {"success": false, "lecture": null}` for an id that does
not exist, while every other read in the catalogue — `GET /ratings/{lectureId}` and its
`/categories` sibling — has answered `404` since F-5 and F-15. The lecture message also carried
a typo (`Couldn find lecture with uuid:`), F-10's category, going out to the client.

**How it was found.** Written down in the backlog of `docs/TODO.md` as work the
single-responsibility refactor deliberately left, because the status change needs a `CHANGELOG`
entry. Reading the module to fix it turned up the second half: the backlog says *"every other
read in the module answers 404 through `ApiException`"*, and `ProfessorService.getProfessor`
did not. The claim was three routes old.

**Status. Fixed.** Both throw `ApiException(NOT_FOUND, ...)`. The body loses its always-null
payload key, which is the client-visible half and is in the `CHANGELOG` — the same carve-out
F-5 recorded for `getUserInformation`. `admin-api.md:571` had promised the old body *"rather
than an HTTP 404"* in writing and is corrected.

Pinned by four tests, all **inverted rather than deleted**:
`LectureServiceTests.getLectureUnknownIdIsNotFoundRatherThanASuccessfulFailureBody` and its
`ProfessorServiceTests` twin at the unit level, and one each in `LectureApiIntegrationTests`
and `ProfessorApiIntegrationTests` over HTTP. All four were watched fail against the unfixed
code — `Status expected:<404> but was:<200>`.

---

### F-23 — Reverting a refusal answers 500

**Where.** `AuditRevertService.revert`, line 163.

**What happens.** `LOGIN_REFUSED` and `ACCESS_REFUSED` record something that did *not* happen,
so they carry no target id. `revert` did `current.get(log.getTargetId())` where `current` is
`Map.of()` — and an empty immutable map calls `Objects.requireNonNull` on the key, so a null id
throws. The catch-all turned that into **500 "Unexpected backend error"**, where the contract is
`409 {"reason": "ACTION_NOT_REVERTIBLE"}`.

Both actions reach the panel through `GET /admin/activity-logs`, so an operator could see one
and click revert on it.

**This is the same defect the repository had already fixed twenty lines up.** `describe()`
carries the guard *and a comment explaining it* — *"Asking an immutable empty map for a null key
throws, which turned a page holding one refusal into a 500"* — and it was never mirrored into
`revert()`. So the list said "not revertible" while the action behind it crashed.

**How it was found.** Not by a test. By scanning for the shapes the refactor could have left
behind and reading the two methods side by side. Every existing `revert_*` test supplies a
non-null target id, which is exactly why it survived: the tests were written from the same
assumption the code was.

**Status. Fixed.** The same one-line guard. Pinned at both levels, and both were watched fail
first — `AuditRevertServiceTests.revert_refusalEntryWithoutATargetId_isRefusedRatherThanAnsweringAServerError`
(`NullPointerException`) and `AdminApiIntegrationTests.revertingARefusalIsRefusedRatherThanAnsweringAServerError`
(`Status expected:<409> but was:<500>`), the second driving a real `ACCESS_REFUSED` row over
HTTP.

---

### F-24 — The four `/social` submit routes answer 500 for a bad or missing id

**Where.** `CommentService:52`, `AnswerService:51`, `ContentReportService:63` and `:94`.

**What happens.** Each took its id as a `String` from the request body and handed it straight to
`UUID.fromString`. `GlobalExceptionHandler` maps neither the `IllegalArgumentException` a
malformed value throws nor the `NullPointerException` a missing one throws, so both became 500.

**Two things the backlog entry did not say.** First, the missing-id case: `UUID.fromString(null)`
throws NPE, not `IllegalArgumentException`, so a fix catching only the latter would have left
half the bug. Second, the four DTOs carried **no bean-validation annotations at all** and the
four handlers had no `@Valid` — while the two vote routes in the same controller had both.

**Status. Fixed**, and the rule that was missing is now in one place. The idiom already existed
three times privately — `AuditLogService.parseUuid`, `RatingModerationService.parseLectureId`
and `KeysetCursorCodec` guarding its own parse — and had simply never reached `social`. It is
`com.pse.shared.util.Uuids` now, with a required and an optional entry point, and the two
private copies call it. `UuidsTests` covers it directly; ten HTTP cases in
`SocialApiIntegrationTests` were watched fail against the unfixed code, all
`Status expected:<400> but was:<500>`.

A rule living in three copies is a rule that holds only where somebody remembered it. That is
the finding, more than the four routes.

---

### F-25 — Two more unvalidated request bodies

**Where.** `RatingRequest` / `RatingController:36`, and `AddLectureRequest.professorIds`.

**What happens.** `POST /ratings/rate` bound its body with a bare `@RequestBody` and neither
field was annotated: a missing `lectureId` reached `findById(null)` — whose own assertion throws
`IllegalArgumentException` — and a missing `topics` reached a for-each. Both 500.
`POST /data/lectures` annotates four of its five fields and leaves `professorIds` bare, so
omitting it reached the for-each in `addLecture`. Also 500.

**The tell in the second one is the asymmetry**: `ProfessorService.addProfessor` guards the
mirror field with an explicit null check. Two sides of the same catalogue disagreed about
whether an omitted list means "none" or means a crash.

**Status. Fixed**, in the two different directions the two routes deserve. The rating body is
validated (`@NotNull`, and `@NotNull` on a topic's `category`) and answers 400. `professorIds`
is read the way its sibling reads it — absent means no professors — so that route now
**succeeds** where it used to answer 500. `topics` is `@NotNull` rather than `@NotEmpty`
deliberately: an empty list is answered exactly as before, so only an omitted field changes.
A topic's `value` is left unconstrained, because nothing in this repository defines the scale
and a range here would be inventing one.

---

### F-26 — `ratingCount` on a professor is always 0

**Where.** `ProfessorResponseMapper:51`.

**What happens.** The field was read straight off the `rating_count` column, and **nothing in
the application has ever written that column** — no setter call anywhere in `src/main`, no
default, no trigger. So `GET /data/professor`, `GET /data/professor/{id}` and
`GET /admin/data/professor/all` reported 0 ratings for every professor, however many they had.
`admin-api.md` documented the field as `"ratingCount":12`.

**Why it was invisible.** `averageRating` sits on the next line and *is* correct — it was
changed to recompute on read during the refactor, and its neighbour was not. A response with a
right average and a zero count does not look like a bug in the count.

**Status. Fixed.** Counted from the same walk the average uses, `ProfessorRatings.of(professor).size()`.
Pinned by `ProfessorResponseMapperTests.toResponse_professorWithRatings_countsThemRatherThanReadingTheStoredColumn`,
which sets the stored column to a deliberately wrong 99 so that passing means the response
ignores it.

The `rating_count` column is now dead. Dropping it is a migration and is left for whoever wants
it; it is named in the backlog rather than quietly carried.

---

### F-27 — The rating categories come back in a different order each run

**Where.** `RatingService.getRatings`, the `HashMap<RatingCategory, Double>` at line 136.

**What happens.** `Enum.hashCode()` is the identity hash, so a `HashMap` keyed by an enum
buckets on where the JVM happened to put the constants. `keySet()` order therefore differs
between two runs of the same process, and between two instances behind a load balancer
answering the same request. `GET /ratings/{lectureId}` is public and unauthenticated.

**This is F-21's defect one package over** — that one was a `Set` of professors, this one a
`HashMap` of categories, and both reached a client as a list whose order nothing guaranteed.

**Status. Fixed** with an `EnumMap`, which iterates in declaration order, always. Pinned by
`RatingServiceTests.getRatingsAnswersItsCategoriesInADeterministicOrder`, fed five categories in
scrambled order. Against the `HashMap` it failed with all five positions wrong, which is a
better demonstration than the assertion deserved — whether it fails is itself up to the JVM, and
that is the defect stated precisely. What it pins is the guarantee after the fix.

---

### F-28 — Submitting a rating for an unknown lecture answers 200

**Where.** `RatingService.submitRating:54`.

**What happens.** `200 {"message": "Error, cannot find lecture with id <uuid>", "success": false}`
for a lecture that does not exist — while `getOwnRating` and `getRatingCategories`, the two
methods either side of it in the same class, have answered 404 since F-15. A client calling all
three had to handle both conventions depending on which one it hit.

**How it was found.** Reading the class while fixing F-25. It is a third instance of F-5's
direction that nobody had written down; the backlog named only `LectureService.getLecture`.

**Status. Fixed.** The characterization test `submitRatingReturnsErrorWhenLectureDoesNotExist`
was **inverted rather than deleted**, and watched fail first.

---

### F-29 — Three more leaked credentials nobody had found

**Where.** `BackEndStructure.md:153` in commit `214ff090`, and `application.properties` in
commits `8bc81ef` and `d4cdbde`.

**What happens.** `docs/TODO.md` recorded five leaked credentials at the time, and said, correctly, that
gitleaks is *"a floor, not a ceiling"* — three of the five were found by reading the file rather
than by the scanner. Writing `.gitleaks.toml` to close that gap turned the observation around:
rules keyed on this project's own property names find **twelve** history findings where the
defaults find five, and three of them are in commits the rotation list does not name.

| What | Where | Commit |
| --- | --- | --- |
| `spring.datasource.password` | **`BackEndStructure.md`** — a document, not a properties file | `214ff090` |
| `spring.mail.password` | `application.properties` | `8bc81ef` |
| `spring.datasource.password`, a bare value | `application.properties` | `d4cdbde` |

The first is the one worth stopping on. Every credential anybody had looked for was in
`application.properties` or `TestClient.java`, because those are the files you think to check.
This one is in a **design document**, where the password went in as an illustration of the
configuration — and no amount of re-reading the properties file would ever have found it. The
SMTP password also turns out to have been public since an earlier commit than the list records.

**Status. Open.** These are credentials, so nothing in a repository can close them: each has to
be rotated at its provider, like the five already listed. They are in `.gitleaksignore` as
commented-out fingerprints, retiring one per rotation, and in the rotation table in
`docs/TODO.md`.

**What it says about the method.** The reading found three the scanner missed, and the scanner
has now found three the reading missed. Neither is a substitute for the other, and a green
`secrets:history` was never evidence of anything except that the rules had not been written yet.



---

### F-30 — A rate limiter that is only correct because a clock in another file is UTC

**Where.** `RateLimitService.isCurrentWindow` and `retryAfter`, and `TimeConfig`.

**What happens.** Nothing, today — and that is the finding. Both methods do wall-clock
arithmetic on a `LocalDateTime`: `windowStartedAt.plus(window).isAfter(now)` decides whether a
caller is still locked out, and `Duration.between(...)` builds the `Retry-After` header. Wall
clocks jump. The reason this is safe is in a different file: the `Clock` bean is
`Clock.systemUTC()`, and UTC has no daylight-saving transitions.

Change that one bean to `systemDefaultZone()` — a change that looks local, reasonable, and has
nothing to do with rate limiting — and the limiter acquires a bug that appears twice a year. At
the autumn transition the clock goes back an hour, so `isAfter` stays true for an extra hour and
everyone rate-limited in that window stays locked out an hour longer than the policy says.

**How it was found.** SonarQube, run locally against this project for the first time. It flagged
both lines as "convert to a time zone-aware type", which read as a false positive — and is one,
in the sense that there is no defect to fix. What makes it worth recording is the *reason* it is
a false positive: an invariant holding two files apart, written down nowhere, that any reader of
either file would have to guess at.

**Status. Documented rather than changed**, on both methods, naming `TimeConfig` and saying what
breaks if it moves. Converting the column to an `Instant` would also close it and is a schema
change for a bug nobody has; the comment costs nothing and fails loudly in review instead.

Two other things the same scan raised are recorded here so nobody re-triages them:

- **`AuditRevertService:185`, "handler is nullable here".** Not reachable. `handler` is null only
  when `!isFieldDiff(log)` or no handler is registered for the target type, and `evaluate()`
  refuses both on its first line, so the throw above has already run. Written down in the method
  — the risk was somebody "fixing" it with a null check that would swallow an unrevertible entry
  instead of refusing it.
- **`SecurityConfig:29`, CSRF disabled.** Correct for a stateless bearer-token API with no
  cookie-backed session: there is no ambient credential for a cross-site request to ride on.

**The scan's own numbers, for whoever creates the SonarCloud project:** 6 bugs, 1 vulnerability,
0 security hotspots, 350 code smells, 95.8% coverage, 0.7% duplication over 10,591 lines. The
six bugs are the two above plus four instances of the same `LocalDateTime` rule in test code.
**None of the 350 smells is a regression** — 111 are `isZero()` suggestions, 87 are multi-invocation
lambdas in assertions, and 55 were dead imports, which are gone. `docs/TODO.md` predicted exactly
this shape before anyone had run it.


---

### F-31 — Reverting a report status is impossible on exactly the changes worth reverting

**Where.** `ReportStatusRevertHandler.CommentReportHandler.currentValues` and its answer-side
twin, against `ModerationCommentService.updateReportStatus` / `ModerationAnswerReportService`.

**What happens.** `updateReportStatus` records **two** changed fields whenever the new status
changes the content's visibility — `status` and `commentStatus` (or `answerStatus`). The
handler's `currentValues` offered only `status`, and `AuditRevertService.evaluate` refuses any
entry carrying a key the handler does not know. So every transition into or out of
`ACTION_TAKEN` came back `revertible: false`, `ACTION_NOT_REVERTIBLE` — and those are the only
transitions the handler's own javadoc says it exists for: *"moving a report to `ACTION_TAKEN`
hides the content it is about, so a status set by mistake takes a post down with it."*

**Why it matters.** A moderator hides a student's comment by mistake and the one control built
to undo it is greyed out, for the whole revert window, with a reason that says the action is
not reversible. The listing and the button agreed with each other, so nothing looked broken.

**How it was found.** The Shape-1 sweep — the F-23 shape, "a guard in one twin and not its
neighbour" — extended past `AuditRevertService` to every copy-paste pair in the module. This
pair's *guards* mirror perfectly; what did not mirror was the handler against the service it
inverts.

**Test.** `AdminApiIntegrationTests.anActionTakenReportStatusIsRevertibleThroughTheAuditEntry`,
which presses the button over the whole path and asserts the comment becomes visible again. The
red run's evidence was the response body itself, carrying both change keys next to
`"revertible":false`. `ReportStatusRevertHandlerTests.commentReportHandler_currentValues_mapsOnlyTheStatus`
had pinned the defect with `containsExactly(entry("status", …))` and was **inverted rather than
deleted**, with its answer-side twin.

Worth recording beside it: `AdminApiIntegrationTests.actionTakenHidesTheCommentAndRevertingRestoresIt`
already existed and is *named* for this. It never calls the revert endpoint — it toggles the
report back with a second PATCH. A green test claiming more than it asserts, which is
[P-6](#p-6--a-sweep-asserted-not-refused-which-a-404-also-satisfies) again.

**Status. Fixed** — both handlers publish the visibility key. `applyInverse` is unchanged,
because `updateReportStatus` derives visibility from the status. What the second key buys
beyond making the entry revertible at all is the *check*: if somebody moved the content in the
meantime the revert is now refused as `VALUE_CHANGED` rather than quietly overwriting them.

---

### F-32 — Each catalogue create path had one half of "trim, then check, then store"

**Where.** `LectureService.addLecture` and `ProfessorService.addProfessor`.

**What happens.** Two twins, two different halves of the same rule missing:

- `addProfessor` stored `firstName().trim()` / `lastName().trim()` but ran its uniqueness
  check on the **raw** strings. So `{" Stefan", "Kuehnlein "}` walked past the 409 and created
  a second professor row holding exactly the name the first one holds.
- `addLecture` was at least self-consistent — raw check, raw store — but trimmed **neither**.
  `@NotBlank` passes `"  Algorithmen 1  "`, so the padding reached the column.

**Why it matters.** The first is a uniqueness constraint one space away from being bypassed, on
a catalogue the whole app reads. The second has a knock-on nobody would trace back:
`LectureModerationService` trims the incoming PATCH name before comparing it to the stored one,
so the **first admin edit** of a padded lecture records a `name` change nobody made and writes
a `LECTURE_UPDATED` audit entry for it.

**How it was found.** The Shape-1 sweep, comparing the two create paths line by line.

**Test.** `ProfessorServiceTests.addProfessorRefusesANameThatDiffersFromAnExistingOneOnlyByWhitespace`,
`LectureServiceTests.addLectureStoresTheNameAndCodeTrimmed` and
`…RefusesANameThatDiffersFromAnExistingOneOnlyByWhitespace`. The best of the three reds was
Mockito's, not an assertion's: `PotentialStubbingProblem`, because the stub was on
`findByName("Lineare Algebra 1")` and the code asked for `findByName("  Lineare Algebra 1  ")`.

**Status. Fixed** — both trim once and use that value for the check and the store.

---

### F-33 — Nobody records who dealt with a bug report, and a guard reads that column

**Where.** `ModerationBugReportService.updateBugReport`, `BugReport.resolvedBy` /
`resolvedAt`, and `AdminRepository.hasModerationHistory`.

**What happens.** `setResolvedBy(` appears **zero** times in `src/main` and `src/test`.
`resolvedAt` is the same. Yet `hasModerationHistory` reads one of them:

```sql
OR EXISTS (SELECT report FROM BugReport report WHERE report.resolvedBy = admin)
```

So one of that guard's three clauses could never evaluate true.

**Why it matters.** It is F-26's shape — a live query reading a column nothing writes — but the
cost is different. `admin-api.md` promises *"Demoting is 409 once the account has moderation
history — a warning it issued or a report it reviewed"*, and an administrator whose entire
history was bug reports could be demoted anyway, taking the attribution with them. What makes
it stand out is the neighbours: the same query reads two sibling columns
(`CommentReport.reviewedBy`, `AnswerReport.reviewedBy`) and **those are written** — by the two
services sitting either side of this one.

**How it was found.** The Shape-2 sweep: every persistent field on all 21 entities classified
as written/read, using JPQL as well as getters — eight fields have no getter call anywhere and
are read only by a query, so a getter-only grep would have called them dead.

**Test.** `AdminApiIntegrationTests.demotingAnAdministratorWhoResolvedABugReportIsRefused`
(red: `Expecting actual not to be null` on `getResolvedBy()`), plus
`ModerationBugReportServiceTests.updateBugReport_statusChanged_recordsWhoDealtWithItAndWhen` and
`…_reopened_clearsWhoDealtWithItAndWhen`.

**Status. Fixed** — both columns are written on a status change, mirroring the two report
services. `OPEN` is the one status that is not a disposition, so reopening clears the pair
rather than leaving a name on an open report. `ModerationBugReportService` gained a `Clock`,
injected and fixed in tests per the house rule.

---

### F-34 — A route the security chain declares and no controller implements

**Where.** `SecurityConfig:90` declares `PATCH /social/notifications/all` as authenticated;
`SocialController` maps only `/notifications/{notification_id}`;
`NotificationRepository.markAllAsSeen` is written, `@Modifying`, and has **zero callers**.

**What happens.** `/all` falls into the single-notification handler, fails to bind as a `UUID`,
and answers **400 `"Invalid request"`**.

**Why it matters.** Three artefacts of a "mark everything read" feature exist — the query, the
security rule, the intent — and the handler does not. Anyone reading `SecurityConfig` or the
repository would reasonably believe the endpoint is there.

**How it was found.** The Shape-2 sweep, in the pass over queries with no callers.

**Test.** `SocialApiIntegrationTests.markingAllNotificationsAsSeenIsNotAnEndpointDespiteBeingDeclared`.

**Status. Pinned, and open as a product question.** Writing the handler is adding a feature,
which the 9 September and Kontrollphase passes are explicitly not for; deleting the query
throws away the record that somebody planned one. **Finish it or remove both halves** — the
decision is the team's, and the test is what makes either one deliberate.

---

### F-35 — Four more lists reaching the client with no defined order

**Where.** `CatalogueEdits.labels` (via `LectureModerationService` /
`ProfessorModerationService`), `Rating.topics`, `Comment.answers`, and the two app-tier comment
listings in `CommentRepository`.

**What happens.** F-21 and F-27 each fixed one instance and neither shape was swept. Four more:

1. **BUG-3's other half.** `sameAssignment` sorts before comparing, so *deciding* whether an
   assignment changed is order-insensitive — but the value **recorded** came from `labels()`,
   which did not sort. So the `before` list written into `changes.professors` carried the
   `HashSet`'s identity-hash order into a `jsonb` column, which **preserves array order**, and
   out through `GET /admin/audit-logs`. `Professor` overrides neither `equals` nor `hashCode`,
   so that order can differ per run and between two instances.
2. **F-27's own surface.** `RatingService.getRatings` was given an `EnumMap` so the public read
   returns declaration order. `getOwnRating`, **two methods below it**, builds the same
   `RatingsAverageResponse.ratings` field by walking `rating.getTopics()` — a JPA bag with no
   `@OrderBy`. The admin `GET /admin/ratings` walks the same bag.
3. `Comment.answers`, a bag with no `@OrderBy`, reaching `CommentResponse.answers`.
4. Both app-tier comment listings had no `ORDER BY` at all, while the admin listing beside them
   always had one.

**Why it matters.** F-21's argument, unchanged: invisible while it is a list in a payload, and
a defect the moment a client renders it. One response field cannot have two orders, and
`GET /ratings/{lectureId}` and `GET /ratings/own/{lectureId}` are the same field.

**How it was found.** The Shape-3 sweep: five mappers, **all 76 DTO records** (exactly one
declares a `Map`/`Set` field), every `*Response`-building method, all 15 repositories.

**Test.** `LectureModerationServiceTests.updateLecture_recordsTheProfessorAssignmentInAStableOrder`
(deterministic `LinkedHashSet`, per BUG-3's rule),
`RatingServiceTests.getOwnRatingReturnsTheCategoriesInDeclarationOrder`, and
`SocialApiIntegrationTests.commentsComeBackNewestFirstAndTheirAnswersOldestFirst` — which was
written **after** the fix and therefore checked against a defect: inverting the comment order
and then only the answer order made each half fail in turn.
`AdminApiIntegrationTests.ratingsListingIsAdminOnlyAndReturnsTheManagedShape` had pinned
insertion order and was **inverted rather than deleted**.

**Status. Fixed.** Sorted by category (declaration order, matching what the F-27 CHANGELOG
already promised the sibling route), comments newest first, answers oldest first, recorded id
lists sorted. `labels()` and `sameAssignment` are now defined in terms of each other, so the
order a change is decided by and the order it is recorded in are one thing.

Two related notes kept rather than fixed:
`LectureRepository` and `ProfessorRepository` declared **`Set`** returns on four queries
carrying an `ORDER BY` — order survived only because Spring Data materialises a
`LinkedHashSet`, which is a fact about the framework and not a guarantee. Changed to `List`.
And about **fifty `Map.of` call sites** build audit `changes`/`metadata`; `Map.of` iteration
order is randomised per JVM run and they are safe **only** because `jsonb` normalises object
keys — a column type, not the code, and the H2 baseline uses `json`, which does not. That is
[F-30](#f-30--a-rate-limiter-that-is-only-correct-because-a-clock-in-another-file-is-utc)'s
category and is written up under *Where the suite stops* in [test-plan.md](test-plan.md).

---

### F-36 — An audit value the code no longer understands crashes the revert

**Where.** `RevertValues.asInteger`, `asEnum` and `asIds`.

**What happens.** All three guard `null` and none guarded a value that is **present but
unreadable**: `Integer.valueOf` throws `NumberFormatException`, `Enum.valueOf` and
`UUID.fromString` throw `IllegalArgumentException`, and all three escaped to the catch-all.
`POST /admin/audit-logs/{id}/revert` answered **500**.

**Why it matters.** This is F-24's lesson landing on the other side of the same class — *an NPE
guard is not an `IllegalArgumentException` guard* — and F-23's failure mode, one indirection
away. The values come from the `jsonb` column rather than from a request, so every row written
today is well formed. **But the column outlives the code that wrote it.** Rename or remove a
constant of `UserStatus`, `SemesterSeason`, `LectureType`, `ReportStatus` or `BugSeverity` — an
ordinary refactor — and every audit row naming the old one still names it. `evaluate()`
compares recorded values as **strings**, so it happily marks such an entry revertible; the
panel draws the button, and pressing it reports a backend failure.

**How it was found.** The Shape-4 sweep. Fifteen parse sites in `src/main`; eleven guard both
failure modes, and all four misses are in this one class.

**Test.** `RevertValuesTests.asInteger_nonNumericString_isRefusedRatherThanCrashing` and its
two neighbours — the three existing characterizations asserting the raw exceptions, **inverted
rather than deleted**, and checked against the un-fixed code to confirm the inversion
discriminates.

**Status. Fixed** — one `parsed(field, supplier)` helper turns `IllegalArgumentException`
(which `NumberFormatException` extends) into **409** with `ACTION_NOT_REVERTIBLE`, naming the
field. **Deliberately not a sixth `AuditRevertRefusal` constant:** the five reasons are a
documented vocabulary the panel branches on, and "the recorded value cannot be read back" is a
true instance of "this entry cannot be reversed".

---

### F-37 — `POST /auth/validate` reported an authorization failure with 200

**Where.** `IdentityService.validate`.

**What happens.** Three failure branches, all answering `200 {"success": false}`, while the
failure three lines away — a header that is not a bearer token at all — has always thrown
`InvalidAuthTokenException` and answered **401**. One method, and "no token" got the stricter
answer than "wrong token".

**Why it matters.** F-5's shape, and the last instance of it worth changing. A client cannot
branch on a status that never varies.

**How it was found.** The Shape-5 sweep over every `BasicResponse(..., false)` in `src/main` —
fourteen sites, eleven of them correct.

**And two of the three branches are unreachable**, which the sweep established by probing
rather than reading: `BearerTokenAuthenticationFilter` answers 401 for any present-but-invalid
`Authorization` header before the controller runs, and `@NotBlank` on `email` makes a missing
address a 400 from Bean Validation. Only *a valid token with an address that is not its
owner's* is observable, and the `CHANGELOG` describes only that.

**Test.** `AuthApiIntegrationTests.validatingAnAddressThatIsNotTheTokenOwnersIsRefusedRatherThanReported`
— the API-level test this route never had — plus three inverted unit characterizations.

**Status. Fixed.** 401 for an address that is not the token owner's; 400, split out, for a
missing one; 401 for an invalid token, agreeing with the filter in front of it rather than
contradicting it.

---

### F-38 — A body over the upload size limit answered 500

**Where.** `GlobalExceptionHandler` — a missing handler, the half of
[F-17](#f-17--an-unsupported-media-type-returns-500-instead-of-415) its own writeup parked as
*"still to be measured separately"*.

**What happens.** `MaxUploadSizeExceededException` fell to
`@ExceptionHandler(Exception.class)` and answered **500 "Unexpected backend error"** where the
request was simply too big.

**Why it matters.** The same shape as F-14/F-15/F-17: the right thing happens with the wrong
status, and it tells the caller the backend broke when nothing did. It appears in this
project's production logs, which is why F-17 recorded it in the first place.

**How it was found — and what it cost to find it honestly.** The plan was to extend
`ApiProtocolContractTests` the way F-17 did. **That would have been worthless.** MockMvc is
Spring's dispatcher without a server: no connector, no Tomcat, **no multipart parsing**, so
neither exception can be raised there. Probed first: a 2 MB `multipart/form-data` body through
MockMvc answers **415**, from content negotiation, because it never reaches a parser. A sweep
built on it would have gone green against a broken handler — this repository's recurring
failure mode, in a new place.

**Test.** `TransportLimitTests`, which drives a **real servlet container**
(`webEnvironment = RANDOM_PORT`). Measured: oversized → **500**, malformed envelope → **415**.
Only the first was wrong. A third test asserts the **body** as well as the status, so replacing
the narrow handler with `ResponseEntityExceptionHandler` — which would keep the status and
switch the body to `ProblemDetail` — fails.

**Status. Fixed** — one narrow `@ExceptionHandler(MaxUploadSizeExceededException.class)`
answering **413** with the project's `BasicResponse` body. 413 rather than 400 because the
request is well formed and the server is refusing it for size.

**No general `MultipartException` handler was added, deliberately.** Every route here reads a
JSON `@RequestBody`, so a malformed envelope is refused by content negotiation with 415 before
any parser runs — the right answer. There is no request that reaches the general case, and a
handler for a state nothing can produce is a claim this suite cannot check. Both answers are
pinned, so adding a multipart endpoint later has to be deliberate. The cost is stated too:
`RANDOM_PORT` forks a second Spring context, one extra application start in `server:test`.

---

### P-8 — `admin-api.md` drifted four times and nothing noticed

**What happened.** The document the panel team treats as authoritative has fallen behind the
code four times: [F-5](#f-5--failures-come-back-with-http-200) (a status that had changed),
[F-16](#f-16--the-wrong-http-method-returns-404-instead-of-405) (a 404 that had become a 405),
[F-22](#f-22--the-two-catalogue-detail-reads-answer-200-for-a-row-that-is-not-there) (a body
that no longer existed), [F-26](#f-26--ratingcount-on-a-professor-is-always-0) (a field that had
never been right). Each was corrected by hand. Nothing prevented the next one, and F-5's own
writeup says the drift is what made parking that fix the wrong call.

**Why it is a process finding rather than a defect.** Nothing in the code is wrong. What was
missing is the same thing missing from a hand-maintained route list: a mechanism. This
repository already refuses hand-kept lists in its sweeps for exactly this reason, and had not
applied the rule to its own documentation.

**Why the obvious mechanism does not work.** The generated OpenAPI schema cannot check a status
claim: the controllers declare **no** `@ApiResponse`, `@Operation` or `@ResponseStatus` across
all 80 mappings, so springdoc emits only the default `200`. `OpenApiContractTests` can check
that a route *exists* and nothing more. Annotating all 80 mappings was considered and rejected
— ~80 edits for a documentation property, the contract stated twice, and springdoc still would
not know which *condition* produces which status, which is the half of the document worth
having.

**Fixed.** An additive appendix in `admin-api.md` between `contract-table` markers — 53 rows of
`(METHOD, path) -> statuses` — and `AdminApiDocumentationDriftTests`, which checks it **both
ways** (a claimed route that is not mapped, and a mapped `/admin/**` route that is not claimed)
and provokes the statuses that can be provoked without a route's fixtures. The prose is
untouched and stays the authority on *why*; a table cannot say that the `409` on
`PATCH /admin/users/{id}` is about not locking anyone out of an API with no recovery path.

**It found a documentation error on its first run** — `POST /admin/auth/login` was recorded as
claiming `401`/`403` for the caller's session, when those are answers about the *credentials in
the body*; the document's own preamble draws that line and the table had flattened it.

**What it does not catch**, found by trying to make it fail: the `404` probe needs an id to
invent, so a `404` claimed on a route with no path variable is carried and never checked. 88
claimed statuses are unprovoked here — `200`, `400`, `409`, `429`, `502`, `503` — and that
number is itself asserted so it cannot grow quietly.

---

### F-39 — `GET /auth/me` was unmapped, and the admin panel could not sign anybody in

**Where.** `AuthController`. A route that had been removed on the assumption its only caller had
migrated.

**What happens.** `AuthController` maps five POSTs and no `/me`; `GET /me` exists only on
`AdminAuthController` under `/admin/auth`. `SecurityConfig` ends in `anyRequest().permitAll()`,
so `GET /auth/me` was not a `401` — it was an unmapped path answering **404 `Not found`**.

The panel calls it in two places. On page load the `404` is ignored, because only `401` is acted
on, and the stored session simply stops refreshing. **After a login it is fatal:**
`authenticateAdmin.ts:32-42` bare-catches it, `null` reaches `resolveAdminUser`, and that raises
`IdentityUnavailableError`, which fails the entire sign-in with "Signed in, but your admin
account could not be read." The code was accepted, the token was minted, and the operator could
not get in.

**Why nobody saw it.** Two documents in this repository disagreed and each was believed by the
side it suited. `docs/adminweb-tasks.md:81-83` said the path was gone — correct about the code —
and the panel's own copy of an older findings file said nothing was broken. Neither statement was
attached to a test, so both survived. **This is the case for the consumer contract layer**: the
suite was fully green throughout.

**Status. Fixed.** `AuthController.me` is a legacy alias delegating to the same
`IdentityService.me` its twin calls, with `SecurityConfig` matching `GET /auth/me` as
`hasRole("ADMIN")` so it carries the admin guard rather than the surrounding `permitAll()`.
`CHANGELOG` 9.09 (15).

**Test.** `AdminApiPathSplitTests.theLegacyIdentityPathAnswersWhatTheAdminPathAnswers`, which
asserts the alias against the admin path's own response rather than a literal so the two cannot
drift, and `theLegacyIdentityPathRefusesAnAnonymousCallerAndAStudent`. Both were watched fail
with `404 {"message":"Not found","success":false}` before the mapping existed. The guard was
proved separately by deleting the matcher and watching
`ApiAuthorizationMatrixTests.everyRouteIsEitherDeclaredPublicOrRefusesAnonymousCallers` name
`GET /auth/me -> 500`.

---

### F-40 — `POST /answers/report` was never served, and every report from the app failed silently

**Where.** `SocialController` maps `/answers/report` under a class-level `/social`. The Android
client has always sent it unprefixed.

**What happens.** `POST /answers/report` matched `/answers/{id}` on `ModerationAnswerController`,
which maps `PATCH` and `DELETE` and no `POST`, so it was answered **405 `Method not allowed`**
with `Allow: DELETE, PATCH`. **Reporting an answer from the Android app has never worked**, on
any release.

**Why nobody saw it, on either side.** `logic/CommentHelper.java:86-88` shows "report submitted"
and dismisses the dialog immediately after `enqueue`, before the response arrives; the real
outcome only ever reached logcat. And from this side it looked like a naming inconsistency
rather than a dead route — the client's own audit files it under F-3.8 as "the only social route
without the `/social` prefix", which reads as cosmetic. `git log -S` settles it: commit `4f1d807`
introduced the mapping already prefixed, so the path the client calls never existed.

**How it was found.** Not by the sweep. It fell out of a full route inventory taken while writing
the consumer contract layer, by reading the client's route table against this application's
mapping — which is precisely what `ConsumerContractSweepTests` now does mechanically, and would
have caught on any run.

**Status. Fixed.** `LegacyAnswerReportController`, one handler and no class-level mapping,
delegating to the same `ContentReportService.submitAnswerReport`. Its own class because a method
path is relative to its class prefix, and widening `SocialController` to serve an unprefixed
path would alias `/comments`, `/answers` and `/notifications` onto the moderation controllers
that already map them. `SecurityConfig` matches `POST /answers/report` as authenticated — the
`/answers/**` matchers cover only `PATCH` and `DELETE`, so it would otherwise have been
anonymous. `CHANGELOG` 9.09 (16).

**Test.** `SocialApiIntegrationTests.answerReportsAreAlsoServedOnTheUnprefixedPathTheAppCalls`
and `theUnprefixedAnswerReportPathRefusesAnAnonymousCaller`. Both watched fail at **405** with
`Allow: DELETE, PATCH` first, which is the evidence for the diagnosis and not just for the fix.

---

### F-41 — `GET /account/ratings` served its ratings in no defined order

**Where.** `Student.ratings`, an unannotated JPA bag, serialised straight out by
`StudentService.getUserRatings`.

**What happens.** F-21's defect, on the one list the F-35 sweep did not reach. That sweep covered
`Rating.topics`, `Comment.answers` and the comment listings; `Student.ratings` is the same shape
and was missed. The nested `lecture.professors` inside each entry **was** already correct — it
maps through `LectureResponseMapper`, which carries F-21's own comparator — so the item was
ordered inside and unordered outside.

**Status. Fixed.** `@OrderBy("createdAt DESC, id ASC")`, following the shape commit `6269ed5`
used for `Comment.answers` rather than sorting in the mapper. Newest first to match the comment
listings; the id breaks a tie so two ratings written in the same instant come out the same way
twice. `CHANGELOG` 9.09 (17).

**Test.** `AccountApiIntegrationTests.userRatingsComeBackNewestFirstRatherThanInWhateverOrderTheDatabaseChose`,
watched fail with `Oldest` where `Newest` was expected, and watched fail again with the
`@OrderBy` removed.

**One thing the fixture got wrong first, worth recording.** The first version set `createdAt` on
the managed entity after insert. `@CreationTimestamp` maps the column as non-updatable, so the
write was dropped without an error and all three rows kept their insertion instants — which
would have made the test pass on an unordered bag. The timestamps are written with `jdbcTemplate`
now. A fixture that cannot express the disorder it is testing for is a test that asserts nothing.

---

### F-42 — deactivating a catalogue row hides it from the only list the panel reads

**Not counted in the fifty above, and deliberately not written up as a finding here**, because
nothing in this repository pins it and nothing in this repository can. It has a number so the
number is not reused, and so the trail from the demo note and the board leads somewhere.

**What.** `GET /data/lectures` and `GET /data/professor` filter to `active = true`, which is
what they are for. The panel reads only those two; `GET /data/lectures/all` and
`GET /data/professor/all` — which exist precisely so a deactivated row stays reachable, per
`ModerationCatalogController:38-40` — are recorded in the panel's own contract as *"Not
called"*. So an administrator setting `active: false` from the catalogue form removes the row
from every screen the panel has, and the `PATCH {"active": true}` that would undo it needs an id
that is no longer displayed anywhere.

**Why it is not an entry with a test.** The defect is in the panel repository: this API serves
both the filtered list and the unfiltered one, and reversing the flag works. A test here would
assert that `/data/lectures/all` returns inactive rows — which
`ConsumerContractSweepTests` already covers as a served route — and would say nothing about the
client that does not call it. The rule this repository works to is that
[a finding is only really recorded if a test pins it](#at-a-glance); this one cannot be, so what
is recorded instead is **why**.

**Nothing is lost, which is the part to state precisely.** The row keeps its id, its ratings and
its comments, and `PATCH {"active": true}` restores it — `active = false` is what the API offers
*instead* of deleting. The defect is that the id is no longer on any screen the panel has, so
there is nothing to aim the `PATCH` at. It is one-way from the panel, not one-way in the system.

**Where it lives.** `docs/adminweb-tasks.md` task 2b (the work, agreed for the panel's deferred
list after submission), `docs/TODO.md` item 32 (the board, with how it was measured and the
estimate), and `docs/coursework/demo-notes.md` (do not touch the switch during the demo).

**Found by** reading the two catalogue services against the panel's called-route list while
writing the delivery documents — the same method that produced F-39 and F-40, applied to a
route pair rather than to a route.

---

### F-43 — the deployed host serves the panel at `/admin/`, so every `/admin/**` API route is unreachable in production

**Not counted in the totals above and not pinned by a test here**, for the same reason as F-42:
the defect is in the deployment topology, not in this application. The suite runs the
application in-process, where `/admin/**` maps exactly as `docs/admin-api.md` claims. Nothing a
MockMvc sweep — or even the E2E layer, which drives this application directly — can assert
reaches the proxy that fronts the deployed host.

**What.** On `https://server.example.org`, `/admin/`
is routed to the admin panel's own nginx container, which serves the static bundle built with
`VITE_BASE_PATH=/admin/` and ends its location block in
`try_files $uri $uri/ /admin/index.html`. Every path under `/admin/` is therefore answered with
the panel's `index.html`, and the backend is never consulted. Observed by curl on 9 September,
after that day's deployment:

| Request | What the API contract claims | What the deployed host answers |
| --- | --- | --- |
| `GET /health` | `200` JSON | `200 {"message":"API healthy","success":true}` — the backend |
| `GET /auth/me` | `401` JSON | `401 {"message":"Not logged in","success":false}` — the backend |
| `GET /admin/system/status` | `401` JSON | **`200 text/html`** — the panel's `index.html` |
| `GET /admin/auth/me` | `401` JSON | **`200 text/html`** |
| `POST /admin/auth/login` | `400`/`401` JSON | **`405 text/html`** from nginx |

The layer is identified by the headers, not by guessing: the `/admin/**` responses carry
`cache-control: no-store`, `x-content-type-options: nosniff`, `x-frame-options: DENY` and
`referrer-policy: same-origin` — the exact set written by the panel repository's
`docker/nginx.prod.conf.template` — while `GET /health` carries Spring's `vary: Origin`,
`pragma: no-cache` and `expires: 0`. The split is made upstream of both containers rather than
inside the panel's nginx: `GET /healthz`, which that nginx answers `200 ok`, comes back as the
backend's `404` JSON, so only `/admin/` is handed to the panel and everything else goes to the
API.

**Why nothing is broken today.** The panel calls the legacy root paths only — the deployed
bundle contains `/auth/me`, `/auth/login`, `/auth/logout`, `/auth/request-login`, `/users`,
`/system/status`, `/audit-logs`, `/ratings`, `/reports`, `/data/**` and no `/admin/` prefix at
all. None of them collides. This is the same shape as F-39 and F-40 once more: the path the
client actually calls is the one carrying production, and the documented path is the one nobody
exercises.

**Why it matters anyway.**

1. `docs/admin-api.md` presents `/admin/**` as *the* contract, and
   `AdminApiDocumentationDriftTests` checks it in both directions. Every one of those routes is
   green in the suite and unreachable on the deployed host. A green in-process assertion about a
   route the deployment shadows is precisely the gap this repository has already been bitten by.
2. `docs/adminweb-tasks.md:196` hands the panel repository the task *"Set one base path
   (`https://<host>/admin`) and move the calls above onto it."* Carried out against this
   deployment, it would aim every panel call at the panel's own static server: reads would return
   `index.html` and fail to parse, writes would return `405`. The panel would stop working
   entirely, and the failure would read as a backend outage. Task 1 of that page carries the same
   hazard: `POST /admin/auth/login`, the first call it asks the panel to move, is the `405`.

**What the fix was, now that it is decided.** Three options were open — serve the panel from a
path that does not collide (`/panel/`, or its own host) and leave `/admin/**` to the backend;
expose the backend under a prefix of its own, `/api/**`, and keep `/admin/` for the panel; or
change nothing about the routing and keep the backend on its unprefixed root paths.

**On 10 September the third was taken**, and what forced it was F-44 rather than this finding.
Fixing the panel's login required its calls to be same-origin, and the host already routes
everything outside `/admin/` here unchanged, so an empty API base worked with no host change at
all. `/api/**` would have needed the opposite: a new prefix-stripping rule on an nginx whose
configuration is version controlled in none of the three repositories. Measured, not assumed —
`GET https://ratemyprofessor.dev/api/health` answers `404 {"message":"Not found"}`, this
backend's own body, so a `/api` prefix arrives here intact today.

**So this finding does not close, it converts.** The `/admin/**` routes stay unreachable on the
deployed host, and that is now a property of the design rather than an accident awaiting
correction. Two consequences are worth naming, because each reads as a defect later:

- `AdminApiDocumentationDriftTests` stays green about routes nobody can call. It is not wrong —
  it checks this application against `admin-api.md` and the two agree — but it establishes
  nothing about production, and no test on either side can. Same gap as F-39, F-40 and F-42, and
  the reason this is written down rather than pinned.
- The migration tasks are **withdrawn**, not deferred. `docs/adminweb-tasks.md` now carries the
  decision and its reasoning, so nobody revives them from the task list alone.

**What was changed.** `docs/adminweb-tasks.md` was going out to the panel repository with both
migration tasks un-annotated, so the hazard was written onto it rather than held back for the
decision: tasks 1 and 2 are marked blocked, the observations above are reproduced on that page
with the two directions, and the decision itself is a checkbox addressed to whoever owns the
deployment. Handing over an instruction that breaks the panel is worse than handing over an
open question, and the question is the same either way.

**Found by** curling the deployed host to confirm F-39 and F-40 had shipped. Both had — and
`/admin/auth/me`, the same identity route on its documented path, answered `200 text/html`.

---

### F-44 — the deployed panel could not be logged into at all: an absolute API base URL, and an allowlist that did not know the new domain

**Not counted in the totals above and not pinned by a test here**, for the same reason as F-42
and F-43: both faults are in deployment configuration, and neither is reachable from a suite
that runs this application in-process. The application behaved correctly throughout — it
answered `403` to a cross-origin preflight from an origin nobody had allow-listed, which is what
that check is for.

**What.** The panel is served from `https://ratemyprofessor.dev/admin/`, and its bundle was
calling `https://server.example.org/auth/request-login`. Two faults stacked:

1. The panel repository's `.gitlab-ci.yml` baked an absolute `VITE_API_BASE_URL` into the
   bundle. Confirmed in the shipped artefact rather than in its source — the deployed
   `HttpService-D_uMGLro.js` held exactly one occurrence of that hostname, passed straight to
   the API client's constructor.
2. That made every call cross-origin, so the browser preflighted, and `ADMIN_FRONTEND_ORIGINS`
   held only the bw-cloud hostname. `403 Invalid CORS request`, before any controller ran. No
   login code was ever sent.

**The measurement that decided the fix.** The obvious repair — add `https://ratemyprofessor.dev`
to the allowlist — treats the symptom and leaves the panel one hostname change from the same
outage. The probes said something better was already in place:

| Probe | Result | What it establishes |
| --- | --- | --- |
| `GET ratemyprofessor.dev/health` | `200` JSON, `vary: Origin` + `pragma: no-cache` | this backend already answers at the root of the new domain |
| `GET ratemyprofessor.dev/api/health` | `404 {"message":"Not found"}` — Spring's own body | `/api` reaches the backend **unstripped**; no prefix-stripping rule exists |
| `OPTIONS /auth/request-login`, `Origin: ratemyprofessor.dev`, to the bw-cloud host | `403` | the reported failure, reproduced |
| the same preflight to `ratemyprofessor.dev` | `200` | a same-origin caller passes |
| the same host, `Origin: evil.example.invalid` | `403` | the allowlist does **not** contain `ratemyprofessor.dev` |
| DNS, both hostnames | `192.0.2.10` | one server, one nginx, two `server_name`s |

Rows four and five together are the load-bearing pair: the same list rejects a stranger and
admits the page's own origin, so the admission is Spring's same-origin path and not a permit.
**That disproves a claim this repository had been making in writing.** `docs/admin-api.md` said
the origin had to be listed *even when the panel and the API share a host*, on the grounds that
a browser sends `Origin` on non-`GET` requests regardless. The header is sent; Spring does not
reject on it when it matches the request's own origin. The page has been corrected, and the
bypass's dependency on `server.forward-headers-strategy=framework` is now recorded on the
property itself as well as in `docs/deployment.md` — behind a proxy, Spring can only reconstruct
the request's origin correctly while the forwarded headers are honoured.

**The fix.** `VITE_API_BASE_URL` is empty in the panel's CI, so every call goes out relative and
same-origin and CORS is not in the path. `ADMIN_FRONTEND_ORIGINS` narrows to
`https://ratemyprofessor.dev`: what is left over for callers that are not same-origin, not the
thing carrying the panel. **Not `/api`** — row two shows nothing strips it here. **Not `/`**
either: the panel's request builder concatenates base and path without normalising, so `/`
yields `//auth/request-login`, which a browser reads as a protocol-relative host.

**Verified before deployment, not after.** A build with the variable empty produces a bundle
whose only difference from the deployed one is that URL replaced by `''` — a one-token diff,
nothing else moved. That an empty `--build-arg` overrides the `ARG …=/api` default was confirmed
under **Kaniko**, the tool CI actually runs, rather than inferred from local Docker behaviour.
That mattered: had the empty value been dropped silently, the bundle would have shipped with
`/api` and failed in a new way, one hop further from the symptom.

**What was deliberately not done.** The second hostname is still served and is **not** closed.
The released Android client has it compiled in (`RetrofitClient.java:31`, recorded in
`docs/frontend-consumer-contract.md`), and both names resolve to one address, so a `444` would
break every installed copy. A `301` would be worse than a refusal: OkHttp downgrades a
redirected `POST` to `GET`, so logins would fail in a shape that reads as a backend outage.
Closing it is possible only behind a released Android client that points elsewhere, and that is
now the recorded precondition rather than an open question.

**Found by** reading the browser's network tab against the deployed bundle, then curling both
hostnames to separate the two faults — the wrong base URL and the missing origin presented as
one failure and were not.

---

## Negative results

A sweep that finds nothing is only worth something if what it covered is written down.
Otherwise the next person repeats it, or worse, assumes it was never done.

### The consumer contract audit — what came back clean, and how far each check looked

Three real breaks came out of reading the two consumer audits against this code
([F-39](#f-39--get-authme-was-unmapped-and-the-admin-panel-could-not-sign-anybody-in),
[F-40](#f-40--post-answersreport-was-never-served-and-every-report-from-the-app-failed-silently),
[F-41](#f-41--get-accountratings-served-its-ratings-in-no-defined-order)). Everything else both
clients raised as a risk was checked and is fine. Each is written with what was looked at,
because that is the half that makes a clean result worth anything.

**Bodyless writes are accepted with no `Content-Type` header.** Both audits asked this, and it
was the highest-count risk either raised: five panel calls and three app calls send no
`Content-Type`, because both clients build the header only when there is a body. If F-17's 415
caught them, eight client calls break at once — and `POST /auth/logout` fails *silently*, since
the panel swallows its failures, leaving a live token behind an operator who believes they signed
out.

It does not, and the reason is structural rather than lucky: Spring raises
`HttpMediaTypeNotSupportedException` only when something has to read the body, which needs a
`@RequestBody` or a `consumes`, and **no mapping in this application declares `consumes` at all**
(`grep -rn "consumes\s*=" src/main/java` returns nothing). Scope: all **35** mapped non-GET
routes that declare no `@RequestBody`, generated as the complement of `bodyReadingRoutes()` so a
new one arrives on its own —
`ApiProtocolContractTests.everyRouteThatReadsNoBodyIsAnsweredWithoutAContentTypeHeader`.

Why nothing pinned this before is worth stating: `ApiProtocolContractTests`,
`ApiErrorMessageContractTests` and `AdminApiDocumentationDriftTests` all gate on
`readsBody(handler)`, so these 35 routes were skipped by all three **by construction**.

*Proved it can fail, and the first attempt could not.* With `consumes` added to two routes the
sweep named only one, because the loop authenticated as a single admin and
`PATCH /account/deleteAccount` answers 200 and deletes that account — after which every remaining
route answers 401, which is not 415. It now mints a fresh account per route and names both. A
sweep whose own fixture destroys its session is looking at a fraction of its subject and reading,
from outside, exactly like one that checked everything.

**Audit entries always carry `changes`, `metadata` and `actor`.** The panel enumerates `changes`
with `Object.keys` on every row of the audit table and reads `actor.name` unguarded, so an absent
key blanks the screen rather than spoiling one row. Three layers guarantee presence: field
initialisers on `AuditLog`, `AuditWriter.persist` normalising null to `{}`, and `jsonb NOT NULL`
columns. Jackson's default inclusion is `ALWAYS` — there is no `spring.jackson.*` key anywhere
and the only `@JsonInclude` in `src/main` is on `ApiErrorResponse`. Scope: every entry returned
by both `/admin/audit-logs` and `/admin/activity-logs`, asserted as **key presence** rather than
non-nullness, because `jsonPath` cannot tell a null from a key that was never written —
`AdminApiIntegrationTests.everyAuditEntryCarriesChangesMetadataAndAnActor`. Proved it can fail by
putting `NON_EMPTY` inclusion on `AuditLogResponse`, which dropped `metadata` from the
`USER_DELETED` entry exactly as predicted.

**`actor` cannot be null, and there is no system-originated entry.** Five `NOT NULL` actor
columns, one persistence path (`AuditWriter.persist`, the only place an `AuditLog` is saved
outside the revert service), and `AuditActorType` declares only `ADMIN` and `USER` — there is no
`SYSTEM`. Both refusal writers return early when there is no known account:
`AccessRefusalAuditor` when the principal is not an `AuthenticatedUser`, and
`SessionIssuer.auditLoginRefusal` on an unknown address. The rule is stated in `AuditAction`'s
own comment: an anonymous 401 has no actor and would let anyone fill the table.

**No comment, answer or report can arrive without an author.** Deletion anonymises in place —
`StudentLifecycleService` scrubs the username to `"Deleted user <8-hex>"`, sets the address to an
`@invalid.local` form and the status to `DELETED`, and keeps the row so every foreign key stays
valid. The app-tier comment and answer DTOs carry no author object at all, only a flat
`studentUsername`, behind `@ManyToOne(optional = false)`. Scope: the four moderation DTOs that do
nest a `UserReferenceResponse`, plus an end-to-end check that a comment survives its author's
deletion with a renderable author —
`AdminApiIntegrationTests.contentOfADeletedAccountStillCarriesAnAuthor`. The two genuine nulls in
this area are elsewhere and both are already handled by the panel: `WarningResponse.createdFrom`,
which is nullable by design, and `BugReport.reporter`, which the mapper turns into `"Unknown"`.

**A 2xx login always carries `authToken`.** There is exactly one `new LoginResponse(...)` in
`src/main`, at `SessionIssuer:192`, and every other exit from the login path throws
`ApiException`. Already pinned before this pass by `AuthApiIntegrationTests`, which asserts
`$.authToken` `.isString()` — recorded here rather than duplicated, because the panel raises
`ContractError` without it and the app writes `null` and then sends `Bearer null` on every
later request.

**`own` is not captured as a lecture id.** `/ratings/own/{lectureId}` is three segments and
`/ratings/{lectureId}` is two; they cannot collide. The neighbour that can is real and already
recorded — `GET /ratings/rate` falls into `/ratings/{lectureId}` and answers 400 — which is why
this is pinned rather than argued: `ApiProtocolContractTests.theOwnRatingsSegmentIsNotCapturedAsALectureId`
asserts the two reachable handlers by their different answers, and that the two-segment form
`/ratings/own` is refused for not being a UUID.

**An empty trailing path segment is not a route.** Both clients can produce one — the app sends
`PATCH /social/notifications/` when a notification id is missing, and the panel interpolates ids
without escaping, so an empty id gives `/users/`. Both answer **404 `Not found`**, not 500 and
not the collection route; the collection paths themselves answer 405 for those verbs, so the two
mechanisms stay distinguishable from the response.
`ApiProtocolContractTests.anEmptyTrailingSegmentIsNotFoundRatherThanTheCollectionRoute`.

**`POST /social/comments` and `POST /ratings/rate` have no `200 {"success": false}` path left.**
Both throw `ApiException(NOT_FOUND)` for an unknown lecture (F-28's fix, and the same shape one
service over). This matters more than it looks: the app reads neither response body, so a failure
that answered 2xx would show the user "Your comment is sent." The only `BasicResponse(..., false)`
returned from a controller in `src/main` is `AdminService`'s, behind `GET /admins/validate`, and
it is unreachable — the chain answers 403 first, pinned by `AdminApiPathSplitTests`.

**Every list key both clients bind to is served under that name**, including the three that do
not match their path: `GET /reports` → `bugReports`, `GET /comments/reported` → `comments`,
`GET /answers/reported` → `answers`. So are the three the app binds with `@SerializedName` —
`notificationID`, `ownCommentID` and `lectureResponse` — and the two spellings its profile
payload depends on, `ratingsCount` and `commentsWritten`. These are not separate tests: they are
consumer-read fields, so `ConsumerContractSweepTests` covers them along with the other 300-odd,
and a rename of any one of them names it. Two keys neither client listed are served and worth
knowing about: `activityLogs` (the activity endpoint re-wraps specifically to rename the array)
and `actorTypes`, a fourth key on `/audit-logs/meta`.

**What the sweep found that reading had not:** two fields the admin panel reads from
`GET /ratings` that this API has never served — `author` (the field is `student`) and `scores`
(the field is `topics`). Both reads are optional-chained on the panel side, so they degrade
rather than fail: the author column shows "Unknown" on every row and the scores column is empty
on every row. `docs/admin-api.md` has documented `student` and `topics`, with a worked example,
since the endpoint existed, so this is the panel's to fix; it is reported in
`docs/adminweb-tasks.md` and held in `READ_BUT_NOT_SERVED`, which is asserted as an exact set so
the entry has to be deleted when the panel moves.

**One scope limit found while doing this, not a finding but worth knowing.**
`AdminApiDocumentationDriftTests.everyAdministrativeRouteTheApplicationMapsIsInTheDocument`
filters on `route.contains(" /admin")`. Its reverse direction therefore covers only
`/admin`-prefixed routes — the entire legacy surface the panel actually calls is outside it. That
is why adding `GET /auth/me` did not make it red, and it is part of the case for the consumer
sweep covering the legacy paths by name.

### Batch 6 raised no finding

The security path (`TokenAuthenticationService`, `AccessRefusalAuditor`), the bug-report path
and the remaining arms of `AuthService` were brought to zero missed branches and **every
behaviour matched what the code's own comments said it should do**. After F-18 turned up in
batch 5 the reasonable expectation was another defect here; there was none.

What the batch did produce is two pieces of characterization, recorded in
[test-plan.md](test-plan.md) rather than as findings because neither is wrong:

- A token carrying **no session type** — the shape the older test helper mints — is treated as
  neither `APP` nor `ADMIN`: the admin row is looked up and a missing one is not a refusal.
- `AuthService.validate`'s `student == null` arm is reachable only through a **well-formed**
  header carrying a token nobody holds; a malformed header throws out of `verifyUser` first.

Both are pinned. If session types are ever made mandatory, the first test is the one that has
to change, and it names the decision instead of leaving it to be rediscovered.

### The cursor endpoints page correctly against PostgreSQL

BUG-1 asked whether the cursor works on the backend. The unit layer had settled the format and
every rejection, and `AuditTimestampPrecisionPostgresTests` had ruled out the timestamp
explanation. What none of that reached was the predicate itself: producing a cursor and
*applying* it are separate things, and the application half is a Criteria predicate that needs
a database.

`CursorPaginationPostgresTests` now drives all four cursor-paginated endpoints against a real
PostgreSQL 16, ten tests:

| Route | Cursor column | Covered |
|---|---|---|
| `GET /admin/activity-logs` | `Instant` | distinct timestamps, and all rows sharing one microsecond |
| `GET /admin/audit-logs` | `Instant` | same two |
| `GET /admin/ratings` | `LocalDateTime` via `createdAtLocal()` | same two |
| `GET /admin/users` | `LocalDateTime` | same two, **in both sort directions** |

Each pages the whole list with `limit=1` and compares the ids served to the ordering the
database itself produces, element for element — so a repeat, a skip and a wrong boundary are one
assertion rather than three. The shared-microsecond half is the important one: the tiebreaker
branch `createdAt = cursor AND id < cursor.id` is unreachable while timestamps differ, and it is
the branch BUG-1's description is about.

**Nothing reproduced.** Every endpoint served every row exactly once, in the right order, in
both directions.

**The sweep was checked against the defect it exists to find**, because a green pagination test
is worth nothing until you know it can go red. Changing `lessThan` to `lessThanOrEqualTo` in
`AuditLogService`'s cursor predicate — the off-by-one that re-serves the boundary row — turned
exactly the four audit tests red with `served 16 rows in 15 pages without reaching the end`, and
left the six moderation tests green, which is the right blast radius for a change in that one
service. The mutation was reverted.

BUG-1 therefore still has no explanation on the backend, and now has one fewer place to hide.

### Two requests at once collide, and every protection holds

Nothing in the suite had ever run two requests concurrently — there was no `ExecutorService`
in `src/test` at all. That left every concurrency protection in the application verified
against a **mocked** exception: `RateLimitServiceTests` drives the retry loop by stubbing
`DataIntegrityViolationException` with `thenThrow`, which proves the handler and says nothing
about whether the race throws it.

`ConcurrencyPostgresTests` runs four races against a real PostgreSQL 16. The starting
hypothesis was a defect, and it was specific: `RateLimitService.increment` is a
read-modify-write on an entity carrying `@Version`, its retry loop catches only
`DataIntegrityViolationException`, and `ObjectOptimisticLockingFailureException` is on a
disjoint branch of Spring's hierarchy (`TransientDataAccessException`, not
`NonTransientDataAccessException`) with no handler in `GlobalExceptionHandler` — so a lost
update race would escape as a 500. `AuthService.requestLogin` consumes against an **IP**
subject, one row shared by everyone behind the same egress address, so on a university network
this is two students asking for a login code in the same second, not a double-tap.

**Nothing reproduced. All four races are handled, by three different mechanisms:**

| Race | What holds it | Verified by |
|---|---|---|
| Two increments of an existing bucket | `@Lock(PESSIMISTIC_WRITE)` on `findByOperationAndSubjectHash` — `SELECT … FOR UPDATE`, so the second transaction blocks and re-reads | `attempts` ends at 3 for 3 calls |
| Two first increments, no row yet | `FOR UPDATE` locks nothing when there is no row, so the unique constraint refuses one and `consume`'s retry succeeds on the second attempt | one row, `attempts` = 2 |
| Two first votes on one comment | `uk_comment_votes_student_comment`; no lock and no retry on this path | one row, and the failure is the kind answered 409 |
| Two first ratings on one lecture | `uk_ratings_student_lecture` | one row, same |

**The races really race.** Each of the three constraint-backed cases logs its collision
(`duplicate key value violates unique constraint …`) and did so in **20 of 20** repeated runs,
so the window is not occasional. The control matters more: with the `CountDownLatch` removed so
the two tasks run in sequence, all four tests **still pass and zero collisions occur**. That is
the silent failure mode of a concurrency test, and it is why the latch is described in the
class rather than left as an implementation detail.

**Both rate-limiter protections were checked by breaking them**, because a green concurrency
test is worth nothing until it can go red:

- Removing `@Lock(PESSIMISTIC_WRITE)` produces exactly the predicted failure —
  `ObjectOptimisticLockingFailureException: Unexpected row count (expected row count 1 but was
  0)`, escaping to the caller. So the hypothesis was right about the mechanism and wrong only
  about whether it is live: **one annotation on a Spring Data derived query is the whole
  protection**, and until this class nothing tested it. A refactor that replaces that method
  with a `@Query`, or renames it, reintroduces a 500 on the login path silently.
- Neutering the retry loop turns the first-increment test red.

That is the value of the negative result: not "concurrency is fine" but "concurrency is fine
**because of these three specific things**, each of which now has a test that fails when it is
removed." [P-7](#p-7--a-surviving-mutant-is-not-a-finding) records a related loose end —
mutation testing reports that removing `setPropagationBehavior(PROPAGATION_REQUIRES_NEW)` from
`RateLimitService`'s constructor kills no test, and that propagation is what gives `consume` its
own transaction. It is outside this class's reach because these tests call `consume` rather than
constructing the service.

### No route writes inside a read-only transaction

[F-9](#f-9--a-write-inside-a-readonly-transaction) was a write inside a
`@Transactional(readOnly = true)` method. It was fixed by removing the write, but the general
question stayed open: there are **27** such methods in `src/main/java` and only that one had
been looked at, and the finding itself records why a unit test cannot answer it — dirty checking
is Hibernate's business, not a mock's.

PostgreSQL makes it answerable. It marks the transaction read-only on the server, so a write
reaching one fails with `cannot execute UPDATE in a read-only transaction`, which arrives as a
500. `ReadOnlyTransactionSweepPostgresTests` reads every GET from
`RequestMappingHandlerMapping`, fills path variables from a fixture, and drives all of them with
an administrator session.

**47 readable routes, no 5xx.** There is no second F-9.

The sweep records its own coverage rather than implying it: exactly one route answers something
other than 2xx (`GET /data/professor/id`, which needs two query parameters the sweep does not
send, and which is not transactional anyway), and that exclusion is asserted rather than
tolerated. Without it, every route could be answering 400 and "no route returned 500" would
still be green.

### Batch 7 raised no finding, and the E2E layer raised none of its own

Both are worth saying, because both were expected to.

**Batch 7** brought `AuditLogService` (which had no unit test class at all),
`ModerationUserService`'s warning lifecycle (which had none either) and `SocialService`'s
response builders under test — 39 tests over code that had only ever been driven through the
API. Every behaviour matched what the code and its comments already said. After F-18 and F-19 the
reasonable expectation was another defect in an untested corner; there was none.

**The six end-to-end journeys** found no defect either. What they did turn up is two facts about
the system that were easy to assume wrongly, and both are now written into the tests that
depend on them:

- **Asking for a login code creates nothing.** The account is created when the code is
  *redeemed*, not when it is requested — which is what stops anyone minting accounts for
  addresses they do not own. The first journey asserts both halves.
- **An anonymous refusal is not audited.** `AccessRefusalAuditor.record` returns early when there
  is no authenticated principal, so a 401 leaves no trace while a signed-in student's 403 does.
  That distinction is deliberate and is now pinned rather than inferred; it is also what made
  F-19's first fix attempt useless, because an anonymous probe seeded no row.

The E2E layer's value showed up as *design confirmation* rather than defects, which is the
outcome to expect from a layer added after the ones below it are already green. The one thing it
is uniquely positioned to catch — a whole journey breaking where each step passes on its own —
it now watches on every pipeline run.

### The ownership / IDOR sweep found no defect

`ApiOwnershipMatrixTests` asks the question `ApiAuthorizationMatrixTests` does not: once a
caller *is* authenticated, can they reach a row belonging to somebody else? **No route was
found that lets them.** No finding was raised; the sweep contributed no number of its own,
and F-18 was taken later by batch 5.

**What was covered.** All 61 id-taking routes, read from Spring's handler mappings rather
than listed by hand, each classified into one of four sets with the reason recorded next to
it:

| Class | Count | Why cross-user access is or is not possible |
|---|---|---|
| Owner-scoped | 1 | `PATCH /social/notifications/{id}` — the one per-user row the app tier addresses by id |
| Cross-user by design | 2 | The two vote routes; voting on somebody else's comment is the feature |
| Admin tier | 52 | Governed by role, not ownership; acting on another account is the job |
| Not owned by a user | 6 | The id names a lecture or a professor — catalogue rows belong to nobody |

**Why the owner-scoped column is one line long, and why that is not luck.** In the app tier
the caller's identity comes only from `@AuthenticationPrincipal`. No handler takes a student
id as a path variable, a query parameter or a body field — checked by reflection over every
app-tier handler method and its `@RequestBody` type, not by reading the code. There is simply
nothing for a caller to tamper with. `noAppTierHandlerTakesACallerIdentityFromTheRequest` is
the test that keeps it that way; it is the one worth having, because the individual probes
only cover today's routes while the invariant covers tomorrow's.

**What was verified positively, not just asserted:**

- `PATCH /social/notifications/{id}` with the wrong student's token leaves the row untouched
  (`findByRecipientAndId` scopes the lookup to the caller), while the owner's own call still
  works — both directions, so the refusal is not "broken for everybody".
- `GET /ratings/own/{lectureId}` is scoped by the principal, not by the path. Tested by
  giving two students the same lecture id rather than by swapping ids, because the path
  offers no way to name another student.
- `GET /social/notifications` returns an empty list to a student whose notifications belong
  to someone else. It takes no id at all, which is exactly why it earned a test: the scoping
  is invisible in the route and lives entirely in the query.
- The administrative routes refuse a student **with a real victim id** with 403, and the
  victim's row is unchanged afterwards. Knowing a real id buys nothing over knowing a random
  one, which is what it means for the refusal to happen before the handler looks the id up.

**One thing the sweep will not tell you, deliberately.** The notification refusal comes back
as HTTP **200** with `success:false` — the refusal is real, the status code is not. So
`markingAnotherStudentsNotificationAsSeenDoesNotTouchTheRow` asserts on the *row*, never on
the status: a status is not evidence of anything on this endpoint. That is [F-5](#f-5--failures-come-back-with-http-200),
already open, and this sweep is a second place it hurts — a client cannot distinguish
"refused, not yours" from "done".

---

### The five defect shapes, swept to the end

The 9 September pass found seven defects by taking five known defect *shapes* and looking for
the same shape elsewhere. None of the five was swept exhaustively. This is what each sweep
covered and what was left after it — the coverage matters as much as the findings, because an
unrecorded sweep gets repeated or, worse, assumed.

| Shape | Scanned | Found |
|---|---|---|
| A guard in one twin and not its neighbour (F-23) | 13 twin pairs, line by line | F-31, F-32, plus one documented-and-deliberate asymmetry |
| A field read but never written, or written but never read (F-26) | every persistent field on all 21 entities, cross-checked against both Flyway baselines | F-33, F-34, plus 8 dead-data fields recorded |
| An order-undefined collection reaching the client (F-21, F-27) | 5 mappers, **all 76 DTO records**, every `*Response`-building method, all 15 repositories | F-35 (four instances) |
| An unguarded parse of caller input (F-24, F-25) | every `UUID.fromString`, `Integer`/`Long` parse, `Enum.valueOf`, `*.parse` and Base64 decode in `src/main` — **15 sites** | F-36, in one class; **11 of the 15 already guard both failure modes** |
| A failure answered `200 {"success": false}` (F-5, F-22, F-28) | **every** `BasicResponse(..., false)` in `src/main` — 14 sites | F-37; 11 were already correct, and 2 of the remaining 3 turned out to be unreachable |

Two of these are worth reading as negative results in their own right.

**The parse sweep is nearly clean, and the detail is the point.** `Uuids` guards null/blank
explicitly *and* catches `IllegalArgumentException`. `KeysetCursorCodec` catches
`RuntimeException` **deliberately broadly**, and its own comment records why: a
`DateTimeParseException` is not an `IllegalArgumentException`, so a narrower catch would have
missed it. `KeysetPage`, `AuditLogService` and `UserListQuery` each pair a null/blank guard
with a typed catch. Every `@PathVariable UUID` is converted by Spring and every
`@RequestBody` enum by Jackson, both answering 400. The migration F-24 started really was
finished on the request path; the four misses are all behind the audit column, not the request.

**The `200 {"success": false}` shape is effectively closed.** After F-37, one reachable
instance remains in the whole application — `GET /ratings/own/{lectureId}` — pinned with the
reason it was left. The other two a reader would flag cannot be reached at all, and that is
now recorded in tests rather than in nobody's head.

### Every error body in the API is the shape the clients expect

`ApiErrorMessageContractTests` is a fifth sweep, after "does it work", "who may call it", "what
status does it answer" and "does it describe itself correctly": **what does it say when it
refuses?** The messages are what the panel puts in front of an operator and the object they
arrive in is what the Android client parses, and neither was audited.

Route list from `MappedRoutes`, as the house rule requires. It provokes the four refusals that
need no per-route fixture — anonymous, a verb the path does not map, a body in a media type
nothing reads, malformed JSON in the right one — and asserts over every response: the body is a
JSON object carrying `message` and `success`, `success` is `false`, **no field outside**
`{message, success, reason}`, and the message follows the house style (non-blank, opening
capital, no trailing full stop, ASCII, no unfilled placeholder, under 200 characters).

**Result: 189 refusals provoked, and every one conforms.** Nothing to fix. What the sweep
protects is a property that was true by luck: all 49 distinct `ApiException` messages are
string literals with no concatenation or `String.format`, and there are **no custom Bean
Validation messages at all** — every validation failure collapses to the single literal
`"Invalid request"`, so Hibernate Validator's locale-dependent defaults ("must not be blank")
never reach a client.

**Checked against a defect rather than trusted for being green:** `"Method not allowed"` was
temporarily changed to `"method not allowed."` and the sweep named it and its origin. The floor
assertion was checked the same way — raising it reports the real count, 189 — so the sweep
cannot go quiet if the handler mapping stops resolving.

What it deliberately does not cover: the statuses needing a route's own fixture — a 409 on a
duplicate name, a 502 from the tracker, a 429 from the limiter. Four of the eight statuses in
`admin-api.md`'s preamble are provoked here, and a sweep claiming the other four would be
asserting against its own setup.

## Process findings

### P-1 — The coverage baseline number was wrong

The number batch 2 started from was 85.7% LINE (2916/3403). The real measurement — after the
deletion — was **87.76%** (2932/3341). The gap to the 90% target was not 147 lines but **75**;
that is, about half the planned work was enough.

**Lesson.** Batch arithmetic has to start from a measured number, not an inherited one.
Measuring is now the first step of a batch.

### P-2 — Integration tests hide unit targets

"There is no unit test" and "the lines are not covered" are not the same thing. The suite has
ten `@SpringBootTest` classes — `DemoApplicationTests` is `@Disabled`,
`PostgreSqlMigrationSmokeTests` runs on CI only, and the remaining **eight** bring the whole
context up on every local run — and their coverage is inside the bundle. The sharpest example:

Both `currentValues` and `applyInverse` of `UserRevertHandler` were being driven end to end by
`AdminApiIntegrationTests.aFieldEditIsRevertibleAndTheReversalIsItsOwnAuditEvent` (`:2509`). The
gain expected from the source line count was ~29 lines; the real gap was **2 lines** (the
`UserStatus.DELETED` `continue` and the `UserRole.ADMIN` ternary arm).

Likewise, `StudentService.getUserRatings`'s happy path and `getAverageRating`'s summation were
covered by `LazyLoadingRegressionTests`.

**Lesson.** Targets have to be picked from `LINE_MISSED` in `jacoco.csv`:
```
awk -F, 'NR>1 && $8>0 {printf "%4d %s.%s\n", $8, $2, $3}' \
  target/site/jacoco/jacoco.csv | sort -rn | head -25
```
That moves `UserRevertHandler` to the bottom of the list and `CatalogueRevertHandler` to the
top — the work had been running on the opposite intuition.

Worth noting: `UserRevertHandlerTests` was written despite the 2-line gain, because those two
lines were the `DELETED` and `ADMIN` branches — so the value was not coverage but writing down
**why** the branches are the way they are.

**The mirror image, found in batch 6.** `ModerationBugReportService` sat at 3 missed lines and
**15 missed branches**: driven only through `AdminApiIntegrationTests`, its lines looked settled
while five separate ways of refusing a student's bug report had never been executed. So the
`LINE_MISSED` ranking above catches only half of the pattern. The other half needs the branch
column, which is why batch 4 was selected by it — and why batch 6 was selected by neither, the
gaps being too thin by then for either counter to point anywhere useful:
```
awk -F, 'NR>1 && $6>0 {printf "%4d %s.%s\n", $6, $2, $3}' \
  target/site/jacoco/jacoco.csv | sort -rn | head -25
```

### P-3 — Lombok is not filtered in JaCoCo

The repo has no `lombok.config` and `lombok.addLombokGeneratedAnnotation` defaults to `false`.
So every entity's generated getters and setters are lines counted in the bundle — a large part
of why the denominator is 3341.

**Closed — decided against, not deferred.** Filtering looks like a shortcut, but because
accessors are heavily covered through serialization it deletes more *covered* lines than
uncovered ones and could **lower** the ratio — and it would quietly change what the number
measures. For the same reason the `<excludes>` list was not widened either (adding
`**/model/**` or `**/dto/**` would have bought several points without a single test). These
would not clear the ratchet, they would redefine it.

This is the only entry in this document closed by a decision rather than by a change, and it
is stated as a decision so nobody re-derives it: reopening it means adding `lombok.config` with
`lombok.addLombokGeneratedAnnotation = true` **and** re-baselining both gates against the new
denominator, in that order and as its own piece of work.

### P-4 — A "moved" test file was copied, not moved

`docs/test-plan.md` recorded that `StudentServiceTests` "sat in the `com.pse` root while the
class lives in `com.pse.user.service`. It was moved". It was not moved — it was copied, and so
was `AccountServiceTests`. Both originals stayed in `com.pse.user` and kept running: 16 tests
pinning behaviour that the rewritten versions in `com.pse.user.service` already pin, in the old
style the rewrite existed to replace (`@InjectMocks`, JUnit `assertEquals`, camel-case names).

**Why it is worth a number.** Not the runtime — 16 fast unit tests cost nothing. The problem is
that a duplicate makes the suite lie about itself: two classes state the same contract, and
nothing says which one to edit when the contract changes. The likely outcome is one being
updated and the other left behind, at which point the suite contains two different answers to
the same question and both are green.

**Fixed** in batch 5: the two originals were deleted. The proof that they were pure duplication
is that the bundle did not move — `StudentService` and `AccountService` stayed at 0 missed lines
and the same branch counts, before and after, to the line.


### P-5 — Coverage measured without `clean` is not the coverage CI measures

**What happened.** This document and [test-plan.md](test-plan.md) recorded the bundle at
**95.78% LINE / 89.50% BRANCH**. A `./mvnw clean verify` on the same commit reports **95.52% /
89.33%**. Both numbers came from the same command on the same code; only the state of
`target/` differed.

**Why.** `jacoco:prepare-agent` appends by default, and `pom.xml` does not override it, so
`target/jacoco.exec` accumulates every run until something deletes it. A `verify` that follows a
targeted `-Dtest=` run therefore reports the union of both runs. That is exactly how the higher
number arose: the PostgreSQL tests skip themselves during a normal `verify`, but they had been
run explicitly beforehand, and their coverage was still sitting in the exec file.

Measured both ways in one session, on this commit: with the accumulated file, 96.13% / 90.26%;
after `clean`, 95.52% / 89.33%.

**Why it matters more than a rounding difference.** CI runs in a fresh container and therefore
always measures the clean number. A developer measuring locally gets the inflated one, and the
gap points the wrong way — it says the target is met when it may not be. This is
[P-1](#p-1--the-coverage-baseline-number-was-wrong) again in a different disguise: a coverage
number is only worth what the conditions it was measured under are.

**Status. Fixed** — every figure in both documents is now a `clean verify` figure, and the
sentence saying so sits next to them in test-plan.md. Quote no coverage number that did not
come from `./mvnw clean verify`.

### P-9 — A cache is not an input

**What happened.** The first CI run of `dependency:scan` failed with `FATAL Error remote Maven
repository returned 429 Too Many Requests for
https://repo.maven.apache.org/maven2/org/springframework/integration/spring-integration-bom/7.0.6/spring-integration-bom-7.0.6.pom.
Retry-After: 1800.` The job's own comment named a different suspect — Trivy's vulnerability
database being rate-limited from a shared runner IP — and that download had finished four
seconds earlier, in the same log.

**Why.** Trivy reads `pom.xml` and resolves the parent-pom chain itself. With a warm `~/.m2` it
resolves locally and fetches nothing, which is how it was verified before the job was written,
and the job was built to guarantee that warm repository two ways: it caches `.m2/repository`,
and `needs: server:test` orders it after the job that fills the cache. Neither guarantees
anything. `needs:` orders two jobs; it does not put them on one machine. And the runner log says
`No URL provided, cache will not be downloaded from shared cache server` — there is no
distributed cache here, so a cache exists only on the Kubernetes node that wrote it.
`server:test` warmed one node, the scan started on `runner.example.org` with `Cache file does
not exist`, and a cold resolution went to an IP the whole runner cluster shares.

**Why it matters beyond this job.** A cache is allowed to miss — that is what makes it a cache
rather than an input. Anything a job needs in order to be *correct* has to arrive by a route
that cannot silently be empty, and in GitLab that route is an artifact. The tell was in the job
comment all along: it explained why the cache would be warm. A comment that argues an
optimisation will always be there is describing a dependency.

**Status. Fixed** — `server:test` writes the resolved tree to
`target/classes/META-INF/sbom/application.cdx.json` (cyclonedx-maven-plugin, version managed by
`spring-boot-starter-parent`) and publishes it as an artifact; `dependency:scan` runs
`trivy sbom` on it and resolves no Maven coordinate at all. Checked locally in both directions,
because a scan that looks at less and a scan that cannot fail both read as a pass: the SBOM
scan's package list is identical to the old `trivy fs .` list except that it adds
`org.projectlombok:lombok`, which Trivy's pom parser dropped (107 packages, 0 findings, the same
0); and rebuilding the SBOM against `spring-boot-starter-parent` 4.0.6 — the version 4.0.8
replaced — still exits 1, on 13 HIGH. **Unverified in CI**, like everything here: no token.
Item 10 in [TODO.md](TODO.md).

---

---

## Unreachable states deliberately not tested

Points that look like defects when reading the code, but for which no test was written because
they cannot be reached from a persisted row. A test would be asserting over its own fixture;
writing them down here shows the decision was deliberate.

| Point | Why it is unreachable |
|---|---|
| `WarningRevertHandler` — a `warning.getStudent()` NPE | `Warning.student` is `@ManyToOne(optional = false)`; a row with a null student cannot exist |
| `CatalogueRevertHandler` — `getSemesterSeason().name()` with no null guard | the column is `nullable = false` |
| `CatalogueRevertHandler` — `getLectureType().name()` with no null guard | the column is `nullable = false`, and there is a `LECTURE_ONLY` default on the Java side |
| `AccountService` — a `student == null` NPE | the principal comes from the security chain and cannot be null |
| Private constructors of static-only classes | JaCoCo has filtered them since 0.8.0; a reflection test would be fake coverage |
| `AdminService.validateAdmin` — the `"Is Not Admin"` body | `SecurityConfig` matches `/admins/**` with `hasRole("ADMIN")`, so a caller without the role is refused **403** by the chain and an invalid token **401** by the filter, both before the controller runs. The same dead second answer `LectureService.addLecture` carries a comment about. Pinned at 403 by `AdminApiPathSplitTests` — the test was written expecting 200 and went red, which is how the branch was shown to be unreachable |
| `IdentityService.validate` — the invalid-token and missing-email branches | `BearerTokenAuthenticationFilter` answers 401 for any present-but-invalid `Authorization` header, and `@NotBlank` + `@Valid` make a missing address a 400, both ahead of the method. Corrected anyway under F-37 so the method agrees with the layer in front of it, but only the wrong-address branch is observable |
| `ReportStatusRevertHandler` — a `report.getComment()` / `getAnswer()` NPE | `comment_id` and `answer_id` are `NOT NULL` in both baselines; a report row without its content cannot exist |
| A general `MultipartException` other than the size one | every route reads a JSON `@RequestBody`, so content negotiation answers 415 before any multipart parser runs. Measured over a real servlet container in `TransportLimitTests`, not assumed — which is also why no handler claims it (F-38) |
