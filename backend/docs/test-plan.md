# Test plan

The layers: **unit → API/role → integration → E2E**. This document currently covers batches
1 and 2 of the unit layer; every batch adds its own section.

The coverage measure is LINE coverage, the target is 90%. The result of batch 1:

| Class | LINE | BRANCH | Tests |
|---|---|---|---|
| `KeysetCursorCodec` | 100.0% | 100% | 23 |
| `AuditCursorCodec` | 100.0% | — | 5 |
| `RevertValues` | 100.0% | 97% | 37 |
| `AdminBootstrapPolicy` | 100.0% | 100% | 18 |
| `OtpService` | 100.0% | 100% | 13 |
| `RateLimitService` | 98.2% | 93% | 26 |
| `AuditRevertService` | 100.0% | 92% | 30 |
| `LoginLocationService` | 98.8% | 91% | 39 |

**191 tests in total (good 80 / bad 111).** Whole suite: 359 tests, 0 failures.
The numbers are parameterised tests expanded out.

Shared rules: plain JUnit + AssertJ + Mockito, no Spring context, no database/network/file
system, `Clock.fixed` everywhere a clock is injected. The tests live in mirror packages —
necessary because `RateLimitService.validateConfiguration()` and
`LoginLocationService.warnIfTokenMissing()` are package-private.

## Batch 2

Target: all of the `com.pse.audit.revert` handlers, the account lifecycle, and voting.

| Class | LINE | BRANCH | Tests |
|---|---|---|---|
| `CatalogueRevertHandler.LectureHandler` | 100.0% | 100% | 9 |
| `CatalogueRevertHandler.ProfessorHandler` | 100.0% | 100% | 6 |
| `ReportStatusRevertHandler.CommentReportHandler` | 100.0% | 100% | 6 |
| `ReportStatusRevertHandler.AnswerReportHandler` | 100.0% | 100% | 4 |
| `WarningRevertHandler` | 100.0% | 100% | 6 |
| `UserRevertHandler` | 100.0% | 100% | 9 |
| `SocialService` (vote methods only) | 91.8%* | 67%* | 9 |
| `StudentService` | 100.0% | 94% | 12 |
| `AccountService` | 100.0% | 100% | 6 |

\* The number for the whole class. `voteComment` / `voteAnswer`, which the batch targeted,
are **fully** covered (0 missed lines); the remaining 16 lines belong to the `submit*` and
report methods and were left to a later batch.

**67 tests in total (good 34 / bad 33).** Whole suite: 439 tests, 0 failures (2 skipped: the
`@Disabled` `DemoApplicationTests` and `PostgreSqlMigrationSmokeTests`, which only runs in
CI). The numbers are parameterised tests expanded out.

With this batch **all nine handler beans** of the `com.pse.audit.revert` package plus
`AuditRevertService` and `RevertValues` reached 100% LINE; no missed lines are left in the
package.

### The bundle and the threshold

Measured bundle: **91.41% LINE** (3054/3341), **75.51% BRANCH** (845/1119).
The pre-batch measurement was 87.76% LINE / 72.83% BRANCH.

`jacoco:check` was pulled to two limits: LINE `0.85` → **`0.90`**, and a new **BRANCH `0.73`**
floor. Both are about a point and a half below what was measured — the rule is to leave the
measurement some margin, not to pin it to a round target. The reason: `check` is bound to
`verify`, not to `test`, so a threshold with no margin blows up in CI, in somebody else's
MR, on a change that has nothing to do with tests — exactly the failure mode the comment in
the pom says it was chosen to prevent. BRANCH is a floor, not a target: a LINE-only gate was
letting a heavily branched method arrive with a single happy-path test while branch coverage
quietly dropped.

That the threshold really is a gate was verified: with LINE temporarily pulled to `0.95`,
`./mvnw verify` went red with "lines covered ratio is 0.91, but expected minimum is 0.95",
and green with `0.90`.

**Deliberately not done** — all three are shortcuts that jump the number without a test being
written, which is redefining the ratchet rather than passing it:

- The `<excludes>` list was not extended. Adding `**/model/**` or `**/dto/**` would have
  gained several points without a single test being written.
- No `lombok.config` was added and Lombok was not filtered. There is no `lombok.config` in
  the repo and `addLombokGeneratedAnnotation` defaults to `false`, so every generated
  getter/setter counts in the bundle. Because accessors are heavily covered through
  serialisation, filtering them could delete more *covered* lines than uncovered ones and
  lower the ratio — and on top of that it would silently change what the number measures.
- No reflection tests were written for the private constructors of static-only classes;
  JaCoCo has filtered those since 0.8.0 anyway.

`ModerationCatalogService.updateLecture` / `updateProfessor` (31 missed lines, 57/106
branches) was this batch's conditional group 4: it was not needed because the bundle passed
91%. It is the first candidate for the next batch, being the most branch-heavy untested
method left.

