# Test findings

The defects the unit test batches turned up, in one place. [test-plan.md](test-plan.md)
describes what is tested and how; this document holds only **what the tests found** and
where each finding stands.

Every finding is given together with the name of the test that pins it: a finding is only
really recorded once it lives in a test.

## Summary

| # | Finding | Impact | Status |
|---|---|---|---|
| [BUG-3](#bug-3--professor-assignment-order-silently-refuses-a-revert) | Professor assignment order refuses a revert | High — looks unstable to the user | Open, characterised |
| [F-1](#f-1--voting-writes-no-audit-entry) | Voting writes no audit entry | High — moderation blind spot | Open, characterised |
| [F-2](#f-2--votetype-is-not-validated) | `voteType` is not validated, `null` turns into a 409 | Medium — wrong HTTP code | **Fixed** (`43e923b`) |
| [F-3](#f-3--a-vote-cannot-be-withdrawn) | A vote cannot be withdrawn (no toggle-off) | Medium — product gap | Open, characterised |
| [F-4](#f-4--the-voteanswer-route-is-missing-a-slash) | The `/vote/answer` route is missing a slash | Medium — wrong route | Open; class swept, single instance |
| [F-5](#f-5--failures-come-back-with-http-200) | Failures come back with HTTP 200 | Medium — silent failure | Open, contract pinned |
| [F-6](#f-6--studentservices-second-moderation-path) | `StudentService`'s second, weaker moderation path | High — a safeguard could be bypassed | **Fixed** (deleted) |
| [F-7](#f-7--normalizeip-crashed-on-a-lone-comma) | `normalizeIp` crashed on a lone comma | Medium — error in the login email | **Fixed** (`8fc2901`) |
| [F-8](#f-8--silent-failure-when-ipinfo_token-is-empty) | Silent failure when `IPINFO_TOKEN` is empty | Medium — undiagnosable | **Partly fixed** |
| [F-9](#f-9--writing-inside-a-readonly-transaction) | Writing a field inside a `readOnly` transaction | Low — an integration question | Open, recorded |
| [F-10](#f-10--typos-that-reach-the-client) | Typos that reach the client | Low — cosmetic, but it is contract | **Fixed** (`edaf2bc`, `57658c3`) |
| [F-11](#f-11--checkapply-race-in-warning-revert) | Check/apply race in warning revert | Low — rare | Open, recorded |
| [F-12](#f-12--needless-administrator-query-on-an-empty-target-list) | Needless administrator query on an empty target list | Very low | Open, characterised |
| [F-13](#f-13--token-revocation-hangs-on-a-single-condition) | Token revocation hangs on a single condition | Info — the safeguard exists | Now under test |
| [P-1](#p-1--the-coverage-baseline-number-was-wrong) | The coverage baseline number was wrong | Process | **Fixed** (re-measured) |
| [P-2](#p-2--integration-tests-hide-unit-targets) | Integration tests hide unit targets | Process | **Fixed** (method changed) |
| [P-3](#p-3--lombok-is-not-filtered-in-jacoco) | Lombok is not filtered in JaCoCo | Process | Open, deliberate |

BUG-1 and BUG-2 (the cursor and approximate-location bug reports) are in
[test-plan.md](test-plan.md#findings); neither could be reproduced in the backend and both
stay there.

---

## Code defects

### BUG-3 — Professor assignment order silently refuses a revert

**Where.** `CatalogueRevertHandler.LectureHandler.currentValues` (the read side) and
`ModerationCatalogService.updateLecture` (the write side).

**What happens.** `Lecture.professors` is a `Set<Professor>` — a type that defines no order —
but the handler turns it into an **ordered** `List`. `RevertValues.sameValue` compares two
collections through `asStrings(left).equals(asStrings(right))`, that is, position by
position. The result: a lecture whose professor assignment never changed gets a
`VALUE_CHANGED` purely because the set's iteration order does not match the order written
into the audit JSON, and **a legitimate revert is refused**.

The same sensitivity works in reverse on the write side: `updateLecture` builds `before`
from the `Set` and `after` from the order of `professorRepository.findAllById(...)`, then
compares them with `!before.equals(after)` — so an unchanged assignment can write a
**phantom** `professors` change and a phantom audit event.

**Why it is serious.** `Professor` overrides neither `equals` nor `hashCode`, so identity
hashes are used and `HashSet` bucket distribution depends on object addresses. The order can
change **on every run**. That is why the defect looks unstable in production: the same edit
is revertible once and not the next time. This is the most likely explanation for a bug
report that cannot be reproduced.

**Tests.**
```
CatalogueRevertHandlerTests
  lectureHandler_currentValues_professorAssignment_carriesTheOrderOfAnUnorderedSet
  lectureHandler_professorAssignmentInAnotherOrder_comparesAsChangedByRevertValues
```
The tests deliberately do **not** lean on the real `HashSet` order: such a test would be
flaky, and the flakiness would be written into the test rather than into the defect. The
defect was split into two deterministic facts instead — that with a `LinkedHashSet` fixture
the handler produces an order the declared type does not define, and that `sameValue` counts
the same two elements in reverse order as different (while they are equal as sets).

**Status.** Open. The fix (order-insensitive comparison for set fields) changes the contract
of `RevertValues` and is a product decision. The deterministic test for the write side —
with a stubbed `findAllById` order — was left to the `ModerationCatalogService` batch.

---

### F-1 — Voting writes no audit entry

**Where.** `SocialService.voteComment`, `SocialService.voteAnswer`.

**What happens.** `submitComment`, `submitAnswer` and the `submit*Report` methods in the
same class all call `auditWriter.writeStudentAction(...)`. The two vote methods do not. So
**vote manipulation never shows up in the moderation trail** — an account flipping hundreds
of votes leaves no trace at all on the audit side.

**Test.** `SocialServiceVoteTests` — `AuditWriter` is deliberately passed as `null` rather
than a mock in this test; the tests pass because neither method touches it, and the moment
one starts to, it is an immediate NPE. `AuditWriter` being on that list is the finding
itself.

**Status.** Open.

---

### F-2 — `voteType` is not validated

**Where.** `SocialService.voteComment`, `SocialService.voteAnswer`.

**What happens.** A `null` vote type travels unchecked all the way to `setVote(null)` and is
handed to `save`. The method returns `success = true`. The only thing that stops it is the
`nullable = false` column on `comment_votes.vote` — and that fires **at flush time**,
outside any transaction this method opened (neither method is `@Transactional`).

**Consequence.** `DataIntegrityViolationException` → `GlobalExceptionHandler:69` → **HTTP
409 "State conflict"**. The client expects a 400 for a malformed request and gets a 409, and
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
this way, and `AddLectureRequest` already carried exactly the same example on an enum field
(`@NotNull SemesterSeason`). `GlobalExceptionHandler` turns the violation into **400
"Invalid request"**.

**No guard was added to the service**: validation stays at the boundary. The reason is that
no method of `SocialService` throws (F-5) — putting an `ApiException` in the service would
have introduced a second error contract into the class, and the service's only caller is
this controller.

The new tests live in `SocialApiIntegrationTests`:
`voteWithoutAVoteTypeIsRejectedAsABadRequest` (both an explicit `null` and the field being
absent altogether), `votingOnAnAnswerWithoutAVoteTypeIsRejectedAsABadRequest`, and
`aVoteCarryingAVoteTypeIsStillAccepted` — the last one shows the guard does not reject a
legitimate vote.

The two tests in `SocialServiceVoteTests` were not deleted, only renamed:
`voteComment_nullVoteType_reachesSaveBecauseValidationLivesAtTheBoundary` (and the
`voteAnswer` twin). The service still does not validate, and now the tests say so — and if a
caller that skips the boundary ever appears, they are the only record standing between it
and the constraint violation at flush.

Verification: with `@NotNull` temporarily removed, the new test goes red with
`Status expected:<400> but was:<409>` — so the defect was exactly as written up, and the
test really does catch it.

---

### F-3 — A vote cannot be withdrawn

**Where.** `SocialService.voteComment`, `SocialService.voteAnswer`, `VoteType`.

**What happens.** A second vote in the same direction rewrites the same value instead of
removing the vote. `VoteType` has only `UP` and `DOWN`; there is no third value (`NONE`) and
no delete path for removing one. **A user cannot take back a vote they cast.**

**Test.** `SocialServiceVoteTests.voteComment_repeatedIdenticalVote_isRewrittenRatherThanToggledOff`

**Status.** Open — a product decision, and possibly not a defect at all; but nothing in the
code says anywhere that it is deliberate, so it is recorded.

---

### F-4 — The `/vote/answer` route is missing a slash

**Where.** `SocialController:95`.

**What happens.**
```java
@PostMapping("/comments/vote/answer{answer_id}")   // no slash
```
Because the class carries `@RequestMapping("/social")`, the real route is
`/social/comments/vote/answer<id>` — for example
`/social/comments/vote/answer7c9e6679-7425-40de-944b-e07fc1f90ae7`.
The sibling endpoint on the comment side (`:71`) is written correctly:
`/comments/vote/comment/{comment_id}`.

**Why the tests did not catch it.** This is a controller defect; the unit layer tests the
service, not route binding. No test sends an HTTP request to the vote endpoint — the finding
came out of reading the vote path.

**The whole class was swept — this is the only instance.** To find out whether the route was
a class-wide defect, **all 110 verb+path routes** across 19 controllers were swept: there is
**no** other mapping missing its separator before a path variable.

The sweep checked three more things and found none of them: double slashes (0), trailing
slashes (0), and ambiguous (same verb + same path) mappings (0).

The only neighbouring point found during the sweep — not a defect:

- `RatingController:55` has the method path `"own/{lectureId}"`, that is, with no leading
  slash. Spring inserts the separator itself when joining it to the class prefix, so the
  route works correctly (`/ratings/own/{lectureId}`). It is only written differently from
  the rest of the codebase.

So that the sweep itself is repeatable: a sweep that does not account for the **array form**
of the class-level `@RequestMapping` (`@RequestMapping({"/admin/users", "/users"})`)
produces six false collisions — every moderation controller uses that form.

**Status.** Open, not fixed — the scope of this finding was the sweep, not the fix. Fixing
it is a **breaking change**: if a client is using today's (broken) route, the old one may
have to be served alongside the new one for a while. Now that it is known to be the only
instance, the decision is a single endpoint's decision — it is left to the API/role batch.

---

### F-5 — Failures come back with HTTP 200

**Where.** `StudentService`, `AccountService`, `SocialService` — none of the three throws
anything.

**What happens.** Every failure comes back as `BasicResponse(message, success = false)` and
is served with HTTP 200. A student that cannot be found, a comment that cannot be found, an
account that cannot be deleted — all of them are a "successful" response. A caller that
looks only at the HTTP status or at a thrown error takes a broken lookup for a successful
one.

For comparison: `ModerationCatalogService` throws an `ApiException` in the same situations
and `GlobalExceptionHandler` turns those into 400/404. So **two different error contracts**
sit side by side in the codebase.

**Tests.** That is why the negative-path tests are written against `response.success()` and
`response.message()` rather than `assertThatThrownBy` — if this is the contract, the test
has to pin it:
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

**Status.** Open — a design decision, and changing it affects the client side. The tests
pinned the current behaviour, so if the contract changes the tests have to change with it
(and that is good: the change cannot be silent).

Side note: `getUserInformation` says `"Error, cannot authenticate user"` for a student that
cannot be found, when all that happened is that no row matched the id. Authentication has
already been done in the security chain. The message is misleading and it goes to the client.

---

### F-6 — `StudentService`'s second moderation path

**Where.** `StudentService` — `deleteUser`, `blockStudent`, `unblockStudent`,
`findByKitEmail`, `addStudent`, `getAllUsers`, `getUser`.

**What was happening.** Seven methods had no caller anywhere in `src/`. The code itself was
asking too: `//TODO: Why arent they in use?`.

The danger was less that they were dead code than **what they did not do**. The live
administrator flow is `ModerationUserService` (`blockStudent:591`, `unblockStudent:617`),
and it additionally:

- `protectAdministrator(...)` — stops an administrator from being blocked
- short-circuits for idempotency
- records `blockedAt` / `blockedReason`
- `revokeTokens(target)` — closes the blocked account's sessions
- `auditWriter.write(... USER_BLOCKED ...)`

`StudentService`'s copies did **none** of this; only `setStatus` + `save`. So if one of
these methods were wired to a controller one day: no token revocation, no audit entry, no
administrator protection — and no test would have noticed.

**Why deletion rather than tests.** Writing tests would have nailed down a silently weaker
second path through moderation that nobody depends on, at the very moment the code was being
reduced to a single path.

**Status.** **Fixed.** The seven methods were deleted; the unused
`import com.pse.user.service.StudentService;` in `RatingService` went with them.
`StudentService`'s only consumer in `src/main` is now `AccountService`, and it uses exactly
three methods.

---

### F-7 — `normalizeIp` crashed on a lone comma

**Where.** `LoginLocationService.normalizeIp`.

**What was happening.** `","` (an `X-Forwarded-For` consisting of nothing but a comma) took
the method down with an `ArrayIndexOutOfBoundsException`: because Java's `split(",")` drops
trailing empty parts, the array came back empty and `[0]` blew up. Since `normalizeIp` runs
**before** the broad `try` block, this was the one input `catch (Exception)` did not catch —
the exception escaped `getLoginLocation` and surfaced as an uncaught error in the login email
inside the `AFTER_COMMIT` listener. The login itself kept succeeding.

**Fix.** `rawIp.split(",", -1)` — the negative limit keeps the empty parts, so the result is
`[""]` and it falls into the existing blank check.

**Test.** `LoginLocationServiceTests.getLoginLocation_addressOfOnlyCommas_returnsUnknownWithoutCallingIpInfo`

**Status.** **Fixed** — commit `8fc2901`.

---

### F-8 — Silent failure when `IPINFO_TOKEN` is empty

**Where.** `LoginLocationService.getLoginLocation`.

**What happens.** If `ipinfo.token=${IPINFO_TOKEN:}` falls back to empty, `getLoginLocation`
returns `"Unknown"` through `ipInfoToken.isBlank()` without making any HTTP call at all.
This is the most likely production reason for approximate location "no longer working", and
it left **no trace whatsoever** per request.

**Fix.** `warnIfTokenMissing()` (`@PostConstruct`) now emits a WARN once at startup.
Swallowed exceptions are logged with their stack trace too, so 401/403/429 and timeouts can
now be told apart in the logs.

**Status.** **Partly fixed.** The warning only fires at startup: if the token is revoked
later, the only trace is the 401/403 WARNs. A per-request warning was deliberately not added
(log noise on every login). The broad `catch (Exception)` also still makes
401/403/429/timeout indistinguishable from the caller's point of view — the distinction
exists only in the log.

---

### F-9 — Writing inside a `readOnly` transaction

**Where.** `StudentService.getUserInformation`.

**What happens.** The method is `@Transactional(readOnly = true)` but calls
`student.setCredibilityScore(credibilityScore)` inside it — that is, it modifies a managed
entity inside a transaction meant for reading. The score is a computed value; it does not
look as if it is meant to be persisted, but the code does not say what dirty checking would
do in a real persistence context.

**Why a unit test cannot settle it.** There is no such thing as dirty checking against a
mocked repository; the behaviour is Hibernate's and the `readOnly` flag's business.

**Status.** Open, handed to the integration layer.

---

### F-10 — Typos that reach the client

**Where.** `StudentService.deleteAccount`.

```
"Error, couldnt authenticate user"      // couldn't
"Error, couldnt find student"           // couldn't
"Deleted Account succesfully: ..."      // successfully
```

These strings go to the client inside `BasicResponse.message`, so they can appear in the
user interface.

**Status.** **Fixed** — commit `edaf2bc`. Three strings corrected:

```
"Error, couldn't authenticate user"
"Error, couldn't find student"
"Deleted Account successfully: ..."
```

The `StudentServiceTests` assertions that pin these strings were updated in the same commit —
they exist precisely so the text cannot change silently, which means they have to change
along with the text. `AccountServiceTests` also stubbed `StudentService`'s failure message,
so that stub moved too; left alone, it would document a string that no longer exists.

**The remaining five are closed as well** — commit `57658c3`. The same typo existed in eight
places in `src/main`; the first commit covered only the three in `deleteAccount`, the second
covered the rest:

| Place | Before | After |
|---|---|---|
| `ProfessorController:55` | `couldnt authenticate Admin` | `couldn't authenticate Admin` |
| `RatingService:168` | `couldnt find rating for Lecture: ` | `couldn't find rating for Lecture: ` |
| `SocialService:184` | `couldnt finde comment` | `couldn't find comment` |
| `SocialService:257` | `couldnt finde comment` | `couldn't find comment` |
| `SocialService:299` | `couldnt find answer` | `couldn't find answer` |

The two `SocialService` messages also said `finde`, so they did not just gain an apostrophe
but went back to `find`. The two tests that pin `ProfessorController`'s message
(`ProfessorControllerTests:119`, `ProfessorApiIntegrationTests:450`) were updated along with
it; no test asserted the `RatingService` and `SocialService` strings.

`src/main` now contains neither `couldnt` nor `finde`.

---

### F-11 — Check/apply race in warning revert

**Where.** `WarningRevertHandler.applyInverse`.

**What happens.** Nothing holds a lock between the revertibility check (`currentValues`) and
the revert itself (`applyInverse`). The check can see the row and say "revertible", and by
the moment of the revert the row can be gone. The handler behaves correctly — it refuses
with `ApiException(NOT_FOUND, "Warning not found")` instead of blowing up — but the user
gets an error on an entry that **looked** revertible.

This only shows up in this handler because it is the only one that runs its own query inside
`applyInverse`.

**Test.** `WarningRevertHandlerTests.applyInverse_warningWithdrawnSinceTheEntry_throwsNotFound`

**Status.** Open — the behaviour is reasonable, only the user experience is odd. It may be
enough for the panel to present this 409/404 as "the entry is no longer revertible".

---

### F-12 — Needless administrator query on an empty target list

**Where.** `UserRevertHandler.currentValues`.

**What happens.** `adminRepository.findAllAdminStudentIds()` is called **before** the loop,
so a query is issued even when the target list is empty. Harmless today: the revertibility
pass only calls this method with a non-empty set of ids.

**Test.** `UserRevertHandlerTests.currentValues_noTargets_stillQueriesTheAdminIdList` — a
characterisation, so that an edit which changes it is a deliberate one.

**Status.** Open, deliberately not fixed.

---

### F-13 — Token revocation hangs on a single condition

**Where.** `AccountService.deleteAccount`.

**What.** This is **not** a defect — it is an existing safeguard. But it is recorded because
losing it would be expensive.

```java
if (response.success()) {
    authService.invalidateAllAuthTokensForEmail(student.getKitEmail());
}
```

Without this condition, the account goes `DELETED` while every token ever issued to it stays
valid until it expires — and the `app.auth.app-session-ttl` default is **`P365D`**, so a
student token lives for a year. The other direction of the condition matters just as much:
tokens must **not** be revoked on a **failed** deletion, or a still-legitimate session gets
closed.

**Tests.**
```
AccountServiceTests
  deleteAccount_successfulDeletion_revokesEveryIssuedToken
  deleteAccount_failedDeletion_leavesTheTokensAlone
```
The second test is the single most valuable test in this batch: it goes red if the safeguard
is ever removed.

**Status.** Now under test.

---

## Process findings

### P-1 — The coverage baseline number was wrong

The number batch 2 was entered with was 85.7% LINE (2916/3403). The actual measurement —
after the deletion — was **87.76%** (2932/3341). The gap needed for the 90% target was not
147 lines but **75**; that is, roughly half of the planned work was enough.

**Lesson.** Batch arithmetic has to start from a measured number, not an inherited one.
Measuring is now the first step of a batch.

### P-2 — Integration tests hide unit targets

"There is no unit test" and "the lines are not covered" are not the same thing. The suite has
ten `@SpringBootTest` classes — `DemoApplicationTests` is `@Disabled`,
`PostgreSqlMigrationSmokeTests` only runs in CI, and the remaining **eight** bring up the
full context on every local run — and their coverage is inside the bundle. The sharpest
example:

Both `currentValues` and `applyInverse` of `UserRevertHandler` were being driven end to end
by `AdminApiIntegrationTests.aFieldEditIsRevertibleAndTheReversalIsItsOwnAuditEvent`
(`:2509`). The gain expected from the source line count was ~29 lines; the real gap was
**2 lines** (the `UserStatus.DELETED` `continue` and the `UserRole.ADMIN` ternary arm).

Likewise, the happy path of `StudentService.getUserRatings` and the summation in
`getAverageRating` were covered by `LazyLoadingRegressionTests`.

**Lesson.** Targets have to be picked from `LINE_MISSED` in `jacoco.csv`:
```
awk -F, 'NR>1 && $8>0 {printf "%4d %s.%s\n", $8, $2, $3}' \
  target/site/jacoco/jacoco.csv | sort -rn | head -25
```
That moves `UserRevertHandler` to the bottom of the list and `CatalogueRevertHandler` to the
top — work had been going on the opposite intuition.

Worth noting: `UserRevertHandlerTests` was written despite the 2-line gain, because those two
lines were the `DELETED` and `ADMIN` branches — so the value was not coverage but getting
**why** those branches are the way they are into writing.

### P-3 — Lombok is not filtered in JaCoCo

There is no `lombok.config` in the repo and the `lombok.addLombokGeneratedAnnotation`
default is `false`. So every entity's generated getters/setters are lines counted in the
bundle — a large part of why the denominator is 3341.

**Deliberately left alone.** Filtering them looks like a shortcut, but because accessors are
heavily covered through serialisation it deletes more *covered* lines than uncovered ones and
could **lower** the ratio — and on top of that it silently changes what the number measures.
The `<excludes>` list was left unextended for the same reason (adding `**/model/**` or
`**/dto/**` would have gained several points without a single test being written). Those
would not be passing the ratchet but redefining it.

---

## Unreachable states deliberately left untested

Points that look like defects while reading the code, but for which no test was written
because they cannot be reached from a persisted row. Writing a test would mean asserting on a
fiction; listing them here shows the decision was deliberate.

| Point | Why it is unreachable |
|---|---|
| `WarningRevertHandler` — the `warning.getStudent()` NPE | `Warning.student` is `@ManyToOne(optional = false)`; a row with a null student cannot exist |
| `CatalogueRevertHandler` — `getSemesterSeason().name()` without a null guard | the column is `nullable = false` |
| `CatalogueRevertHandler` — `getLectureType().name()` without a null guard | the column is `nullable = false`, and there is a `LECTURE_ONLY` default on the Java side as well |
| `AccountService` — the `student == null` NPE | the principal comes from the security chain and cannot be null |
| Private constructors of static-only classes | JaCoCo has filtered them since 0.8.0; writing a reflection test would be fake coverage |
