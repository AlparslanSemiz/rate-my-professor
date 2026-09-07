# Test plan

Layers: **unit → API/role → integration → E2E**. Every batch adds its own section. The unit
layer is covered by batches 1–3, the API/role layer by the authorization, protocol and
ownership sweeps below. The integration and E2E layers have not been started; what blocks the
first of them is the Testcontainers question under [Open questions](#open-questions).

### Where it stands

**559 tests, 0 failures**, 2 skipped (the `@Disabled` `DemoApplicationTests`, and
`PostgreSqlMigrationSmokeTests`, which runs on CI only). Bundle **92.56% LINE** (3112/3362),
**77.09% BRANCH** (878/1139), against gates of 0.90 and 0.73.

| Layer | State |
|---|---|
| Unit | Batches 1–3 done. The gap left is branch coverage in the moderation services. |
| API / role | The three sweeps below. |
| Integration | **Not started** — blocked on the Testcontainers decision. |
| E2E | **Not started.** |

The 15-point spread between LINE and BRANCH is where the remaining work is, and it is
concentrated: `ModerationCatalogService` (48 missed branches), `ModerationUserService` (51),
`ModerationContentService` (29), `RestClientGitLabClient` (18).

### The metric

The coverage metric is LINE coverage, target 90%. Batch 1's result:

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
The counts are parameterized tests expanded into their individual cases.

Shared rules: plain JUnit + AssertJ + Mockito, no Spring context, no database/network/file
system, `Clock.fixed` everywhere a clock is injected. Tests live in mirror packages — this
is required because `RateLimitService.validateConfiguration()` and
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

\* The number for the whole class. The `voteComment` / `voteAnswer` methods this batch
targeted are covered **completely** (0 missed lines); the remaining 16 lines belong to the
`submit*` and report methods and were left to a later batch.

**67 tests in total (good 34 / bad 33).** Whole suite: 439 tests, 0 failures (2 skipped:
the `@Disabled` `DemoApplicationTests` and `PostgreSqlMigrationSmokeTests`, which runs on
CI only). The counts are parameterized tests expanded into their individual cases.

With this batch **all nine handler beans** in the `com.pse.audit.revert` package, plus
`AuditRevertService` and `RevertValues`, reached 100% LINE; no missed lines are left in
the package.

### Bundle and thresholds

Measured bundle: **91.41% LINE** (3054/3341), **75.51% BRANCH** (845/1119).
Before the batch the measurement was 87.76% LINE / 72.83% BRANCH.

`jacoco:check` was pulled up to two limits: LINE `0.85` → **`0.90`**, plus a new **BRANCH
`0.73`** floor. Both sit about one and a half points below what is measured — the rule is
to leave the measurement some headroom, not to pin it to a round target. The reason:
`check` is bound to the `verify` phase rather than `test`, so a threshold with no headroom
breaks on CI, in somebody else's MR, on a change that has nothing to do with tests — which
is exactly the failure mode the comment in the pom says it was chosen to avoid. BRANCH is
a floor, not a target: a LINE-only gate let a method with many branches arrive with a
single happy-path test while branch coverage quietly dropped.

The threshold really is a gate, and that was verified: with LINE temporarily raised to
`0.95`, `./mvnw verify` went red with "lines covered ratio is 0.91, but expected minimum
is 0.95", and green at `0.90`.

**Deliberately not done** — all three are shortcuts that raise the number without writing
a test, which redefines the ratchet instead of clearing it:

- The `<excludes>` list was not widened. Adding `**/model/**` or `**/dto/**` would have
  bought several points without a single test.
- No `lombok.config` was added to filter Lombok out. The repo has no `lombok.config` and
  `addLombokGeneratedAnnotation` defaults to `false`, so every generated getter/setter
  counts towards the bundle. Because accessors are heavily covered through serialization,
  filtering them could delete more *covered* lines than uncovered ones and lower the
  ratio — and it would quietly change what the number measures.
- No reflection tests were written for the private constructors of static-only classes;
  JaCoCo has filtered those since 0.8.0.

`ModerationCatalogService.updateLecture` / `updateProfessor` (31 missed lines, 57/106
branches) was this batch's conditional fourth group: it was not needed because the bundle
passed 91%. It is the first candidate for the next batch, being the most branch-heavy
untested method left.

### Three different coverage numbers

To keep them apart: the three numbers measure three separate things; this is not an
inconsistency.

- **pom `jacoco:check` (LINE 0.90 / BRANCH 0.73)** — the bundle regression gate. The floor
  it must not fall below again.
- **The 90% target in this document** — the level batches aim for.
- **`scripts/CheckChangedCoverage.java --threshold 30`** — the MR gate, which looks only
  at the coverage of *changed* code. Unrelated to the bundle.

---

## Batch 3 — the last two revert handlers

Target: the two handlers in `com.pse.audit.revert` that batches 1 and 2 did not reach, which
closes the package.

| Class | LINE | BRANCH | Tests |
|---|---|---|---|
| `BugReportRevertHandler` | 100.0% | 100% | 6 |
| `ContentRevertHandler.CommentHandler` | 100.0% | 100% | 5 |
| `ContentRevertHandler.AnswerHandler` | 100.0% | 100% | 4 |

**15 tests in total.** There are **nine** handler beans in the package; batch 2 covered six of
them and these are the last three. Every one of the nine, plus `AuditRevertService` and
`RevertValues`, now has **0 missed lines**. Branches are not quite there: `AuditRevertService`
still has 5 missed and `RevertValues` 1.

What these tests added is not LINE coverage — the three handlers were already reachable through
`AdminApiIntegrationTests`, which is [P-2](test-findings.md#p-2--integration-tests-hide-unit-targets)
exactly: an integration test can hold a unit target at 100% while nothing states what the unit
is supposed to do. What they added is the statement of intent, at the level where a wrong answer
is cheap to see.

These arrived on the `bugreports` branch (`05a9eac`) rather than as a planned batch, which is
why they were in `src` without being in this document until now. They follow the batch 2 shape
exactly: a manual constructor factory rather than `@InjectMocks`, mocked repository plus mocked
moderation service, and the same four questions per handler — the target type, the field map,
a deleted row being **absent** rather than mapped to null, and `applyInverse` replaying through
the service the panel itself calls.

## The API / role batch

A different layer with a different metric. Coverage is not the measure here: these tests drive
the whole application through `MockMvc` against a real Spring context, and what they assert is
the **shape of the API surface**, not the lines of one class.

Three sweeps, all built the same way — the route list is read from Spring's own
`RequestMappingHandlerMapping` rather than kept by hand. That choice is the point of the batch.
A list maintained by a person goes stale silently and the sweep then passes because it is
looking at less than it thinks; a list read from the mapping cannot, and a new endpoint has to
be classified by whoever adds it.

| Test class | Question it asks | Tests |
|---|---|---|
| `ApiAuthorizationMatrixTests` | May an **anonymous** caller in? | 6 |
| `ApiProtocolContractTests` | Does the API answer with the **right status code**? | 5 |
| `ApiOwnershipMatrixTests` | May an **authenticated** caller touch somebody else's row? | 7 |

### The authorization matrix

The security chain ends in `anyRequest().permitAll()`, so an endpoint is anonymous unless some
matcher names it. Reading `SecurityConfig` alone therefore cannot distinguish "deliberately
public" from "nobody thought about it", and a new controller method inherits the open default
in silence. `everyRouteIsEitherDeclaredPublicOrRefusesAnonymousCallers` closes that: every one
of the 122 mapped routes must either refuse an anonymous caller with 401 or appear in
`PUBLIC_ROUTES`, a list of 14 entries that someone had to write deliberately.

The reverse direction is tested too — a route declared public has to stay reachable — so the
list cannot be used to wave a route through after it has been accidentally locked down.

Three findings came out of it, all recorded in [test-findings.md](test-findings.md): the
missing slash in the `/vote/answer` route (F-4, fixed), a missing bearer token answering 500
rather than 401, and `POST /data/professor` answering `200 {"success": false}` to a non-admin
instead of a real 403.

### The protocol sweep

The same idea applied to status codes rather than to authorization. It found F-14 through F-17;
F-17 is fixed, the rest are pinned as they are:

- **F-16** — a path that exists, called with a verb it does not map, answers **404 instead of
  405**, on all 122 routes. Pinned, not fixed: it is a contract change with two documented
  dependents and an unknown Android dependency, so it belongs in its own conversation with the
  team rather than in a test batch.
- **F-17** — a body in a media type no converter can read answered **500 instead of 415** on
  all 37 body-reading routes. **Fixed** with one narrow `@ExceptionHandler`; the writeup in the
  findings document records why extending `ResponseEntityExceptionHandler` was the wrong fix
  and what the red run proved before the pin was flipped.
- **F-14, F-15** — a missing required query parameter and the category list of an unknown
  lecture both answer 500. Open.

The two statuses that are wrong but pinned live in `com.pse.support.ApiContract` rather than in
the sweep, because `AdminApiPathSplitTests` asserts one of them incidentally. Deciding to fix
one is then a single edit, and the sweep tells you every route the decision touches.

### The ownership sweep

The half the authorization matrix does not cover: a valid token is not permission to touch a
row belonging to somebody else. All 61 id-taking routes are classified into four sets —
owner-scoped (1), cross-user by design (2), admin tier (52), and ids that name no user's row
(6) — and the ratchet requires every id-taking route to be in exactly one of them.

**It found no IDOR.** The negative result and the evidence behind it are written up under
[Negative results](test-findings.md#negative-results); the short version is that the app tier
takes the caller's identity only from `@AuthenticationPrincipal`, which
`noAppTierHandlerTakesACallerIdentityFromTheRequest` now pins by reflection over every app-tier
handler and its `@RequestBody` type. That invariant, not the individual probes, is what keeps
the owner-scoped column one line long.

## Deliberately uncovered

Three classes are visibly low and none of them is an oversight. Saying so here is the point:
an unexplained 0% reads as neglect, and the next person re-derives the reason or, worse,
writes a test that pins an adapter's plumbing.

| Class | LINE | Why |
|---|---|---|
| `MailService` | **0.0%** (0/46) | An SMTP adapter behind `LoginCodeDelivery` / `LoginSuccessDelivery`. Every test substitutes `CapturingLoginCodeDelivery` through `TestDeliveryConfig`, so the real class is never constructed. Testing it means mocking `JavaMailSender` and asserting on a `MimeMessageHelper` — that is, asserting that the adapter calls the library the way the library documents. Its logic worth testing (the location lookup, the template fill) already lives in `LoginLocationService` and `MailTemplateService`. |
| `MailTemplateService` | **7.7%** (1/13) | Its entire job is reading template files from `static/mail/` off the classpath and substituting `{{placeholders}}`. The house rule for unit tests is no file system; a test here would either break that rule or assert over its own fixture. It is a candidate for the integration layer, not this one. |
| `RestClientGitLabClient` | **23.1%** (9/39, 4/22 branch) | An HTTP adapter behind `GitLabClient`, substituted in tests by `RecordingGitLabClient` (`@Primary`). Unlike the two above, **this one has no principled excuse** — `LoginLocationServiceTests` shows exactly how to test a `RestClient` caller by mocking the fluent chain, and the same could be done here. It is simply not done yet, and at 18 missed branches it is the largest single branch gap outside the moderation services. |

The distinction matters more than the numbers: the first two are decisions, the third is debt.

---

## Findings

### BUG-1 — "Does the cursor work on the backend?"

**Not reproducible on the backend.** It was traced end to end and every step came out
correct: the wire format (`base64url_nopad("1|<Instant>|<UUID>")`), `decode`'s seven
separate rejections, the agreement between the keyset predicate in `AuditLogService`
(`createdAt < c.createdAt OR (createdAt = c.createdAt AND id < c.id)`) and the
`ORDER BY createdAt DESC, id DESC` ordering, the `limit + 1` last-row probe, the controller
`@RequestParam cursor` binding, and the `nextCursor` field in the DTO. `AuditLog.createdAt`
is an `Instant` and uses the `Instant` overload; the two moderation lists that store
`LocalDateTime` correctly call `Cursor.createdAtLocal()` — there is no mixed-type
comparison anywhere. The extraction commit `096a484` is faithful line for line.

Decision: no red test, characterization tests instead. The format and every rejection were
pinned as a regression net; the problem is most likely on the panel side.

### BUG-2 — "Approximate location stopped working"

Three findings:

1. **There is no provider chain.** Geoapify only renders the static map image
   (`createStaticMapUrl`); it was never a geolocation fallback. The only fallback is
   `catch (Exception) → LoginLocation("Unknown", null, null)`.
2. **The most likely production cause:** `ipinfo.token=${IPINFO_TOKEN:}` falls back to
   empty and `getLoginLocation` returns `"Unknown"` through `ipInfoToken.isBlank()` without
   making any HTTP call at all. That path is still silent per request, but it now logs a
   WARN once at startup via `warnIfTokenMissing()` (`@PostConstruct`) — it is no longer the
   one failure that leaves no trace when the token is unset.
3. **The swallowed exception is logged.** `LOGGER.warn("Could not determine location for IP
   {}", ip, exception)` writes it with the stack trace (`8d18abb` added this). So 401/403/429
   and timeouts can be told apart in the logs; the only path that is silent during a request
   is the empty-token path, and that one is recognizable from the startup warning.

### Newly found defect — `normalizeIp` was crashing (fixed)

`","` (an `X-Forwarded-For` consisting of nothing but a comma) took `normalizeIp` down with
an `ArrayIndexOutOfBoundsException`: Java's `split(",")` drops trailing empty pieces, so the
array came back empty and `[0]` blew up. Because `normalizeIp` runs **before** the `try`
block, this was the one input the broad `catch` did not catch — the exception escaped
`getLoginLocation` and surfaced as an uncaught error in the login email sent from the
`AFTER_COMMIT` listener. The login itself kept succeeding.

Fix: `rawIp.split(",", -1)`. The negative limit keeps empty pieces, so the result is `[""]`
and falls into the existing blank check. The marker test
`getLoginLocation_addressOfOnlyCommas_returnsUnknownWithoutCallingIpInfo` now pins the
fixed behaviour.

### BUG-3 — Professor assignment order silently refuses a revert

`Lecture.professors` is a `Set<Professor>` — a type that defines no order — but
`CatalogueRevertHandler.LectureHandler.currentValues` turns it into an **ordered** `List`,
and `RevertValues.sameValue` compares two collections through
`asStrings(left).equals(asStrings(right))`, that is, position by position. The result: a
lecture whose professor assignment never changed can be marked `VALUE_CHANGED` and refuse a
legitimate revert, purely because the set's iteration order does not match the order written
into the audit JSON.

The same order sensitivity exists on the write side: `ModerationCatalogService.updateLecture`
builds `before` from the `Set` and `after` from the order of
`professorRepository.findAllById(...)` and compares them with `!before.equals(after)` — so an
unchanged assignment can write a bogus `professors` change and a bogus audit event.

**Why it was not tested against real `HashSet` order.** `Professor` overrides neither
`equals` nor `hashCode`, so identity hashing is used and bucket distribution depends on
object addresses: the order can differ **on every run**. Picking UUIDs to force an order
does not help, because the UUIDs never enter `hashCode` at all. Such a test would be flaky,
and the flakiness would be written into the test rather than into the defect. The defect was
split into two deterministic facts instead: with a `LinkedHashSet` fixture, that the handler
**produces an order the declared type does not define**, and that `sameValue` counts the same
two elements in reverse order as **different** — pinned separately.

Not fixed — order-insensitive comparison for set fields is a product decision and changes
`RevertValues`'s contract. The deterministic test for the write side (with a stubbed
`findAllById` order) was left to the `ModerationCatalogService` batch.

### Four gaps on the voting path

Four behaviours pinned in the `SocialService.voteComment` / `voteAnswer` characterization
tests, none of which look deliberate:

1. **No audit is written.** `submitComment` / `submitAnswer` / `submit*Report` in the same
   class all call `auditWriter.writeStudentAction(...)`; the two vote methods do not. So
   vote manipulation does not appear in the moderation trail.
2. **`voteType` is not validated.** A `null` vote type travels all the way to
   `setVote(null)` and is handed to `save`; the only thing that stops it is the
   `nullable = false` column, and only at flush time — outside a transaction this method
   opened, that is, not somewhere the caller can intervene. The method returns
   `success = true` in the meantime.
3. **Neither is `@Transactional`.** The other write methods in the class are.
4. **There is no toggle-off path.** A second vote in the same direction rewrites the vote
   instead of removing it, and `VoteType` (`UP`, `DOWN`) has no third value for removal.
   Withdrawing a vote is not possible today.

### `SocialController` route defect — the slash is missing from `/vote/answer`

The mapping at `SocialController:96` is `"/social/comments/vote/answer{answer_id}"`. There
is no slash before the path variable, so the real route is
`/social/comments/vote/answer<id>`. The sibling endpoint on the comment side (`:73`) is
written correctly (`.../vote/comment/{comment_id}`). This is a controller-level defect,
outside the unit layer; it was not fixed in this batch, only recorded. (Fixed in the
API/role batch — see F-4 for the current state.)

### Deleted dead code — `StudentService`'s second moderation path

Seven methods with no callers were deleted from `StudentService`: `deleteUser`,
`blockStudent`, `unblockStudent`, `findByKitEmail`, `addStudent`, `getAllUsers`, `getUser`.
The code was already asking the question itself: `//TODO: Why arent they in use?`.

The reason for deleting rather than testing is not just coverage arithmetic. The live
administrator flow is `ModerationUserService` (`blockStudent` :591, `unblockStudent` :617),
and that one also does `protectAdministrator`, an idempotency short-circuit, the
`blockedAt`/`blockedReason` bookkeeping, `revokeTokens(target)` and
`auditWriter.write(... USER_BLOCKED ...)`. `StudentService`'s copies did **none** of that —
only `setStatus` + `save`. No token revocation, no audit record, no administrator
protection. Writing tests for those would have nailed down a second, quietly weaker
moderation path that nobody depends on, at the very moment the code is being reduced to a
single path.

The unused `import com.pse.user.service.StudentService;` in `RatingService` was removed as
well. `StudentService`'s only consumer in `src/main` is now `AccountService`, and it uses
exactly three methods.

Because the deletion lowers the denominator, the measurement was taken at the *start* of the
batch, **after** the deletion; that is why the 3341 in this document is smaller than batch
1's 3403.

### A test file in the wrong package

`StudentServiceTests` sat in the `com.pse` root while the class lives in
`com.pse.user.service`. It was moved to `com/pse/user/service/` and converted to the house
style: a manual constructor factory instead of `@InjectMocks`, AssertJ instead of JUnit
`assertEquals`. The same move as `1cd449b` (ProfessorServiceTests). The two existing
credibility tests were kept, only renamed into the `method_scenario_expectation` scheme.

### Prompt/code mismatches

The code won in every case: `AuditCursorCodec` is in `com.pse.audit.service`;
`AuditRevertService` is in `com.pse.audit.revert` and takes a `List<AuditRevertHandler>`
rather than a `Map`; `RateLimitService` takes a `PlatformTransactionManager` rather than a
`TransactionTemplate`; `LoginLocationService` was not injecting `RestClient`.

---

## Open questions

### The BUG-1 nanosecond hypothesis

**Hypothesis.** `AuditLog.@PrePersist` writes nanosecond precision through `Instant.now()`,
while the Postgres `timestamptz` column truncates to microseconds. A cursor built from an
entity that is still in the persistence context and has not been re-read from the DB carries
`…123456789` while the row holds `…123456`. Since `.123456 < .123456789` is true, the keyset
predicate matches the same row again and the row **repeats** at the top of the next page.

**Why a unit test cannot confirm it.** The truncation is the behaviour of the JDBC driver
and the column type, not of the codec. `KeysetCursorCodec` round-trips nanoseconds without
loss — a unit test can only prove that. Producing the defect requires a real write, a real
column and a real read-back.

**Where it will be tested.** In the integration batch, against a real Postgres via
Testcontainers: write two rows inside one transaction, page with `limit=1`, and verify that
no row shows up on two pages.

**A tension to settle first:** Testcontainers is not a dependency today, and `CLAUDE.md`
says tests deliberately do not require Docker (H2, Flyway's H2 migrations,
`ddl-auto=validate`, the `test` profile). H2 in PostgreSQL mode does not model `timestamptz`
precision the same way, so the current test profile cannot settle this question. Adding the
dependency changes the CI contract — a decision for the integration batch.

---

## Classes

### KeysetCursorCodec

- **Responsibility:** encodes and decodes the opaque cursor for keyset pagination over the
  `(createdAt DESC, id DESC)` ordering.
- **Behaviours tested:**
  - The `encode → decode` round trip, nanosecond precision included
  - The wire format: `1|<Instant>|<UUID>`, URL-safe base64 without padding
  - That the `LocalDateTime` overload gives the same result as the UTC `Instant` overload
    and is the exact inverse of `Cursor.createdAtLocal()`
  - The seven rejection paths: null, empty, the 512-character limit, non-base64, wrong
    version, wrong number of parts, undecodable `Instant`/`UUID` — all 400
  - That the error message is the text the caller supplied
- **Deliberately not tested:** the cursor's effect on the database query — that is a Criteria
  predicate and belongs to the integration layer. Nanosecond/microsecond truncation (the open
  question above).
- **Mocks used:** none; the class has no dependencies.
- **Residual risk:** producing a cursor correctly and *applying* it correctly are separate
  things; the predicate and the page boundary belong to the integration layer.
- **Test count:** 23 (good: 6, bad: 17)

### AuditCursorCodec

- **Responsibility:** a thin delegate that binds the audit-specific error message onto the
  shared codec.
- **Behaviours tested:** that `encode`/`decode` are forwarded unchanged, that
  `"Invalid audit cursor"` is passed into `decode`, that an `ApiException` thrown by the
  delegate propagates unwrapped, and a round trip through the real codec.
- **Deliberately not tested:** the codec logic itself — that is in `KeysetCursorCodecTests`.
  The `encode(LocalDateTime, …)` overload is not exposed on this class.
- **Mocks used:** `KeysetCursorCodec` — mocking is the only way to verify that delegation
  actually happens; two tests go end to end with the real codec instead.
- **Residual risk:** negligible; the class is 5 lines.
- **Test count:** 5 (good: 3, bad: 2)

### RevertValues

- **Responsibility:** reads and compares the `before`/`after` values coming back from an
  audit entry's JSON column, insensitive to type.
- **Behaviours tested:**
  - `sameValue`: two nulls, one null, enum ↔ name, `Integer` ↔ `Long`, number ↔ text,
    ordered list equality, a change of order counting as a difference
  - `asString` / `asInteger` / `asBoolean` / `asEnum` / `asIds`: present, missing, wrong
    type, malformed value
  - Exceptions: `NumberFormatException`, `IllegalArgumentException` (`No enum constant`,
    `Invalid UUID string`)
- **Deliberately not tested:** real Jackson serialization — the input here is an already
  deserialized `Map`. Which handler reads which field is each handler's own business.
- **Mocks used:** none; a static helper class.
- **Residual risk:** two behaviours were deliberately pinned "as is" and may not actually be
  wanted: because number comparison goes through `longValue()`, `1` and `1.9` count as
  equal; `Boolean.valueOf` quietly turns `"yes"` into `false`. No recorded field is
  fractional today and no field writes `"yes"`, but a new field could change that.
- **Test count:** 37 (good: 20, bad: 17)

### AdminBootstrapPolicy

- **Responsibility:** resolves the configured `email` / `email:Name` list into the set of
  accounts to be made administrators at startup.
- **Behaviours tested:** empty configuration, entries with and without a name, several
  entries, case normalization, whitespace trimming, dropping empty entries, splitting on the
  first colon, an entry without an email, a duplicate email, immutability of the returned set.
- **Deliberately not tested:** `AdminBootstrapRunner` actually creating the account — a
  different class and an integration concern. The order of `bootstrapEmails()` is not tested
  because `Map.copyOf` does not preserve ordering; it is not part of the contract.
- **Mocks used:** none; a constructor with a single `String` parameter.
- **Residual risk:** the argument is **not** normalized — `shouldBootstrap` does an exact
  match, so an unnormalized address misses silently. The contract lives in the parameter name
  (`normalizedEmail`) and the caller, `AuthService`, lowercases; the test pins that. A `null`
  argument throws `NullPointerException` via `Map.copyOf` — pinned as the current behaviour,
  as agreed.
- **Test count:** 18 (good: 6, bad: 12)

### OtpService

- **Responsibility:** generates the one-time login code, stores it hashed, and consumes it
  exactly once.
- **Behaviours tested:** invalidation of outstanding codes before a new one is generated
  (`InOrder`), `expiresAt = now + ttl` (default and custom TTL, `Clock.fixed`), that the
  plaintext is not stored, that the correct code sets `used = true`, a wrong code, no
  candidate, a legacy plaintext match, a candidate with neither a hash nor a legacy value,
  and that only the matching one of several candidates is marked. Also that the time passed
  into the query comes from the injected clock.
- **Deliberately not tested:** `TokenGenerator`'s randomness (covered by
  `TokenGeneratorTests`) and Argon2 itself. **The real filtering at the TTL boundary is the
  repository query's job** (`…AndExpiresAtAfter…`), so only the written `expiresAt` and the
  instant handed to the query are verified here.
- **Mocks used:** `OneTimePasswordRepository` — to stay off the database and to compose the
  candidate list. `HashGenerator` is static and cannot be mocked; because Argon2
  (m=32768, t=3) is expensive, a real hash is computed only once per class and the other
  `consume` tests use the legacy plaintext branch.
- **Residual risk:** that expired and used codes really are filtered out belongs to the
  integration layer; at the unit level they are represented as "an empty candidate list".
  Pessimistic lock behaviour is not tested either.
- **Test count:** 13 (good: 9, bad: 4)

### RateLimitService

- **Responsibility:** limits code requests and login attempts by keeping a fixed-window
  bucket per operation and HMAC'd subject.
- **Behaviours tested:**
  - The subject hash: stability, email/IP namespace separation, 64 hex characters,
    `null` IP becoming `"unknown"`, `IllegalStateException` on an empty key
  - `validateConfiguration`: 31 / 32 / `null` key
  - `consume`: creating a bucket when none exists, incrementing below the limit, **the exact
    moment the bucket fills** (still successful), **the request after it fills**
    (`RateLimitException`, no record), reset in an expired window, a bucket whose window ends
    exactly now, success after two collisions, a rethrow on three collisions, no retry on a
    rejection, separate buckets for different subjects
  - `ensureAllowed`: no bucket / below the limit / at the limit / expired, that it never
    writes, and that the `Retry-After` value is at least 1 second
  - `reset`: that only that bucket is deleted
- **Deliberately not tested:** real `REQUIRES_NEW` transaction semantics and the unique
  constraint race — a mocked manager does not actually apply propagation. The limit values in
  `AuthService` are not read here either.
- **Mocks used:** `AuthRateLimitBucketRepository` (no database) and
  `PlatformTransactionManager`. The manager is mocked because the service builds the
  `TransactionTemplate` itself, which means the real template does run the callback.
- **Residual risk:** that two concurrent requests count the same bucket correctly can only be
  shown at the integration layer; the three-attempt retry loop here is simulated with mocks.
- **Test count:** 26 (good: 18, bad: 8)

### AuditRevertService

- **Responsibility:** decides whether an audit entry can be reverted and reverses a single
  field edit.
- **Behaviours tested:**
  - `describe`: an empty page, a clean field diff, a non-revertible action, a target type
    with no handler, the lifecycle key (`exists`), a change without `before`/`after`, empty
    `changes`, **a refusal entry with no target id** (an old 500 regression), an already
    reverted entry (plus the id of the reversing entry), outside the window, **exactly on the
    cutoff** (still revertible), one nanosecond past the cutoff, a vanished target, a changed
    value, a field the handler does not know
  - Batch behaviour: a **single** `currentValues` call for two entries of the same type; no
    query at all on a page with no candidates; one decision per entry on a mixed page
  - `revert`: applying the `before` values, `AuditRevertContext` being populated while the
    handler runs and empty afterwards, being cleared even if the handler blows up, 404, and
    409 + message + `reason.name()` code for each of the five refusals
  - Handler wiring: `IllegalStateException` for two handlers claiming the same target type,
    routing to the correct handler, and no handler at all
- **Deliberately not tested:** the handler implementations themselves (`UserRevertHandler`
  and friends) and the reversal reaching the database — separate classes, an integration
  concern. `@Transactional` semantics are absent here.
- **Mocks used:** `AuditLogRepository` (no database, and to compose the `findReversalsOf`
  rows) and `AuditRevertHandler` — mock handlers inside a real `List`, because the service
  builds the map itself with `Collectors.toMap`.
- **Residual risk:** the window enters the message through `Duration.toString()`, so `P7D`
  reaches the user as `PT168H`. The test pins that, but it is a product decision; if the
  panel wants readable text the message has to change.
- **Test count:** 30 (good: 8, bad: 22)

### LoginLocationService

- **Responsibility:** resolves the approximate location for an IP address and renders the map
  HTML embedded in the login notification email.
- **Behaviours tested:**
  - The resolved path: a full response, city only, an empty region (no double comma), and
    that **only the first address** in an X-Forwarded-For list is queried (verified by
    resolving the captured `UriBuilder` function against a real factory)
  - The paths that never touch the network: null/empty address, empty token
  - **Each failure separately:** 401, 403, 429, 5xx, timeout (`SocketTimeoutException`), DNS
    failure (`UnknownHostException`), an undeserializable body, a `null` body, a bogon
    address (all fields null), an unparseable `loc`
  - That each of those returns **exactly** `LoginLocation("Unknown", null, null)` and logs a
    WARN, while the empty-token path logs **nothing at all** during the request
  - `warnIfTokenMissing()`: a startup WARN containing the name `IPINFO_TOKEN` when the token
    is empty or whitespace only, and no log at all when it is set
  - `createStaticMap`: valid coordinates + key (`lonlat` order reversed), an empty Geoapify
    key, invalid coordinate formats (parameterized), empty output when there are no
    coordinates and no URL, HTML escaping
- **Deliberately not tested:** real IPinfo/Geoapify calls. The full text of the generated
  HTML — that would be brittle; distinguishing fragments are verified instead. **The provider
  fallback chain was not tested because there is none:** Geoapify only renders the static
  image, and the only fallback is `catch (Exception) → "Unknown"`.
- **Mocks used:** `RestClient` and three levels of its fluent chain
  (`RequestHeadersUriSpec`, `RequestHeadersSpec`, `ResponseSpec`) — to avoid real HTTP. To
  make that possible, `RestClient` is now injected through the constructor
  (`RestClientConfig`); behaviour did not change. Also Logback's `ListAppender`, because the
  difference between a silent failure and a logged one is this batch's main finding.
- **Residual risk:**
  - **The `IPINFO_TOKEN` warning only fires at startup.** If the token is revoked later, the
    only trace is the 401/403 WARNs; a per-request warning was deliberately not added (log
    noise on every login).
  - **The broad `catch (Exception)`** makes 401/403/429/timeout indistinguishable to the
    caller; the distinction lives only in the log. Suggested (not implemented): narrow the
    catch.
  - The coordinate regex rejects whitespace around the comma (`"49.0, 8.4"` is invalid).
    Harmless today because IPinfo returns no space, but it would silently drop the map if the
    provider's format changed.
- **Test count:** 39 (good: 10, bad: 29)

### CatalogueRevertHandler.LectureHandler / .ProfessorHandler

- **Responsibility:** reverts lecture and professor field edits, mutual assignments included.
  The only handler pair in `com.pse.audit.revert` that declares a *collection* field.
- **Behaviours tested:**
  - `LectureHandler.currentValues`: all seven fields (`professors` as a list of UUID
    strings), an **empty list** (not a missing key) for a lecture with no professors, a
    deleted lecture not appearing in the map, an empty target list
  - **BUG-3, in two deterministic halves:** with a `LinkedHashSet` fixture, that the handler
    produces an order the declared `Set` type does not define; and that `RevertValues.sameValue`
    counts the same two elements in reverse order as different (while they are equal as sets)
  - `LectureHandler.applyInverse`: resolving all seven fields — in particular mapping the
    record's `"professors"` key onto the request's `professorIds` field — and leaving the
    others `null` in a single-field `before` half
  - `ProfessorHandler`: four fields plus the `lectures` list, a deleted professor, an empty
    target list, full and partial `applyInverse`, and that it goes to **`updateProfessor`**
    rather than `updateLecture`
- **Deliberately not tested:** `ModerationCatalogService` itself (a separate class, the next
  batch). `lecture.getSemesterSeason().name()` and `getLectureType().name()` have no null
  guard, but both columns are `nullable = false`, so the state is unreachable from a
  persisted row — a test would assert over its own fixture. Real `HashSet` iteration order
  (rationale in BUG-3).
- **Mocks used:** `LectureRepository`, `ProfessorRepository` (to stay off the database and to
  compose the "no row" case) and `ModerationCatalogService` — `applyInverse` does not write
  the fields itself, it calls the method the panel calls, so what has to be verified is the
  delegation.
- **Residual risk:** BUG-3 is open. Real-world order varies per run because `Professor` has
  no `hashCode`, so the defect looks **flaky** in production: the same edit reverts once and
  gives `VALUE_CHANGED` the next time. This is the most likely reason a bug report could not
  be reproduced.
- **Test count:** 15 (good: 7, bad: 8) — LectureHandler 9, ProfessorHandler 6

### ReportStatusRevertHandler.CommentReportHandler / .AnswerReportHandler

- **Responsibility:** reverts a report's status change. Why it matters: `ACTION_TAKEN` hides
  the content the report is about, so a status given by mistake takes a post out of the app.
- **Behaviours tested:** for both handlers, that the single `status` field is mapped by name,
  that a deleted report does not appear in the map, an empty target list, the enum passed to
  `updateReportStatus`, and `null` being passed for a `before` half without a `status`. Both
  `applyInverse` tests also verify that the **other** service is never touched.
- **Deliberately not tested:** the status change actually hiding or restoring the content —
  `ModerationCommentService` / `ModerationAnswerReportService`'s job, an integration concern.
- **Mocks used:** `CommentReportRepository`, `AnswerReportRepository`,
  `ModerationCommentService`, `ModerationAnswerReportService`. All four together, because in
  a handler pair carrying this little logic the mistake worth catching is a copy-paste one: a
  handler wired to the wrong repository or the wrong service reverts the wrong report — or
  nothing at all.
- **Residual risk:** negligible; the two handlers are 30 lines together and both are at 100%.
- **Test count:** 10 (good: 6, bad: 4) — CommentReportHandler 6, AnswerReportHandler 4

### WarningRevertHandler

- **Responsibility:** reverts a correction to a warning's text. The **only** handler that
  runs its own query inside `applyInverse`: a warning is addressed as a sub-resource of the
  student it was issued to, so the owner has to be resolved first — and that makes it the
  only handler that can refuse.
- **Behaviours tested:** the single `message` field, a withdrawn warning not appearing in the
  map, an empty target list, the `updateWarning(principal, studentId, warningId, request)`
  argument order being built from the warning row (not from the audit entry — the owner is
  not one of the recorded fields), and refusing a missing warning with `ApiException` +
  `NOT_FOUND` + `"Warning not found"`.
- **Deliberately not tested:** a `warning.getStudent()` NPE. `Warning.student` is
  `@ManyToOne(optional = false)`, so a row with a null student cannot exist; a test would
  assert over an unreachable state.
- **Mocks used:** `WarningRepository` (for both `findAllById` and `findById`, the second of
  which only this handler has) and `ModerationUserService`.
- **Residual risk:** nothing holds a lock between the revertibility check and the revert
  itself, so the `NOT_FOUND` path is a real race: the check sees the row and says
  "revertible", and the row can be gone by the time the revert runs. The handler behaves
  correctly (refusing rather than crashing) but the user gets an error on an entry that looked
  revertible.
- **Test count:** 6 (good: 3, bad: 3)

### UserRevertHandler

- **Responsibility:** reverts student account field edits. The widest handler: six fields, and
  the only one that builds the value set it reports from **two tables** — the student row plus
  the administrator id list, because the role is not a column on the student.
- **Behaviours tested:**
  - All six fields; `role = ADMIN` for a student in the administrator id set and `STUDENT`
    for one that is not (both arms of the ternary, separately)
  - `biography == null → ""`: a normalization that carries weight, because the audit entry
    also records `""` — reporting `null` would make an untouched biography look changed and
    refuse the revert
  - **Skipping** a `UserStatus.DELETED` row: an anonymized account's recorded username and
    address are already gone, so it must read as a **vanished** target rather than a stale
    one; reporting it would suggest a revert that writes the anonymized values back as if
    they were real
  - An id that did not survive not appearing in the map
  - Characterization: the administrator id list being fetched before the loop, meaning it is
    queried **even for an empty id list**
  - `applyInverse`: all six fields, and the others staying `null` in a single-field `before`
    half
- **Deliberately not tested:** `ModerationUserService.updateStudent` itself — role demotion
  protection and validation belong there. The handler deliberately calls that path so the
  revert inherits the same protections.
- **Mocks used:** `StudentRepository`, `AdminRepository` (the role can only be derived from
  it) and `ModerationUserService`.
- **Residual risk:** this handler's `currentValues` and `applyInverse` were already driven end
  to end by `AdminApiIntegrationTests.aFieldEditIsRevertibleAndTheReversalIsItsOwnAuditEvent`;
  the unit tests' real contribution was only the `DELETED` and `ADMIN` branches (2 missed
  lines before the batch). So the value here is not coverage but writing down **why** the
  branches are the way they are.