### Three different coverage numbers

So as not to confuse them: the three numbers measure three separate things, they are not an
inconsistency.

- **pom `jacoco:check` (LINE 0.90 / BRANCH 0.73)** — the bundle regression gate. The floor
  that must not be crossed again.
- **The 90% target in this document** — the level the batches aim at.
- **`scripts/CheckChangedCoverage.java --threshold 30`** — the MR gate, which looks only at
  the coverage of *changed* code. Unrelated to the bundle.

---

## Findings

### BUG-1 — "Does the cursor work in the backend?"

**Could not be reproduced in the backend.** It was traced end to end and every step was found
correct: the wire format (`base64url_nopad("1|<Instant>|<UUID>")`), the seven separate
rejections in `decode`, the agreement between the keyset predicate in `AuditLogService`
(`createdAt < c.createdAt OR (createdAt = c.createdAt AND id < c.id)`) and the
`ORDER BY createdAt DESC, id DESC` ordering, the `limit + 1` end-of-rows probe, the
controller's `@RequestParam cursor` binding and the `nextCursor` field in the DTO.
`AuditLog.createdAt` is an `Instant` and uses the `Instant` overload; the two moderation
listings that store a `LocalDateTime` correctly call `Cursor.createdAtLocal()` — there is no
mixed-type comparison anywhere. The extraction commit `096a484` is a faithful one, line for
line.

Decision: no red test, characterisation tests instead. The format and every rejection were
pinned as a regression net; the problem is most likely on the panel side.

### BUG-2 — "Approximate location no longer works"

Three findings:

1. **There is no provider chain.** Geoapify only produces the static map image
   (`createStaticMapUrl`); it is never a geolocation fallback. The only fallback is
   `catch (Exception) → LoginLocation("Unknown", null, null)`.
2. **The most likely production cause:** `ipinfo.token=${IPINFO_TOKEN:}` falls back to empty
   and `getLoginLocation` returns `"Unknown"` through `ipInfoToken.isBlank()` without making
   an HTTP call at all. This path is still silent per request, but a `warnIfTokenMissing()`
   (`@PostConstruct`) WARN now fires once at startup — it is no longer the one failure that
   leaves no trace when the token is unset.
3. **Swallowed exceptions are logged.** `LOGGER.warn("Could not determine location for IP {}",
   ip, exception)` writes with the stack trace (`8d18abb` added this). So 401/403/429 and
   timeouts can be told apart in the logs; the only path that is silent during a request is
   the empty-token path, and that one is recognisable from the startup warning.

### Newly found defect — `normalizeIp` was crashing (fixed)

`","` (an `X-Forwarded-For` consisting of nothing but a comma) took `normalizeIp` down with
an `ArrayIndexOutOfBoundsException`: because Java's `split(",")` drops trailing empty parts,
the array came back empty and `[0]` blew up. Since `normalizeIp` runs **before** the `try`
block, this was the one input the broad `catch` did not catch — the exception escaped
`getLoginLocation` and surfaced as an uncaught error in the login email inside the
`AFTER_COMMIT` listener. The login itself kept succeeding.

Fix: `rawIp.split(",", -1)`. The negative limit keeps the empty parts, so the result is
`[""]` and it falls into the existing blank check. The marker test, named
`getLoginLocation_addressOfOnlyCommas_returnsUnknownWithoutCallingIpInfo`, now pins the
fixed behaviour.

### BUG-3 — Professor assignment order silently refuses a revert

`Lecture.professors` is a `Set<Professor>` — a type that defines no order — but
`CatalogueRevertHandler.LectureHandler.currentValues` turns it into an **ordered** `List`,
and `RevertValues.sameValue` compares two collections through
`asStrings(left).equals(asStrings(right))`, that is, position by position. The result: a
lecture whose professor assignment never changed can get a `VALUE_CHANGED` purely because the
set's iteration order does not match the order written into the audit JSON, and refuse a
legitimate revert.

The same order sensitivity exists on the write side: `ModerationCatalogService.updateLecture`
builds `before` from the `Set` and `after` from the order of
`professorRepository.findAllById(...)`, then compares them with `!before.equals(after)` — so
an unchanged assignment can write a phantom `professors` change and a phantom audit event.

**Why it was not tested with the real `HashSet` order.** `Professor` overrides neither
`equals` nor `hashCode`, so identity hashes are used and bucket distribution depends on
object addresses: the order can change **on every run**. Forcing the order by picking UUIDs
does not work, because the UUIDs never enter `hashCode` at all. Such a test would be flaky,
and the flakiness would be written into the test rather than into the defect. The defect was
split into two deterministic facts instead, each pinned separately: that with a
`LinkedHashSet` fixture the handler **produces an order the declared type does not define**,
and that `sameValue` counts the same two elements in reverse order as **different**.

