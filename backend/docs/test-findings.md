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

**37 findings. 33 fixed, 2 closed as a recorded decision (P-3, P-7), 1 an existing protection
put under test (F-13), 1 open (F-29, which needs a rotation rather than a commit).** Two of them
— F-7 and F-8, both behind the "approximate location does not work" report — are the ones a
*user* reported. The other thirty-five nobody had seen.

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
| **Secret scanning, once the rules matched this project** | 1 | F-29 |
| **Concurrency layer** (two requests at once, real PostgreSQL) | 0 | — see [Negative results](#negative-results) |
| **Doing the measuring** — process findings about the suite itself, and about its own assertions | 6 | P-1, P-2, P-3, P-4, P-6, P-7 |

The row of seven is the 9 September pass and it was not a new test layer: two of the seven were
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
| [F-16](#f-16--the-wrong-http-method-returns-404-instead-of-405) | The wrong HTTP method returns 404 instead of 405 | Medium — wrong HTTP code, on all 122 routes | **Fixed** |
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
| [F-29](#f-29--three-more-leaked-credentials-nobody-had-found) | Three more leaked credentials, in commits the rotation list did not name | High — unrotated, and one is in a document | **Open — needs rotation** |
| [P-1](#p-1--the-coverage-baseline-number-was-wrong) | The coverage baseline number was wrong | Process | **Fixed** (re-measured) |
| [P-2](#p-2--integration-tests-hide-unit-targets) | Integration tests hide unit targets | Process | **Fixed** (method changed) |
| [P-3](#p-3--lombok-is-not-filtered-in-jacoco) | Lombok is not filtered in JaCoCo | Process | **Closed — decided against** |
| [P-4](#p-4--a-moved-test-file-was-copied-not-moved) | A "moved" test file was copied, not moved | Process | **Fixed** (duplicates deleted) |
| [P-5](#p-5--coverage-measured-without-clean-is-not-the-coverage-ci-measures) | Coverage measured without `clean` is inflated by the previous run | Process | **Fixed** (figures re-measured) |
| [P-6](#p-6--a-sweep-asserted-not-refused-which-a-404-also-satisfies) | A sweep asserted "not refused", which a `404` also satisfies | Process | **Fixed** |

**Nothing in this document is open.** Twelve were closed in one pass; P-5 came later from the
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
1194 mutants, 797 killed, 73 survived, 324 with no coverage. One survivor read as serious --
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

**What happens.** `docs/TODO.md` records five leaked credentials and says, correctly, that
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

## Negative results

A sweep that finds nothing is only worth something if what it covered is written down.
Otherwise the next person repeats it, or worse, assumes it was never done.

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