- **Test count:** 9 (good: 4, bad: 5)

### SocialService (voteComment / voteAnswer)

- **Responsibility:** votes on a comment or an answer; a second vote by the same student has
  to update the existing row, because the table has a unique constraint on
  `(student, comment)`.
- **Behaviours tested:** that the vote table is never touched for a target that is not found;
  that the first vote builds the row with `student` + `comment`/`answer` + `vote`; that the
  second vote mutates and saves **the same instance** (`isSameAs`, no second row inserted);
  that the answer path does not touch the comment vote table. And, as characterization, the
  **four gaps**: no toggle-off, and a `null` `voteType` being saved with `success = true`
  (separately for each of the two methods).
- **Deliberately not tested:** `submitComment` / `submitAnswer` / the report methods and the
  notification path — the class's remaining 16 missed lines, a later batch. That the unique
  constraint really does prevent the second row is an integration concern; only *what the
  code hands to* `save` is verified here.
- **Mocks used:** only the four repositories the two methods touch (`CommentRepository`,
  `AnswerRepository`, `CommentVoteRepository`, `AnswerVoteRepository`). The constructor's
  other five dependencies (`LectureService`, the two report repositories,
  `NotificationRepository`, `AuditWriter`) are passed as **`null`** rather than mocks:
  putting mocks there would let a future edit start using these collaborators silently, while
  `null` turns that into an immediate NPE in the method's own test. `AuditWriter` being on
  that list is the finding itself.