Not fixed — order-insensitive comparison for set fields is a product decision and changes the
contract of `RevertValues`. The deterministic test for the write side (with a stubbed
`findAllById` order) was left to the `ModerationCatalogService` batch.

### Four gaps on the voting path

Four behaviours pinned in the `SocialService.voteComment` / `voteAnswer` characterisation
tests, none of which is obviously deliberate:

1. **No audit is written.** `submitComment` / `submitAnswer` / `submit*Report` in the same
   class all call `auditWriter.writeStudentAction(...)`; the two vote methods do not. So vote
   manipulation does not show up in the moderation trail.
2. **`voteType` is not validated.** A `null` vote type travels all the way to `setVote(null)`
   and is handed to `save`; the only thing that stops it is the `nullable = false` column, and
   that fires at flush — outside any transaction this method opened, that is, not somewhere
   the caller can intervene. The method returns `success = true` in the meantime.
3. **None of them is `@Transactional`.** The other write methods in the class are.
4. **There is no toggle-off path.** A second vote in the same direction rewrites the vote
   instead of removing it, and `VoteType` (`UP`, `DOWN`) has no third value for removal.
   Withdrawing a vote is not possible today.

### `SocialController` route error — the `/vote/answer` slash is missing

The mapping at `SocialController:96` is `"/social/comments/vote/answer{answer_id}"`. There is
no slash before the path variable, so the real route is `/social/comments/vote/answer<id>`.
The sibling endpoint on the comment side (`:73`) is written correctly
(`.../vote/comment/{comment_id}`). A controller-level defect, outside the unit layer; not
fixed in this batch, recorded.

### Dead code deleted — `StudentService`'s second moderation path

Seven methods with no caller were deleted from `StudentService`: `deleteUser`,
`blockStudent`, `unblockStudent`, `findByKitEmail`, `addStudent`, `getAllUsers`, `getUser`.
The code was already asking the question itself: `//TODO: Why arent they in use?`.

The reason for deleting rather than testing is not just coverage arithmetic. The live
administrator flow is `ModerationUserService` (`blockStudent` :591, `unblockStudent` :617),
and it additionally does `protectAdministrator`, the idempotency short-circuit, the
`blockedAt`/`blockedReason` record, `revokeTokens(target)` and
`auditWriter.write(... USER_BLOCKED ...)`. `StudentService`'s copies did **none** of this —
only `setStatus` + `save`. That is: no token revocation, no audit entry, no administrator
protection. Writing tests for those would have nailed down a silently weaker second path
through moderation that nobody depends on, at the very moment the code was being reduced to a
single path.

The unused `import com.pse.user.service.StudentService;` in `RatingService` was removed as
well. `StudentService`'s only consumer in `src/main` is now `AccountService`, and it uses
exactly three methods.

Because the deletion lowered the denominator, the measurement was taken at the *start* of the
batch but **after** the deletion; that is why the 3341 in this document is smaller than batch
1's 3403.

### A test file sitting in the wrong package

`StudentServiceTests` was sitting at the `com.pse` root, while the class is in
`com.pse.user.service`. It was moved to `com/pse/user/service/` and converted to the house
style: a manual constructor factory instead of `@InjectMocks`, AssertJ instead of JUnit
`assertEquals`. The same move as `1cd449b` (ProfessorServiceTests). The two existing
credibility tests were kept, only renamed into the `method_scenario_expectation` convention.

### Prompt/code mismatches

The code was taken as authoritative in every case: `AuditCursorCodec` is in
`com.pse.audit.service`; `AuditRevertService` is in `com.pse.audit.revert` and takes a
`List<AuditRevertHandler>`, not a `Map`; `RateLimitService` takes a
`PlatformTransactionManager`, not a `TransactionTemplate`; `LoginLocationService` was not
injecting `RestClient`.

---

## Open questions

### The BUG-1 nanosecond hypothesis

**Hypothesis.** `AuditLog.@PrePersist` writes nanosecond precision with `Instant.now()`,
while the Postgres `timestamptz` column truncates to microseconds. A cursor built from an
entity that is sitting in the persistence context and has not been re-read from the DB
carries `…123456789` while the row holds `…123456`. Since `.123456 < .123456789` is true, the
keyset predicate matches the same row again and the row **repeats** at the top of the next
page.

**Why a unit test cannot verify it.** The truncation is the behaviour of the JDBC driver and
the column type, not of the codec. `KeysetCursorCodec` round-trips nanoseconds losslessly — a
unit test can only prove that. Producing the defect needs a real write, a real column and a
real read-back.

**Where it will be tested.** In the integration batch, against a real Postgres with
Testcontainers: write two rows inside one transaction, page with `limit=1`, and verify that
no row appears on two pages.

