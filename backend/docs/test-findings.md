# Test findings

The defects the unit test batches turned up, in one place. [test-plan.md](test-plan.md)
describes what is tested and how; this document holds only **what the tests found** and
where each finding stands.

Every finding is given together with the name of the test that pins it: a finding is only
really recorded if it lives in a test.

## Summary

| # | Finding | Impact | Status |
|---|---|---|---|
| [BUG-3](#bug-3--professor-assignment-order-silently-refuses-a-revert) | Professor assignment order refuses a revert | High — looks flaky to the user | Open, characterized |
| [F-1](#f-1--voting-writes-no-audit) | Voting writes no audit | High — moderation blind spot | Open, characterized |
| [F-2](#f-2--votetype-is-not-validated) | `voteType` is not validated, `null` turns into a 409 | Medium — wrong HTTP code | **Fixed** (`43e923b`) |
| [F-3](#f-3--a-vote-cannot-be-withdrawn) | A vote cannot be withdrawn (no toggle-off) | Medium — product gap | Open, characterized |
| [F-4](#f-4--the-slash-is-missing-from-the-voteanswer-route) | The slash is missing from the `/vote/answer` route | Medium — wrong route | **Fixed** (API/role batch) |
| [F-5](#f-5--failures-come-back-with-http-200) | Failures come back with HTTP 200 | Medium — silent error | Open, contract pinned |
| [F-6](#f-6--studentservices-second-moderation-path) | `StudentService`'s second, weaker moderation path | High — protections could be bypassed | **Fixed** (deleted) |
| [F-7](#f-7--normalizeip-crashed-on-a-lone-comma) | `normalizeIp` crashed on a lone comma | Medium — error in the login email | **Fixed** (`8fc2901`) |
| [F-8](#f-8--silent-failure-when-ipinfo_token-is-empty) | Silent failure when `IPINFO_TOKEN` is empty | Medium — undiagnosable | **Partially fixed** |
| [F-9](#f-9--a-write-inside-a-readonly-transaction) | A field write inside a `readOnly` transaction | Low — an integration question | Open, recorded |
| [F-10](#f-10--typos-going-out-to-the-client) | Typos going out to the client | Low — cosmetic, but contract | **Fixed** (`edaf2bc`, `57658c3`) |
| [F-11](#f-11--a-checkapply-race-in-warning-reverts) | A check/apply race in warning reverts | Low — rare | Open, recorded |
| [F-12](#f-12--a-needless-administrator-query-on-an-empty-target-list) | A needless administrator query on an empty target list | Very low | Open, characterized |
| [F-13](#f-13--token-revocation-hangs-on-a-single-condition) | Token revocation hangs on a single condition | Info — the protection exists | Put under test |
| [F-14](#f-14--500-when-a-required-query-parameter-is-missing) | 500 when a required query parameter is missing | Medium — wrong HTTP code | Open, put under test |
| [F-15](#f-15--500-for-the-category-list-of-an-unknown-lecture) | 500 for the category list of an unknown lecture | Medium — wrong HTTP code | Open, put under test |
| [F-16](#f-16--the-wrong-http-method-returns-404-instead-of-405) | The wrong HTTP method returns 404 instead of 405 | Medium — wrong HTTP code, on all 122 routes | Open, put under test |
| [F-17](#f-17--an-unsupported-media-type-returns-500-instead-of-415) | An unsupported media type returns 500 instead of 415 | Medium — wrong HTTP code, on every route that reads a body | **Fixed** |
| [P-1](#p-1--the-coverage-baseline-number-was-wrong) | The coverage baseline number was wrong | Process | **Fixed** (re-measured) |
| [P-2](#p-2--integration-tests-hide-unit-targets) | Integration tests hide unit targets | Process | **Fixed** (method changed) |
| [P-3](#p-3--lombok-is-not-filtered-in-jacoco) | Lombok is not filtered in JaCoCo | Process | Open, deliberate |

BUG-1 and BUG-2 (the cursor and approximate-location bug reports) are in
[test-plan.md](test-plan.md#findings); neither was reproducible on the backend and they stay
there.

The numbers stop at F-17 on purpose. The ownership / IDOR sweep ran and raised nothing — what
it covered and how is under [Negative results](#negative-results), because a sweep that finds
nothing is only worth something if its coverage is written down.

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

**Status.** Open. The fix (order-insensitive comparison for set fields) changes
`RevertValues`'s contract and is a product decision. The deterministic test for the write
side — with a stubbed `findAllById` order — now exists as
`ModerationCatalogServiceTests.updateLecture_sameProfessorsInAnotherOrder_recordsABogusChange`,
added in batch 4. It pins the bogus `professors` change and the bogus audit event that follow
from comparing an unordered `Set` position by position. The finding stays **open**: the fix is
a product decision about `RevertValues`'s contract, not a test gap.

---

### F-1 — Voting writes no audit

**Where.** `SocialService.voteComment`, `SocialService.voteAnswer`.

**What happens.** `submitComment`, `submitAnswer` and `submit*Report` in the same class all
call `auditWriter.writeStudentAction(...)`. The two vote methods do not. So **vote
manipulation does not appear in the moderation trail at all** — an account flipping hundreds
of votes leaves no trace on the audit side.

**Test.** `SocialServiceVoteTests` — `AuditWriter` is deliberately passed as `null` rather
than a mock in that test; the tests pass because the two methods never touch it, and the
moment they start to, it throws an NPE immediately. `AuditWriter` being on that list is the
finding itself.

**Status.** Open.

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

**Status.** Open — a product decision, and possibly not a defect at all; but nothing in the
code says it is deliberate, so it is recorded.

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

**Status.** Open — a design decision, and changing it affects the client side. The tests pinned
the current behaviour, so if the contract changes the tests have to change too (and that is
good: the change cannot be silent).

Side note: `getUserInformation` says `"Error, cannot authenticate user"` for a student that is
not found, when all that happened is that no row matched the id. Authentication has already
been done in the security chain. The message is misleading and it goes to the client.

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

**Status.** **Partially fixed.** The warning only fires at startup: if the token is revoked
later, the only trace is the 401/403 WARNs. A per-request warning was deliberately not added
(log noise on every login). The broad `catch (Exception)` also still makes
401/403/429/timeout indistinguishable to the caller — the distinction lives only in the log.

---

### F-9 — A write inside a `readOnly` transaction

**Where.** `StudentService.getUserInformation`.

**What happens.** The method is `@Transactional(readOnly = true)` but calls
`student.setCredibilityScore(credibilityScore)` inside it — that is, it mutates a managed
entity inside a transaction intended for reading. The score is a computed value; it does not
look like it is meant to be persisted, but what dirty checking will do in a real persistence
context is not evident from the code.

**Why a unit test cannot settle it.** There is no such thing as dirty checking against a mocked
repository; the behaviour is Hibernate's and the `readOnly` flag's business.

**Status.** Open, deferred to the integration layer.

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

**Status.** Open — the behaviour is reasonable, only the user experience is odd. Having the
panel present this 409/404 as "the entry can no longer be reverted" may be enough.

---

### F-12 — A needless administrator query on an empty target list

**Where.** `UserRevertHandler.currentValues`.

**What happens.** `adminRepository.findAllAdminStudentIds()` is called **before** the loop, so a
query is issued even when the target list is empty. Harmless today: the revertibility pass only
calls this method with a non-empty id set.

**Test.** `UserRevertHandlerTests.currentValues_noTargets_stillQueriesTheAdminIdList` —
characterization, so that an edit changing this is a deliberate one.

**Status.** Open, deliberately not fixed.

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

**Status.** Open. The behaviour is under test: the route is on the
`PUBLIC_ROUTES_ANSWERING_SERVER_ERROR` list and the test still **expects** 500, so the moment it
is fixed the test goes red and asks for the list to be shortened. The fix is one line: add
`MissingServletRequestParameterException` to `handleBadRequest`'s type list. Part of the F-5
family — the scope decision is again a contract decision.

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

**Status.** Open, put under test the same way as F-14.

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

**Decision: not fixed.** The contract is pinned as it stands today.

**Status.** Open, put under test. The expected code lives in **a single constant**:
`com.pse.support.ApiContract.WRONG_VERB_STATUS = 404`. The constant sits in its own class
because two suites depend on it — `ApiProtocolContractTests` (the sweep) and
`AdminApiPathSplitTests` (see below). If the decision to fix it is ever made, the test side is
one line, not 122 assertions. The one-line fix: change the handler's body to
`HttpStatus.METHOD_NOT_ALLOWED` and add the `Allow` header — together with two lines of
`admin-api.md` and two tests.

**Two mechanisms get conflated.** `handleNotFound` (`NoResourceFoundException` — "no such
path") and `handleWrongMethod` (this finding — "the path exists, the method does not") produce
**exactly the same body**: same status code, same `"Not found"` text. So which one ran is
**indistinguishable** from the response. That is the real cost of the copy-paste.

The concrete consequence: `AdminApiPathSplitTests.studentBugSubmissionHasNoAdminTwin` was not
proving what its name claimed. The name says "no admin twin", implying the path does not exist;
but `/admin/reports` **does** exist — only GET maps, POST does not, and the 404 it saw is this
finding's 404. Since the distinguishing signal is not in the body, it was added with a second
request: the same test now also asserts that `GET /admin/reports` returns **200**. That way the
test will not quietly keep passing if the path is removed entirely one day.

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

## Negative results

A sweep that finds nothing is only worth something if what it covered is written down.
Otherwise the next person repeats it, or worse, assumes it was never done.

### The ownership / IDOR sweep found no defect

`ApiOwnershipMatrixTests` asks the question `ApiAuthorizationMatrixTests` does not: once a
caller *is* authenticated, can they reach a row belonging to somebody else? **No route was
found that lets them.** No finding was raised, which is why the F-numbers stop at F-17 and
F-18 is still free.

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

### P-3 — Lombok is not filtered in JaCoCo

The repo has no `lombok.config` and `lombok.addLombokGeneratedAnnotation` defaults to `false`.
So every entity's generated getters and setters are lines counted in the bundle — a large part
of why the denominator is 3341.

**Deliberately left alone.** Filtering looks like a shortcut, but because accessors are heavily
covered through serialization it deletes more *covered* lines than uncovered ones and could
**lower** the ratio — and it would quietly change what the number measures. For the same reason
the `<excludes>` list was not widened either (adding `**/model/**` or `**/dto/**` would have
bought several points without a single test). These would not clear the ratchet, they would
redefine it.

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