- **Residual risk:** none of the four gaps was fixed — all are product decisions. The most
  serious is the missing audit: vote manipulation does not appear in the moderation trail at
  all. A `null` `voteType` surfaces as `DataIntegrityViolationException` → 409 "State
  conflict", so a client expecting 400 gets 409.
- **Test count:** 9 (good: 4, bad: 5)

### StudentService

- **Responsibility:** assembles profile information from an entity graph and soft-deletes the
  account.
- **Behaviours tested:**
  - `getUserInformation`: the credibility score being ups minus downs, the case that comes
    out to zero, the average score plus the rating/comment counts, a zero average with no
    ratings (rather than a division by zero), and the exact failure shape returned for a
    student that is not found
  - That the score counts **all** votes reaching the student who wrote the content,
    regardless of who cast them (pinned so that a future "don't count your own vote" change
    is a deliberate one)
  - `getUserRatings`: each rating being mapped to a `LectureResponse` plus the average score,
    the count embedded in the message (`"Success, found 2 ratings."`), `success = true` even
    for an empty list, and an **empty list** rather than `null` for a student that is not
    found
  - `deleteAccount`: a `null` principal; a principal whose email is not in the table (nothing
    is written); and on the happy path, `UserStatus.DELETED` being written and saved and the
    message containing the email