**A tension that has to be resolved first:** Testcontainers is not currently a dependency and
`CLAUDE.md` says the tests deliberately do not require Docker (H2, Flyway's H2 migrations,
`ddl-auto=validate`, the `test` profile). H2 in PostgreSQL mode does not model `timestamptz`
precision the same way, so the current test profile cannot settle this question. Adding the
dependency changes the CI contract — a decision for the integration batch.

---

## Classes

### KeysetCursorCodec

- **Responsibility:** encodes and decodes the opaque cursor for keyset pagination over the
  `(createdAt DESC, id DESC)` ordering.
- **Behaviours tested:**
  - the `encode → decode` round-trip, nanosecond precision included
  - the wire format: `1|<Instant>|<UUID>`, URL-safe base64 without padding
  - that the `LocalDateTime` overload gives the same result as the UTC `Instant` overload and
    that `Cursor.createdAtLocal()` is its exact inverse
  - the seven rejection paths: null, empty, the 512-character limit, non-base64, wrong
    version, wrong number of parts, undecodable `Instant`/`UUID` — all 400
  - that the error message is the text the caller supplied
- **Deliberately not tested:** the effect of the cursor on the database query — that is a
  Criteria predicate and belongs to the integration layer. Nanosecond/microsecond truncation
  (the open question above).
- **Mocks used:** none; the class has no dependencies.
- **Remaining risk:** producing the cursor correctly and *applying* it correctly are separate
  things; the predicate and the page boundary live in the integration layer.
- **Test count:** 23 (good: 6, bad: 17)

### AuditCursorCodec

- **Responsibility:** a thin delegate that binds the audit-specific error message to the
  shared codec.
- **Behaviours tested:** that `encode`/`decode` are passed through unchanged, that
  `"Invalid audit cursor"` is handed to `decode`, that an `ApiException` thrown by the
  delegate propagates unwrapped, and a round-trip through the real codec.
- **Deliberately not tested:** the codec logic itself — that is in `KeysetCursorCodecTests`.
  The `encode(LocalDateTime, …)` overload is not exposed by this class.
- **Mocks used:** `KeysetCursorCodec` — mocking is the only way to verify that the delegation
  actually happens; two tests then look at it end to end through the real codec.
- **Remaining risk:** next to none; the class is 5 lines.
- **Test count:** 5 (good: 3, bad: 2)

### RevertValues

- **Responsibility:** reads and compares the `before`/`after` values coming back from the
  audit entry's JSON column, in a type-insensitive way.
- **Behaviours tested:**
  - `sameValue`: two nulls, one null, enum ↔ its name, `Integer` ↔ `Long`, number ↔ text,
    ordered list equality, an order change counting as a difference
  - `asString` / `asInteger` / `asBoolean` / `asEnum` / `asIds`: present, missing, wrong type,
    malformed value
  - the exceptions: `NumberFormatException`, `IllegalArgumentException` (`No enum constant`,
    `Invalid UUID string`)
- **Deliberately not tested:** real Jackson serialisation — the input here is an already
  deserialised `Map`. Which handler reads which field is the handlers' own business.
- **Mocks used:** none; a static helper class.
- **Remaining risk:** two behaviours were deliberately pinned "as they are" and may genuinely
  not be wanted: because number comparison goes through `longValue()`, `1` and `1.9` count as
  equal; and `Boolean.valueOf` silently turns `"yes"` into `false`. No recorded field is
  fractional today and no field writes `"yes"`, but a new field could change that.
- **Test count:** 37 (good: 20, bad: 17)

### AdminBootstrapPolicy

- **Responsibility:** resolves the configured `email` / `email:Name` list and says which
  accounts are made administrators at startup.
- **Behaviours tested:** empty configuration, entries with and without a name, multiple
  entries, case normalisation, whitespace trimming, empty entries being dropped, splitting on
  the first colon, an entry with no email, a duplicate email, the immutability of the returned
  set.
- **Deliberately not tested:** `AdminBootstrapRunner` actually creating the account — a
  different class and an integration matter. The order of `bootstrapEmails()` is not tested
  because `Map.copyOf` does not preserve ordering; it is not part of the contract.
- **Mocks used:** none; a constructor with a single `String` parameter.
- **Remaining risk:** the argument is **not** normalised — `shouldBootstrap` does an exact
  match, so an unnormalised address silently misses. The contract is in the parameter name
  (`normalizedEmail`) and the caller `AuthService` lowercases; the test pins that. A `null`
  argument throws a `NullPointerException` because of `Map.copyOf` — pinned as the current
  behaviour, as agreed.
- **Test count:** 18 (good: 6, bad: 12)

### OtpService

- **Responsibility:** generates the one-time login code, stores it hashed, and consumes it
  exactly once.