- **Deliberately not tested:** there are no direct tests for `softDeleteByKitEmail` and
  `getAverageRating` — every branch of both is exercised through `deleteAccount` /
  `getUserInformation`, and separate tests would only count the same lines twice.
  `ProfilePictureGenerator`, `LectureService.createLectureResponse` and
  `RatingService.calculateAverageScore` are **static** and are not mocked; `mockStatic` would
  mean a new dependency (mockito-inline) and a departure from the house style, and it is not
  needed — plain fixtures drive all three.
- **Mocks used:** only `StudentRepository`; the class's single dependency.
- **Residual risk:**
  - **No path throws.** Every failure is a response carrying `success = false` and HTTP 200.
    So a caller that only looks at thrown errors mistakes a broken lookup for a successful
    one. The tests pin this contract, but the contract itself is debatable.
  - `getUserInformation` calls `student.setCredibilityScore(...)` inside a
    `readOnly = true` transaction. Harmless at the unit level; what dirty checking does in a
    real persistence context is an integration question.
  - Typos in the message strings (`couldnt`, `succesfully`) were going out to the client;
    the three in `deleteAccount` were fixed in `edaf2bc` and the remaining five in `src/main`
    in `57658c3`, with the tests that pin them updated alongside (F-10 closed).
- **Test count:** 12 (good: 6, bad: 6)

### AccountService

- **Responsibility:** a thin facade over `StudentService` with exactly one piece of logic of
  its own: revoking the tokens issued to an account when it is deleted.
- **Behaviours tested:** the two read paths delegating unchanged with `student.getId()`; that
  `invalidateAllAuthTokensForEmail` is called on a **successful** deletion and **not** called
  on a failed one; and `requestLogout` embedding the returned session count in the message
  (three sessions and zero sessions).
- **Deliberately not tested:** `AuthService.invalidateAllAuthTokensForEmail` actually revoking
  the tokens — `AuthService`'s job. That a deleted account's token can no longer make requests
  is an integration concern (`TokenAuthenticationService` rejects `DELETED`).
- **Mocks used:** `AuthService` and `StudentService`. `StudentService` is mocked because what
  is under examination is not the deletion itself but whether token revocation happens
  **based on its outcome**.
- **Residual risk:** without the `success` condition the account would go `DELETED` while
  every token stayed valid until it expired, and a student token lives for a year — which is
  why the failed-deletion branch is the single most valuable test in this batch. The class
  throws an NPE on `getId()`/`getKitEmail()` if `student` arrives as `null`; not tested,
  because the principal is supplied by the security chain.
- **Test count:** 6 (good: 4, bad: 2)

### BugReportRevertHandler