- **Behaviours tested:** invalidating open codes before generating a new one (`InOrder`),
  `expiresAt = now + ttl` (default and custom TTL, `Clock.fixed`), the plaintext not being
  stored, the correct code setting `used = true`, a wrong code, no candidates, a legacy
  plaintext match, a candidate with neither a hash nor a legacy value, only the matching one
  of several candidates being marked, and the time passed to the query coming from the
  injected clock.
- **Deliberately not tested:** the randomness of `TokenGenerator` (covered by
  `TokenGeneratorTests`) and Argon2 itself. **The real filtering at the TTL boundary is the
  repository query's business** (`…AndExpiresAtAfter…`), so only the written `expiresAt` and
  the instant handed to the query are verified here.
- **Mocks used:** `OneTimePasswordRepository` — to stay off the database and to compose the
  candidate list. `HashGenerator` is static and cannot be mocked; since Argon2 (m=32768, t=3)
  is expensive, a real hash is computed only once per class and the other `consume` tests use
  the legacy plaintext branch.
- **Remaining risk:** expired and used codes actually being filtered out belongs to the
  integration layer; at the unit level they are represented as "an empty candidate list".
  Pessimistic lock behaviour is not tested either.
- **Test count:** 13 (good: 9, bad: 4)

### RateLimitService

- **Responsibility:** limits code requests and login attempts by keeping a fixed-window bucket
  per operation and HMAC'd subject.
- **Behaviours tested:**
  - the subject hash: stability, the email/IP namespace separation, 64 hex characters, a
    `null` IP becoming `"unknown"`, `IllegalStateException` on an empty key
  - `validateConfiguration`: a 31 / 32 / `null` key
  - `consume`: creating the bucket when there is none, incrementing below the limit, **the
    moment the bucket becomes exactly full** (still successful), **the request after it is
    full** (`RateLimitException`, nothing written), resetting in an expired window, a bucket
    whose window ends exactly now, success after two collisions, rethrowing on three
    collisions, a refusal not being retried, separate buckets for different subjects
  - `ensureAllowed`: no bucket / below the limit / at the limit / expired, that it never
    writes, and that the `Retry-After` value is at least 1 second
  - `reset`: only that bucket being deleted
- **Deliberately not tested:** real `REQUIRES_NEW` transaction semantics and the unique
  constraint race — a mocked manager does not actually apply propagation. The limit values
  inside `AuthService` are not read here either.
- **Mocks used:** `AuthRateLimitBucketRepository` (no database) and
  `PlatformTransactionManager`. The manager is mocked because the service builds the
  `TransactionTemplate` itself; the real template then really does run the callback.
- **Remaining risk:** that two concurrent requests count the same bucket correctly can only be
  shown at the integration layer; the three-attempt retry loop here is simulated with mocks.
- **Test count:** 26 (good: 18, bad: 8)

### AuditRevertService

- **Responsibility:** decides whether an audit entry is revertible and reverses a single field
  edit.
- **Behaviours tested:**
  - `describe`: an empty page, a clean field diff, a non-revertible action, a target type with
    no handler, a lifecycle key (`exists`), a change with no `before`/`after`, empty `changes`,
    **a refusal entry with no target id** (the old 500 regression), an already reverted entry
    (+ the id of the entry that reverted it), outside the window, **exactly on the cutoff**
    (still revertible), one nanosecond past the cutoff, a vanished target, a changed value, a
    field the handler does not know
  - batching: **a single call** to `currentValues` for two entries of the same type; no query
    at all on a page with no candidates; one decision per entry on a mixed page
  - `revert`: applying the `before` values, `AuditRevertContext` being populated while the
    handler runs and empty afterwards, being cleared even when the handler blows up, the 404,
    and for each of the five refusals a 409 + message + `reason.name()` code
  - handler wiring: `IllegalStateException` when two handlers claim the same target type,
    routing to the right handler, having no handler at all
- **Deliberately not tested:** the handler implementations themselves (`UserRevertHandler`
  and friends) and the reversal reaching the database — separate classes, an integration
  matter. `@Transactional` semantics are not present here.
- **Mocks used:** `AuditLogRepository` (no database, and to compose the `findReversalsOf`
  rows) and `AuditRevertHandler` — mock handlers inside a real `List`, because the service
  builds the map itself with `Collectors.toMap`.
- **Remaining risk:** the window enters the message through `Duration.toString()`, so `P7D`
  appears to the user as `PT168H`. The test pins that, but it is a product decision; if the
  panel wants readable text, the message has to change.
- **Test count:** 30 (good: 8, bad: 22)

### LoginLocationService

- **Responsibility:** resolves the approximate location for an IP address and produces the map
  HTML embedded in the login notification email.