- **Responsibility:** reverts an administrator's edit to a bug report — status, severity and
  the fields the moderation panel can change on one.
- **Behaviours tested:** the declared target type; `currentValues` mapping every field the
  handler can revert; an id with **no surviving row** being absent from the map rather than
  mapped to `null`; an empty target list; `applyInverse` replaying the recorded values through
  `ModerationBugReportService`; and a `before` half carrying one field leaving the others
  `null`.
- **Deliberately not tested:** `ModerationBugReportService.update` itself, and the GitLab issue
  the report may be linked to — `RestClientGitLabClient` is a separate class and is not covered
  at all (see *Deliberately uncovered*).
- **Mocks used:** `BugReportRepository` and `ModerationBugReportService`. The service is mocked
  rather than stubbed because what has to be verified is the delegation: the handler does not
  write the fields itself, it calls the same path the panel calls, so the revert inherits that
  path's validation.
- **Residual risk:** the same check/apply race as `WarningRevertHandler` (F-11) applies in
  principle — nothing holds a lock between the revertibility check and the revert — but this
  handler does not re-query inside `applyInverse`, so it cannot refuse; it would replay onto
  whatever the row has become.
- **Test count:** 6

### ContentRevertHandler.CommentHandler / .AnswerHandler

- **Responsibility:** reverts a moderator's edit to a comment or an answer: the content text
  and the `ContentStatus`. Why it matters: status is what hides a post from students, so a
  status set by mistake removes content from the app until it is reverted.