- **Behaviours tested:**
  - the resolved path: a full response, city only, an empty region (no double comma), and
    **only the first address** in an X-Forwarded-For list being queried (verified by resolving
    the captured `UriBuilder` function with a real factory)
  - the paths that never touch the network: a null/empty address, an empty token
  - **each failure separately:** 401, 403, 429, 5xx, timeout (`SocketTimeoutException`), DNS
    failure (`UnknownHostException`), an undeserialisable body, a `null` body, a bogon address
    (all fields null), an unparseable `loc`
  - that in each of those the returned value is **exactly** `LoginLocation("Unknown", null,
    null)` and a WARN is logged; and that on the empty-token path there is **no log at all**
    during the request
  - `warnIfTokenMissing()`: a WARN at startup containing the name `IPINFO_TOKEN` when the
    token is empty or only whitespace, and no log at all when the token is present
  - `createStaticMap`: valid coordinates + key (`lonlat` order reversed), an empty Geoapify
    key, invalid coordinate formats (parameterised), empty output when there are no
    coordinates and no URL, HTML escaping
- **Deliberately not tested:** real IPinfo/Geoapify calls. The full text of the generated HTML
  — it would be brittle; distinctive fragments are verified instead. **The provider fallback
  chain was not tested because there is none:** Geoapify only produces the static image, and
  the only fallback is `catch (Exception) → "Unknown"`.
- **Mocks used:** `RestClient` and three levels of its fluent chain
  (`RequestHeadersUriSpec`, `RequestHeadersSpec`, `ResponseSpec`) — to avoid real HTTP. To
  make that possible, `RestClient` is now injected through the constructor
  (`RestClientConfig`); the behaviour did not change. Also a Logback `ListAppender`, because
  the difference between a silent failure and a logged one is this batch's main finding.
- **Remaining risk:**
  - **The `IPINFO_TOKEN` warning only fires at startup.** If the token is revoked later, the
    only trace is the 401/403 WARNs; a per-request warning was deliberately not added (log
    noise on every login).
  - **The broad `catch (Exception)`** makes 401/403/429/timeout indistinguishable from the
    caller's point of view; the distinction exists only in the log. Proposed (not applied):
    narrowing the catch.
  - The coordinate regex rejects whitespace around the comma (`"49.0, 8.4"` is invalid). Not a
    problem today because IPinfo returns no whitespace, but if the provider's format changes
    it silently drops the map.
- **Test count:** 39 (good: 10, bad: 29)

### CatalogueRevertHandler.LectureHandler / .ProfessorHandler

- **Responsibility:** reverts lecture and professor field edits, mutual assignments included.
  The only handler pair in `com.pse.audit.revert` that declares a *collection* field.
- **Behaviours tested:**
  - `LectureHandler.currentValues`: all seven fields (`professors` as a list of UUID strings),
    an **empty list** for a lecture with no professors (not a missing key), a deleted lecture
    not appearing in the map, an empty target list
  - **BUG-3, in two deterministic halves:** that with a `LinkedHashSet` fixture the handler
    produces an order the declared `Set` type does not define; and that `RevertValues.sameValue`
    counts the same two elements in reverse order as different (while they are equal as sets)
  - `LectureHandler.applyInverse`: resolving all seven fields — in particular mapping the
    recorded `"professors"` key to the request's `professorIds` field — and the others staying
    `null` on a single-field `before` half
  - `ProfessorHandler`: four fields + the `lectures` list, a deleted professor, an empty target
    list, full and partial `applyInverse`, and going to **`updateProfessor`** rather than
    `updateLecture`
- **Deliberately not tested:** `ModerationCatalogService` itself (a separate class, the next
  batch). `lecture.getSemesterSeason().name()` and `getLectureType().name()` have no null
  guard, but both columns are `nullable = false`, so it is a state unreachable from a persisted
  row — a test would be asserting on a fiction. The real `HashSet` iteration order (the reason
  is under BUG-3).
- **Mocks used:** `LectureRepository`, `ProfessorRepository` (to stay off the database and to
  compose the "no such row" case) and `ModerationCatalogService` — `applyInverse` does not
  write the fields itself, it calls the method the panel calls, so what has to be verified is
  the delegation itself.
- **Remaining risk:** BUG-3 is open. Real-world order changes from run to run because
  `Professor` has no `hashCode`, so the defect looks **unstable** in production: the same edit
  is revertible once and gives `VALUE_CHANGED` the next time. This is the most likely reason a
  bug report cannot be reproduced.
- **Test count:** 15 (good: 7, bad: 8) — LectureHandler 9, ProfessorHandler 6

### ReportStatusRevertHandler.CommentReportHandler / .AnswerReportHandler

- **Responsibility:** reverts a report's status change. Why it matters: `ACTION_TAKEN` hides
  the content the report is about, so a status given by mistake takes a post out of the app.