- **Behaviours tested:** for both handlers, the declared target type, `content` and `status`
  mapped by name, a deleted row being absent from the map, `applyInverse` replaying both
  fields through `ModerationContentService`, and — on the comment side — a `before` half
  carrying only `status` leaving `content` `null`.
- **Deliberately not tested:** that the status change actually hides or restores the content;
  that is `ModerationContentService`'s job and an integration concern. The two handlers live in
  one class because they share the field mapping, and the tests keep them apart the way the
  class does.
- **Mocks used:** `CommentRepository`, `AnswerRepository` and `ModerationContentService` — all
  three together, because in a handler pair this thin the mistake worth catching is a
  copy-paste one: a handler wired to the wrong repository reverts the wrong row.
- **Residual risk:** negligible at the unit level; both handlers are at 100% LINE and BRANCH.
  `ModerationContentService` itself is the class carrying the risk, and it still has 23 missed
  lines and 29 missed branches.
- **Test count:** 9 — CommentHandler 5, AnswerHandler 4

### ApiAuthorizationMatrixTests

- **Responsibility:** the anonymous boundary across the whole published surface, plus the
  `authenticated()` tier, which had no role coverage before this batch.
- **Behaviours tested:** every mapped route either refusing an anonymous caller with 401 or
  being declared public; the declared public routes staying reachable; an anonymous caller
  never being able to provoke a 403 (which would mean the entry point is being bypassed); bug
  submission without a header answering 401 rather than 500; the legacy professor create
  refusing a student with 403; a student session reaching the endpoints the app needs; and
  that no handler relies on `@PreAuthorize` and friends, which are **inert** here because the
  application has no `@EnableMethodSecurity`.