- **Behaviours tested:** for both handlers, the single `status` field being mapped under its
  name, a deleted report not appearing in the map, an empty target list, the enum passed to
  `updateReportStatus`, and `null` being passed on a `before` half that contains no `status`.
  Both `applyInverse` tests also verify that the **other** service is never touched.
- **Deliberately not tested:** the status change actually hiding/restoring the content — that
  is `ModerationCommentService` / `ModerationAnswerReportService`'s business, an integration
  matter.
- **Mocks used:** `CommentReportRepository`, `AnswerReportRepository`,
  `ModerationCommentService`, `ModerationAnswerReportService`. All four together, because in a
  handler pair carrying this little logic the mistake worth catching is a copy-paste one: a
  handler wired to the wrong repository or the wrong service reverts the wrong report — or
  nothing at all.
- **Remaining risk:** next to none; the two handlers are 30 lines in total and both are at
  100%.
- **Test count:** 10 (good: 6, bad: 4) — CommentReportHandler 6, AnswerReportHandler 4

### WarningRevertHandler

- **Responsibility:** reverts a correction to a warning's text. The **only** handler that runs
  its own query inside `applyInverse`: because a warning is addressed as a sub-resource of the
  student it was issued to, the owner has to be resolved first — and that makes it the only
  handler that can refuse.
- **Behaviours tested:** the single `message` field, a withdrawn warning not appearing in the
  map, an empty target list, the argument order of
  `updateWarning(principal, studentId, warningId, request)` being built from the warning row
  (not from the audit entry — the owner is not one of the recorded fields), and refusing a
  missing warning with `ApiException` + `NOT_FOUND` + `"Warning not found"`.
- **Deliberately not tested:** the `warning.getStudent()` NPE. `Warning.student` is
  `@ManyToOne(optional = false)`, so a row with a null student cannot exist; the test would be
  asserting on an unreachable state.
- **Mocks used:** `WarningRepository` (for both `findAllById` and `findById`, the second of
  which only exists in this handler) and `ModerationUserService`.
- **Remaining risk:** nothing holds a lock between the revertibility check and the revert
  itself, so the `NOT_FOUND` path is a real race: the check sees the row and says
  "revertible", and by the moment of the revert the row can be gone. The handler behaves
  correctly (refusing rather than blowing up), but the user gets an error on an entry that
  looked revertible.
- **Test count:** 6 (good: 3, bad: 3)

### UserRevertHandler

- **Responsibility:** reverts student account field edits. The broadest handler: six fields,
  and the only one that builds the value set it reports from **two tables** — the student row
  plus the administrator id list, because the role is not a column on the student.
- **Behaviours tested:**
  - all six fields; `role = ADMIN` for a student in the administrator id set and `STUDENT` for
    one that is not (the two arms of the ternary separately)
  - `biography == null → ""`: a normalisation that carries weight, because the audit entry
    also records `""` — reporting `null` would make an untouched biography look changed and
    refuse the revert
  - **skipping** a `UserStatus.DELETED` row: an anonymised account's recorded username and
    address are already gone, so it has to be read as a **missing** target rather than a stale
    one; reporting it would propose a revert that writes the anonymous values back as if they
    were real
  - an id that did not survive not appearing in the map
  - characterisation: the administrator id list being fetched before the loop, so it is
    queried **even on an empty id list**
  - `applyInverse`: all six fields in full, and the others staying `null` on a single-field
    `before` half
- **Deliberately not tested:** `ModerationUserService.updateStudent` itself — the role
  demotion protection and the validation belong there. The handler deliberately calls that
  path so the revert inherits the same safeguards.
- **Mocks used:** `StudentRepository`, `AdminRepository` (the role can only be derived from
  there) and `ModerationUserService`.
- **Remaining risk:** this handler's `currentValues` and `applyInverse` were already being
  driven end to end by
  `AdminApiIntegrationTests.aFieldEditIsRevertibleAndTheReversalIsItsOwnAuditEvent`; the unit
  tests' real contribution was only the `DELETED` and `ADMIN` branches (2 missed lines before
  the batch). So the value here is not coverage but getting **why** those branches are the way
  they are into writing.
- **Test count:** 9 (good: 4, bad: 5)

### SocialService (voteComment / voteAnswer)

- **Responsibility:** votes on a comment or an answer; on the same student's second vote it has
  to update the existing row, because the table has a unique constraint on
  `(student, comment)`.
- **Behaviours tested:** the vote table never being touched for a target that cannot be found;
  the row being built with `student` + `comment`/`answer` + `vote` on the first vote; **the
  same instance** being mutated and saved on the second (`isSameAs`, no second row inserted);
  the answer path not touching the comment vote table. And, as characterisation, the **four
  gaps**: no toggle-off, and a `null` `voteType` being saved with `success = true` (for each of
  the two methods separately).