- **Deliberately not tested:** the admin tier by role — that is `AdminApiPathSplitTests`, which
  mints its sessions through the real login endpoints because the older helper writes tokens
  with no session type and would stay green with the admin path broken.
- **Mocks used:** none. A real context, a real security chain, a real database; only mail
  delivery and the GitLab client are substituted.
- **Residual risk:** the sweep proves a route *refuses* an anonymous caller, not that the rule
  behind the refusal is the right one. A route locked to admins that should be open to students
  passes this test and fails nobody until a user complains.
- **Test count:** 6

### ApiProtocolContractTests

- **Responsibility:** the status codes the API answers with, swept across the surface rather
  than asserted one endpoint at a time.
- **Behaviours tested:** every body-reading route answering an unreadable media type with the
  declared status (415 since F-17 was fixed) and carrying the project's `BasicResponse` body
  rather than a `ProblemDetail`; malformed JSON in the *right* media type still being a clean
  400; a path called with a verb it does not map answering the pinned status, with the project
  error body.
- **Deliberately not tested:** the `Allow` header a correct 405 would carry — there is no 405
  to carry it yet (F-16). When that changes, `WRONG_VERB_STATUS` becomes 405 and
  `wrongVerbCarriesTheProjectErrorBody` gains the header assertion; the constant's javadoc says
  so.
- **Mocks used:** none, as above.
- **Residual risk:** F-16 stays wrong on all 122 routes by decision, not by omission. The
  pinned constant is what keeps that decision visible instead of letting it read as an
  oversight.
- **Test count:** 5

### ApiOwnershipMatrixTests

- **Responsibility:** horizontal authorization — whether an authenticated caller can reach a
  row belonging to another student.
- **Behaviours tested:** the classification ratchet over all 61 id-taking routes; the
  cross-user probe on the one owner-scoped route, asserted on the **row** rather than the
  status; the owner's own call still working; `/ratings/own` being scoped by the principal
  rather than the path; the notification list not leaking another student's rows; the
  administrative routes refusing a student who carries a **real** victim id; and the structural
  invariant that no app-tier handler takes a caller identity from the request.
- **Deliberately not tested:** the admin tier by role, again `AdminApiPathSplitTests`. The vote
  routes are classified cross-user *by design* and are not probed for refusal, because
  refusing there would be the defect.
- **Mocks used:** none.
- **Residual risk:** the ratchet forces a new id-taking route to be classified, but nothing
  forces the classification to be **honest** — an owner-scoped route dropped into
  `NOT_OWNED_BY_A_USER` would pass. The invariant test is the backstop, and it is the one to
  keep working if the sets ever have to be trimmed.
- **Test count:** 7