- **Deliberately not tested:** `submitComment` / `submitAnswer` / the report methods and the
  notification path — the class's remaining 16 missed lines, a later batch. The unique
  constraint actually preventing a second row is an integration matter; only *what* the code
  hands to `save` is verified here.
- **Mocks used:** only the four repositories the two methods touch (`CommentRepository`,
  `AnswerRepository`, `CommentVoteRepository`, `AnswerVoteRepository`). The constructor's
  remaining five dependencies (`LectureService`, the two report repositories,
  `NotificationRepository`, `AuditWriter`) are passed as **`null`** rather than mocks: putting
  mocks there would let a future edit start using these collaborators silently, whereas `null`
  turns that into an immediate NPE in the method's own test. `AuditWriter` being on that list
  is the finding itself.
- **Remaining risk:** none of the four gaps was fixed — all are product decisions. The most
  serious is the missing audit: vote manipulation does not show up in the moderation trail at
  all. A `null` `voteType` surfaces as `DataIntegrityViolationException` → 409 "State
  conflict", so the client expects a 400 and gets a 409.
- **Test count:** 9 (good: 4, bad: 5)

### StudentService

- **Responsibility:** assembles the profile information from an entity graph and soft-deletes
  the account.
- **Behaviours tested:**
  - `getUserInformation`: the credibility score being up minus down, the case that comes out
    at zero, the average score + rating/comment counts, a zero average when there are no
    ratings (not a division by zero), and the exact failure shape returned for a student that
    cannot be found
  - the score counting **every** vote that reaches the student who wrote the content,
    regardless of who cast it (pinned so that a future "do not count your own vote" change is a
    deliberate one)
  - `getUserRatings`: each rating being mapped to a `LectureResponse` + average score, the
    count embedded in the message (`"Success, found 2 ratings."`), `success = true` even on an
    empty list, and an **empty list** rather than `null` for a student that cannot be found
  - `deleteAccount`: a `null` principal; a principal whose email is not in the table (nothing
    is written); and on the happy path `UserStatus.DELETED` being written and saved and the
    message containing the email
- **Deliberately not tested:** there is no direct test for `softDeleteByKitEmail` or
  `getAverageRating` — every branch of both is exercised through `deleteAccount` /
  `getUserInformation`, and a separate test would only count the same lines twice.
  `ProfilePictureGenerator`, `LectureService.createLectureResponse` and
  `RatingService.calculateAverageScore` are **static** and are not mocked; `mockStatic` would
  mean a new dependency (mockito-inline) and a departure from the house style, and there is no
  need — plain fixtures drive all three.
- **Mocks used:** only `StudentRepository`; the class's single dependency.
- **Remaining risk:**
  - **No path throws.** Every failure is a response carrying `success = false` and an HTTP
    200. So a caller that looks only at thrown errors takes a broken lookup for a successful
    one. The tests pin this contract, but the contract itself is arguable.
  - `getUserInformation` calls `student.setCredibilityScore(...)` inside a `readOnly = true`
    transaction. Harmless at the unit level; what dirty checking does in a real persistence
    context is an integration question.
  - Typos in the message strings (`couldnt`, `succesfully`) were reaching the client; the three
    in `deleteAccount` were fixed in `edaf2bc` and the remaining five in `src/main` in
    `57658c3`, and the tests that pin them were updated along with them (F-10 closed).
- **Test count:** 12 (good: 6, bad: 6)

### AccountService

- **Responsibility:** a thin facade over `StudentService`, with exactly one piece of logic of
  its own: revoking the tokens issued to an account when it is deleted.
- **Behaviours tested:** the two read paths delegating unchanged with `student.getId()`; in
  `deleteAccount`, `invalidateAllAuthTokensForEmail` being called on a **successful** deletion
  and not called on a **failed** one; and `requestLogout` embedding the returned session count
  in the message (three sessions and zero sessions).
- **Deliberately not tested:** `AuthService.invalidateAllAuthTokensForEmail` actually revoking
  the tokens — that is `AuthService`'s business. That a deleted account's token can no longer
  make requests is an integration matter (`TokenAuthenticationService` rejects `DELETED`).
- **Mocks used:** `AuthService` and `StudentService`. `StudentService` is mocked because what is
  under examination is not the deletion itself but whether token revocation happens **according
  to the result** of the deletion.
- **Remaining risk:** without the `success` condition, the account would go `DELETED` while
  every token stayed valid until it expired, and a student token lives for a year — which is
  why the failed-deletion branch is the single most valuable test in this batch. The class
  throws an NPE on `getId()`/`getKitEmail()` if `student == null`; not tested, because the
  security chain supplies the principal.
- **Test count:** 6 (good: 4, bad: 2)
