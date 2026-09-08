# Test plan

Layers: **unit → API/role → integration → E2E**. Every batch adds its own section. The unit
layer is covered by batches 1–6, the API/role layer by the authorization, protocol and
ownership sweeps below, and the integration layer by the PostgreSQL section further down. Only
E2E has not been started. What was recorded as blocking the integration layer — the
Testcontainers question — turned out not to be a blocker at all; see
[Settled questions](#settled-questions).

### Where it stands

**802 tests, 0 failures**, 21 skipped locally (the `@Disabled` `DemoApplicationTests` and the
twenty PostgreSQL tests, which run in CI). Bundle **95.52% LINE** (3280/3434),
**89.33% BRANCH** (1046/1171). Line coverage is gated in two tiers — **90% mandatory,
95% target** — and BRANCH has a single floor at 0.87.

> Those are `./mvnw clean verify` numbers, and the `clean` is not decoration. JaCoCo's
> `prepare-agent` appends by default, so `target/jacoco.exec` accumulates across runs and a
> `verify` following a targeted `-Dtest=` run reports coverage the suite did not earn on its
> own. The figures previously recorded here — 95.78% / 89.50% — were measured that way. See
> [P-5](test-findings.md#p-5--coverage-measured-without-clean-is-not-the-coverage-ci-measures).

Line coverage has been above its target since batch 5, so `coverage:line-target` is green
rather than yellow; batch 6 raised the target itself from 94 to 95 rather than banking the
slack.

**[test-findings.md](test-findings.md) has no open entry.** The twelve that were still open
after batch 6 were closed in one pass — eleven fixed, one (P-3) closed by a recorded decision.
Three of them changed a client-visible contract, so they are named here rather than only in the
findings document: **F-5** (app-tier failures answer 4xx instead of 200), **F-16** (a path
called with a verb it does not map answers 405 with an `Allow` header instead of 404), and
**F-3** (`VoteType.NONE` withdraws a vote). This is what the batches were for; closing them is
not a batch of its own and gets no section below, only updated statuses.

| Layer | State |
|---|---|
| Unit | Batches 1–6 done. |
| API / role | The three sweeps below. |
| Findings | **All closed.** |
| Integration | **Done for the three questions H2 cannot answer.** Five classes, 20 tests, one shared context against a real PostgreSQL in CI. |
| E2E | **Not started.** |

The integration layer runs in `server:postgres-integration`, against a `postgres:16` GitLab CI
service with the production Flyway migrations. Its tests skip themselves when
`POSTGRES_SMOKE_JDBC_URL` is unset, so `./mvnw verify` on a developer machine is unchanged and
still needs no Docker. Its first result was ruling out the BUG-1 timestamp hypothesis — see
[Settled questions](#settled-questions); what it covers now is
[The integration layer](#the-integration-layer).

The spread between LINE and BRANCH was 15 points before batch 4, 9.7 after it, 8.9 after batch
5, and is **6.2** after batch 6. 125 branches and 154 lines are left in the whole module. The
largest remaining branch gaps are `ModerationUserService` (27), `SocialService` (13),
`ModerationContentService` (12) and `AuditLogService` (11) — and a growing share of what is
left is not unit-testable at all: Criteria predicates, specification lambdas, and the two mail
classes under *Deliberately uncovered*. See the note at the end of the batch 6 section.

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

To keep them apart: these numbers measure different things; this is not an inconsistency.

- **The mandatory line floor, 90%.** Enforced twice on purpose, and the two have to be
  moved together: `jacoco:check` in the pom (`LINE 0.90`) catches it on a local
  `mvnw verify`, and `COVERAGE_LINE_MIN` in `.gitlab-ci.yml` catches it in the pipeline.
  Below it the build is red.
- **The line target, 95%** (`COVERAGE_LINE_TARGET`). Missing it is a **warning, not a
  failure**: `scripts/CheckLineCoverage.java` prints it inside `server:test`, and the
  `coverage:line-target` job — `allow_failure: true` — turns the same condition into a
  visible yellow mark on the pipeline while letting it pass. It is where the suite is
  trying to be, not a gate.
- **The BRANCH floor, `0.87`,** in the pom only. A floor, not a target: without it a
  heavily branched method can arrive with one happy-path test and pull branch coverage down
  without failing anything. Batch 4 was chosen by this counter rather than by LINE, because
  every class it touched was already above 82% LINE and a line target would never have
  picked them.
- **`scripts/CheckChangedCoverage.java --threshold 30`** — the MR gate, which looks only
  at the coverage of *changed* code. Unrelated to the bundle: a change can be fully covered
  and still drop the bundle, and the bundle can sit above its floor while a new file arrives
  untested.

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

## Batch 4 — the moderation services

Target: the branch gap. Three classes held 128 of the module's missed branches between them,
and unlike the earlier batches this one was chosen by the BRANCH counter rather than by LINE —
all three were already above 82% LINE and would never have been picked by a line-coverage
target.

| Class | LINE missed | BRANCH missed | Tests |
|---|---|---|---|
| `ModerationCatalogService` | 30 → **0** | 48 → **8** | 29 |
| `ModerationUserService` | 26 → **13** | 51 → **27** | 49 |
| `ModerationContentService` | 23 → **17** | 29 → **12** | 29 |

**107 tests in total.** Bundle: 92.56% → **94.02% LINE**, 77.09% → **84.20% BRANCH**. Seven
points of branch coverage from three classes, which is what "the gap is concentrated" meant.

### What the tests are organised around

All three classes have the same shape — validate, walk the request field by field, record a
change only where the value actually differs, and write nothing at all when nothing did. That
last property gets the most tests, and deliberately: a method that saves and writes an audit
entry for an edit that changed nothing fills the moderation trail with events nobody
performed. There are now tests for a resubmitted name, year, season, type, active flag,
professor assignment, username, biography, credibility score, content and status.

The second theme is the **protection matrix** in `updateStudent`. Three guards overlap on
every field — is the target an administrator, is the target the caller, is the target the
elevated operator — and the answers differ per field: a status change refuses self, a role
change refuses self, an address change refuses neither but refuses an elevated target
outright, for everybody including an elevated caller. Driving that through `MockMvc` means
minting a different session per case; at the unit level it is a boolean, which is the whole
argument for testing this class here rather than through the API.

### BUG-3's write side, closed

The deterministic write-side test that batch 2 deferred to this batch now exists.
`updateLecture` builds `before` from a `Set` — which defines no order — and `after` from
whatever order `findAllById` returns, then compares them position by position, so an
unchanged assignment records a bogus change and a bogus audit event. The test states that with
a `LinkedHashSet` and a stubbed repository order rather than relying on real `HashSet`
iteration: `Professor` overrides neither `equals` nor `hashCode`, so real order varies per run
and the flakiness would end up in the test instead of in the defect.

The finding stayed open through batch 6 as a product decision about `RevertValues`'s contract,
and is **fixed** now: both sides compare as multisets. The two deterministic tests were
inverted rather than deleted, which is what that way of writing them bought — neither depends
on real `HashSet` order, so they state the fixed behaviour exactly as reliably as they stated
the broken one.

### The gates moved

`jacoco:check` went BRANCH `0.73` → **`0.82`**, following the rule the batch 2 writeup set:
about one and a half points below what is measured, so the gate stops a regression without
breaking an unrelated MR.

LINE was raised to `0.92` in this batch and then **settled at `0.90`** when the two-tier CI
check landed: 90% became the mandatory floor and 94% the advisory target, so the number that
used to do both jobs was split into the two it was actually doing. See *Three different
coverage numbers* above. Verified green at both values.


## Batch 5 — the GitLab adapter, and a duplicate deleted

Target: the one entry in *Deliberately uncovered* that had to be written down as **debt**.
`RestClientGitLabClient` was at 23.1% LINE and 4 of 22 branches — the largest single branch gap
left outside the moderation services, and the only untested adapter whose absence had no
principled reason behind it.

| Class | LINE missed | BRANCH missed | Tests |
|---|---|---|---|
| `RestClientGitLabClient` | 30 → **0** | 18 → **0** | 25 |

Bundle: 93.97% → **94.86% LINE**, 84.27% → **86.01% BRANCH**. The line target (94%) is cleared
for the first time, so `coverage:line-target` stops warning.

### How the HTTP conversation is driven

Not by mocking the fluent `RestClient` chain, which is what `LoginLocationServiceTests` does.
That chain is three calls deep; this one is six (`post().uri().header().contentType().body()
.retrieve().body()`), and a mock of it pins the *shape of the call* rather than its result —
every future edit to the request would break the test whether or not the behaviour changed.

`MockRestServiceServer.bindTo(RestClient.Builder)` is used instead: real status codes, real
error types, no network. The failure arms close by themselves because the client library throws
what it really throws, and the assertions are about the request that went out and the answer
that came back rather than about which builder methods were called.

**This required a seam.** The class assembled its own `RestClient` in the constructor, so
nothing could be injected. A second, package-private constructor was added — the public
`@Value` one delegates to it — and the test lives in the mirror package to reach it. The
production wiring is unchanged; `RestClientConfig`'s javadoc already records why a
`RestClient.Builder` cannot simply be injected here (`spring-boot-restclient` is not on the
classpath, so Boot auto-configures no builder).

### What it found

Two defects, both fixed, both written up in
[test-findings.md](test-findings.md#f-18--the-project-id-reaches-gitlab-encoded-twice):

- **F-18** — the project id was encoded by hand *and* by the URI template, so a path-shaped id
  (`group/project`) reached GitLab as `group%252Fproject` and every issue creation answered 502.
  Found by writing down the request that ought to go out, not by chasing a report.
- The seam itself broke the container: two constructors with neither marked meant Spring looked
  for a default constructor and no `@SpringBootTest` could start. The unit tests stayed green
  the whole time — the API sweeps and the context tests are what caught it. `@Autowired` on the
  public constructor closes it.

### The token, which is the point of the class

Three of the 25 tests exist for one property: the credential never leaves the backend. The
header carries it; the log line carries the exception **class name** and nothing else; the
message the administrator receives says "Could not reach GitLab" whatever went wrong. The
failure test hands the client an exception whose own message contains the token, then asserts
that neither the log nor the `ApiException` repeats it. A future edit turning `{}` into
`exception.getMessage()` — an entirely reasonable-looking change — now fails a test instead of
writing a credential into the logs.

The cost is pinned too: a revoked token and an unreachable tracker are **indistinguishable** to
the caller, both 502. That is characterization, not endorsement.

### Also in this batch

The two duplicate test classes in `com.pse.user` were deleted (P-4 in the findings). The bundle
did not move by a single line, which is the proof that they were duplication rather than
coverage.

### The gates moved

`jacoco:check` went BRANCH `0.82` → **`0.84`**, following the same rule as batch 2 and batch 4:
about one and a half points below what is measured. LINE stays at `0.90` — it is the mandatory
floor of the two-tier arrangement, and the 94% target lives in CI, not in the pom.

Verified the same way as before: with BRANCH temporarily at `0.90`, `./mvnw verify` went red
with "branches covered ratio is 0.86, but expected minimum is 0.90", and green at `0.84`.


## Batch 6 — the security path and the bug-report path

The first batch chosen by **neither** counter. Measured at method level, the worst single
uncovered method left was 7 branches: the concentration batch 4 exploited is gone, and "take
the biggest number" would have led straight to `ModerationUserService`'s Criteria predicates —
which this document already assigns to the integration layer.

So the four targets were picked by what a missed branch there would actually cost. Three of
them had **no direct test at all**: `TokenAuthenticationService` appeared in the suite only as
a mock inside `AuthServiceTests`, and `ModerationBugReportService` was driven exclusively
through `AdminApiIntegrationTests`.

| Class | LINE missed | BRANCH missed | Tests |
|---|---|---|---|
| `TokenAuthenticationService` | 6 → **0** | 6 → **0** | 24 |
| `AccessRefusalAuditor` | 3 → **0** | 2 → **0** | 5 |
| `ModerationBugReportService` | 3 → **0** | 15 → **0** | 32 |
| `AuthService` | 8 → **0** | 14 → **0** | 16 (added to 13 existing) |

Bundle: 94.86% → **95.45% LINE**, 86.01% → **89.23% BRANCH**. 79 tests, and all four classes
are now at zero on both counters.

### Why the token gate was worth 24 tests

Every uncovered branch in `TokenAuthenticationService.authenticate` was a **refusal**. Nothing
in the suite said that a token should be turned down — only that a good one gets through.

That is the wrong way round for this class. A missed refusal here is not a wrong status code;
it is a session that keeps working after the account behind it was blocked or deleted, for as
long as the token lives, and a student token lives for a year. The class enforces the status on
every request precisely so that a path which changes it without revoking sessions cannot leave
one alive, and that intent is written in a comment. It has a test now.

The other properties pinned there: the repository is queried with the **SHA-256 hash** and
never with the plaintext; an `APP` session never even asks whether the account is an
administrator, so the tier is a property of the session rather than of the person; a legacy
plaintext token is upgraded in place and the plaintext cleared; and a refused request does not
count as activity. The "last seen" write is tested on the boundary of its five-minute window
with a fixed clock, in both directions.

One characterization worth flagging: a token with **no session type** — the shape the older
test helper mints, and the reason `AdminApiPathSplitTests` exists — is treated as neither `APP`
nor `ADMIN`. It picks up the admin row if there is one, and a missing one is not a refusal.

### The bug-report path, and P-2 again

`ModerationBugReportService` was at 3 missed lines and 15 missed branches — the clearest live
example of [P-2](test-findings.md#p-2--integration-tests-hide-unit-targets) left in the module.
`sendBugReport` refuses through a single six-armed condition, so one valid submission in an
integration test covers the whole disjunction with one arm while five different ways of
silently dropping a student's report stay untested. Each arm is its own case now.

`updateBugReport` got the treatment batch 4 gave the other three moderation services: every
field resubmitted unchanged must record nothing, save nothing and write no audit entry. Plus
both text bounds at and past the limit, and the `createIssue` arm that decides a missing report
is **not** a failed attempt and must not be marked as one.

### What it did not find

**No defect.** Every behaviour matched what the code's own comments said it should do, which is
worth recording rather than leaving implicit: after F-18 in batch 5, the reasonable expectation
was another one here. Two observations were pinned as characterization instead — the untyped
session above, and `AuthService.validate`, whose `student == null` arm is reachable only
through a well-formed header carrying a token nobody holds, because a malformed header throws
out of `verifyUser` before that line.

### The gates moved

`jacoco:check` went BRANCH `0.84` → **`0.87`**, and `COVERAGE_LINE_TARGET` in CI went
`94` → **`95`**. The pom's LINE floor stays at `0.90`: it is the mandatory tier, and the point
of splitting the two was that only one of them has to be conservative. Verified as before —
with BRANCH temporarily at `0.92`, `verify` went red with "branches covered ratio is 0.89, but
expected minimum is 0.92", and green at `0.87`.

### Where the unit layer stops

124 branches and 154 lines are left in the module, and the composition has changed: 46 lines
are `MailService` and 12 are `MailTemplateService`, both decisions recorded under
*Deliberately uncovered*; a large share of the rest is Criteria predicates and specification
lambdas, which build a query rather than compute an answer. Chasing those with mocks would
assert the shape of a query nobody runs.

In other words the coverage number is now a poor proxy for what is untested. The places in
this document that defer something to the integration layer are the real remaining gap, and
they are the integration layer's backlog. There were 16 of them when this was written; F-9
is no longer one, because it was closed by removing the write rather than by testing it. They
are no longer blocked either — see [Settled questions](#settled-questions).


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

The same idea applied to status codes rather than to authorization. It found F-14 through
F-17, and **all four are fixed** — three of them after the batch, in the pass that closed the
findings document:

- **F-16** — a path that exists, called with a verb it does not map, answered **404 instead of
  405**, on all 122 routes. It was pinned rather than fixed here, as a contract change with two
  documented dependents. Both turned out to be documentation *of* the defect rather than uses
  of it, so it was fixed: 405 with an `Allow` header naming the verbs that do map.
- **F-17** — a body in a media type no converter can read answered **500 instead of 415** on
  all 37 body-reading routes. **Fixed** with one narrow `@ExceptionHandler`; the writeup in the
  findings document records why extending `ResponseEntityExceptionHandler` was the wrong fix
  and what the red run proved before the pin was flipped.
- **F-14, F-15** — a missing required query parameter and the category list of an unknown
  lecture both answered 500. **Fixed**: 400 and 404.

The two statuses live in `com.pse.support.ApiContract` rather than in the sweep, because
`AdminApiPathSplitTests` asserts one of them incidentally. Both hold the right answer now, and
the constant earned itself: flipping `WRONG_VERB_STATUS` from 404 to 405 carried 93 refusals
across two suites with no other edit, which is what the batch claimed it would do.

`PUBLIC_ROUTES_ANSWERING_SERVER_ERROR` — the two-entry exemption list F-14 and F-15 lived on —
is empty and gone with them. A public route answering 5xx is a plain failure again.

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

## The contract layer

A fourth question, after "does the code work", "who may call it" and "what status does it
answer": **does the API describe itself correctly?** The schema is generated by springdoc
from the controllers, so it cannot drift the way a hand-written one does — but it can be
incomplete, or wrong about a field, in ways nobody notices until a generated client breaks.

| Test class | Question it asks | Tests |
|---|---|---|
| `OpenApiContractTests` | Does the schema cover exactly the routes the application maps? | 3 |
| `OpenApiResponseValidationTests` | Do the response bodies match what the schema says about them? | 1 (a sweep) |

Both read the truth from the running application rather than from a checked-in file: the
schema is fetched over `/v3/api-docs` in the test itself, so there is no generation step to
forget and no copy to go stale. Route coverage is checked in **both** directions — a missing
entry shortchanges a generated client, an extra one sends it at a 404 it was told to expect
a body from — and both came back clean.

### What adding it turned up

**The schema was published anonymously.** springdoc registers `/v3/api-docs` in its own
package, and the authorization sweep filtered handlers to `com.pse` — so a 65 KB description
of every route and request body, the administrative surface included, was served to anyone,
and no test could see it. It is admin-tier now, and the sweep no longer has the blind spot:
`everyRouteADependencyRegisteredIsEitherDeclaredPublicOrRefusesAnonymousCallers` requires a
route from outside the project to refuse anonymous callers or be named in
`PUBLIC_THIRD_PARTY_ROUTES`. That test immediately found two more: `/v3/api-docs.yaml`, which
the first matcher did not cover because a matcher for one path is not a matcher for another
that looks similar, and `/error`, which is declared — the container dispatches to it to render
an error, so requiring a token there would mean an anonymous failure could not be told what
went wrong.

**Six response fields the schema was wrong about.** Every paging cursor plus
`database.error`, `counts` and `lastWrite` are `null` by design and documented as such in
their own javadocs, and the schema declared all of them non-nullable. A client generated from
it would have typed them as required and broken on the ordinary case. Four are fixed with
`@Schema(nullable = true)`; the two that are `$ref` properties cannot be — springdoc emits
`{"type":"null","$ref":…}` for those, which claims the value can only ever be null, so
neither form is right. The one the sweep actually observes, `lastWrite`, is named in
`KNOWN_SCHEMA_GAPS` rather than hidden by skipping the endpoint. `counts` has the same defect
and is deliberately **not** listed: this fixture keeps the database up, so `counts` is an
object and matches, and listing it would claim an observation the sweep does not make.

### A note on how these two classes are written

Both were rewritten once, and the reason is worth more than the diff. The first version
recovered the failing field by letting the MockMvc matcher throw and running a regular
expression over the exception's rendered message; and it walked the schema document by
casting nested `Map<String, Object>`. Both were rebuilding, less safely, something already on
the classpath: the validator hands the same information over as a typed `ValidationReport`,
and swagger-parser — which arrives transitively under that same validator — parses the
document into `OpenAPI`/`PathItem` and was sitting unused. Parsing a library's *error text*
is the loudest available signal that its real API went unread.

The rewrite paid for itself immediately: with the typed report the sweep became precise
enough to show that `KNOWN_SCHEMA_GAPS` was over-declared, naming a mismatch that no longer
occurred. An exemption list that names more than it observes passes for the same reason a
hand-maintained route list does — by looking at less than it thinks.

## The integration layer

Five classes, twenty tests, against a real PostgreSQL 16 with the production Flyway migrations.
They exist for the questions H2 cannot answer, and for nothing else: an assertion that H2 can
settle belongs in a faster job.

**One context, and it is load-bearing.** `PostgresTestDatabase` drops and recreates the
`public` schema when it initialises, so two Spring contexts using it would wipe each other
mid-run. Every class therefore carries `@PostgresIntegrationTest` — a composed annotation
holding the four annotations that used to be copied by hand — and Spring's context cache hands
them one context between them. That is also what keeps the job cheap: twenty tests cost about
seven seconds on top of one application start, not five starts. The `server:postgres-integration`
job greps its own log afterwards and **fails unless exactly one context started**, because a
fork is otherwise invisible: it looks like unrelated flakiness in whichever class ran second.

### What each class is for

| Class | The question only a real server answers |
|---|---|
| `PostgreSqlMigrationSmokeTests` | Do the production migrations produce a schema the application starts against? |
| `AuditTimestampPrecisionPostgresTests` | What does `timestamp(6)` do with the nanoseconds `Instant.now()` carries — truncate or round? |
| `CursorPaginationPostgresTests` | Do the four keyset predicates page correctly against that column? |
| `AuditJsonbRoundTripPostgresTests` | Does `jsonb` — the one place the two schemas differ — hand back what the revert feature put in it? |
| `ReadOnlyTransactionSweepPostgresTests` | Does any readable route write inside a transaction the server has marked read-only? |

### The cursor, applied

`KeysetCursorCodec` was tested to 100% at the unit layer, and its entry under
[Classes](#keysetcursorcodec) recorded what that could not reach: "producing a cursor correctly
and *applying* it correctly are separate things; the predicate and the page boundary belong to
the integration layer." Four endpoints paginate by keyset, over two different column types:

| Route | Cursor column | Shapes |
|---|---|---|
| `GET /admin/activity-logs` | `Instant` | one |
| `GET /admin/audit-logs` | `Instant` | one |
| `GET /admin/ratings` | `LocalDateTime` via `Cursor.createdAtLocal()` | one |
| `GET /admin/users` | `LocalDateTime` | **two** — `sort=newest` and `sort=oldest` mirror every comparison |

Each is paged from end to end with `limit=1`, and the sequence of ids served is compared to the
ordering the database itself produces, **element for element**. That is deliberate, and it is
the part worth copying: "no row is served twice" is also satisfied by a walk that silently
drops rows, and a dropped row is the same defect wearing the other face. One assertion covers a
repeat, a skip and a wrong boundary.

Every route is tested twice: once with distinct timestamps, and once with **every row forced
into the same microsecond**. The second is the point. The tiebreaker branch — `createdAt =
cursor AND id < cursor.id` — is unreachable while timestamps differ, and it is the branch that
decides whether a page boundary repeats or skips. It is also the exact shape BUG-1 describes.
`@CreationTimestamp` overwrites whatever an entity carries, so students and ratings are stamped
afterwards through `JdbcTemplate`; `AuditLog.@PrePersist` only fills a null, so those rows are
stamped before the insert.

**The sweep was checked against a defect it was meant to find**, rather than trusted because it
was green: changing `lessThan` to `lessThanOrEqualTo` in `AuditLogService`'s cursor predicate —
the classic off-by-one that serves the boundary row again — turned exactly the four audit tests
red, with `the cursor is not advancing past a row`. Without that check a green pagination sweep
says very little, because the same green comes from a sweep that never paged.

Result: **BUG-1 does not reproduce on any of the four endpoints**, in either direction, with or
without a shared microsecond. Recorded as a negative result in
[test-findings.md](test-findings.md#the-cursor-endpoints-page-correctly-against-postgresql).

### The `jsonb` round trip

The H2 baseline and the PostgreSQL baseline are the same file except for two lines:
`audit_logs.changes` and `audit_logs.metadata` are `json` on H2 and `jsonb` on PostgreSQL.
`json` stores the document as text and returns it byte for byte; `jsonb` parses it into a binary
form that reorders keys, collapses duplicates and normalises numbers. Every revert handler reads
its `before` values back out of `changes`, so the whole revert feature rests on that round trip
— and the H2 suite, on the other column type, cannot vouch for it.

Three tests. The first asserts the column really is `jsonb` in this database, because without it
the other two would still pass while quietly testing the H2 shape. The second round-trips nested
objects, arrays, nulls, an empty object, non-ASCII text and a quote inside a key — and then
re-reads two of the values through PostgreSQL's own `->>` operator, so the assertion cannot be
satisfied by a value that never left the JVM. The third reverts a lecture rename end to end and
asserts the *name is restored*, not merely that the JSON survived.

Nothing was lost in the round trip, including the integer and boolean values `RevertValues`
already treats as representation-insensitive.

### The read-only sweep

F-9 was a write inside a `@Transactional(readOnly = true)` method, and the findings record why a
unit test could not settle it: dirty checking is Hibernate's business, not a mock's. It was
fixed by removing the write, which left the general question open — there are 27 such methods
and one of them had ever been looked at.

PostgreSQL is what makes it answerable: it marks the transaction read-only on the server, so a
write that reaches one fails with `cannot execute UPDATE in a read-only transaction`, arriving
here as a 500. The sweep reads every GET from `RequestMappingHandlerMapping` — never a
hand-kept list — fills path variables from a fixture by placeholder name, and drives all of
them with an administrator session.

It asserts three things, and the second two are what stop it being decoration:

1. No route answers 5xx.
2. The routes that answer something other than 2xx are **exactly** one documented entry
   (`GET /data/professor/id`, which needs two query parameters this sweep does not send).
   Without this, every route could be answering 400 and rule 1 would still be green.
3. At least 47 routes actually entered a read transaction and answered from it.

Result: **no second F-9.** All 47 readable routes came back clean.

### Reused rather than rewritten

`ApiAuthorizationMatrixTests`, `ApiOwnershipMatrixTests` and `ApiProtocolContractTests` each held
a private copy of the same `handlerMapping.getHandlerMethods()` walk, and the read-only sweep
would have been the fourth. It is now `com.pse.support.MappedRoutes`, and all four use it. The
one thing the three copies disagreed about — what a mapping that declares no verb means — is
reported rather than decided: such a route arrives with a `null` verb and every call site states
its own reading. The three sweeps ran 7/7/6 before the extraction and 7/7/6 after.

## Deliberately uncovered

Two classes are visibly low and neither is an oversight. Saying so here is the point: an
unexplained 0% reads as neglect, and the next person re-derives the reason or, worse, writes a
test that pins an adapter's plumbing. The table had a third row until batch 5 —
`RestClientGitLabClient`, described there as debt rather than as a decision. It is covered now,
and the row is gone rather than reworded, which is the only honest way to keep this list
readable: everything still in it is a decision.

| Class | LINE | Why |
|---|---|---|
| `MailService` | **0.0%** (0/46) | An SMTP adapter behind `LoginCodeDelivery` / `LoginSuccessDelivery`. Every test substitutes `CapturingLoginCodeDelivery` through `TestDeliveryConfig`, so the real class is never constructed. Testing it means mocking `JavaMailSender` and asserting on a `MimeMessageHelper` — that is, asserting that the adapter calls the library the way the library documents. Its logic worth testing (the location lookup, the template fill) already lives in `LoginLocationService` and `MailTemplateService`. |
| `MailTemplateService` | **7.7%** (1/13) | Its entire job is reading template files from `static/mail/` off the classpath and substituting `{{placeholders}}`. The house rule for unit tests is no file system; a test here would either break that rule or assert over its own fixture. It is a candidate for the integration layer, not this one. |

`MailService` stays out of reach of the suite by construction: the `LoginCodeDelivery` /
`LoginSuccessDelivery` seam is substituted in every context, so no test can reach the real SMTP
adapter by accident. `MailTemplateService` is the one to revisit when the integration layer
starts — a real classpath and a real template file is exactly what it needs, and exactly what a
unit test is not allowed to give it.

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
two elements in reverse order as different — pinned separately.

**Fixed.** `sameValue` sorts before comparing, and `ModerationCatalogService` does the same on
the write side through one `sameAssignment` helper. Sorted rather than de-duplicated: dropping
one of two identical entries is still a change. The two deterministic tests were **inverted
rather than deleted**, which is the return on having written them that way — neither depends
on real `HashSet` order, so they pin the fix exactly as reliably as they pinned the defect.
The handler still hands the check an ordered list, and that half is still pinned; what changed
is that nothing reads the order any more.

### Four gaps on the voting path — all four closed

Four behaviours pinned in the `SocialService.voteComment` / `voteAnswer` characterization
tests, none of which looked deliberate. All four are fixed; the list is kept because what a
characterization batch is *for* is turning "this looks wrong" into something specific enough
to act on, and this is the clearest example of that in the document.

1. **No audit was written.** `submitComment` / `submitAnswer` / `submit*Report` in the same
   class all call `auditWriter.writeStudentAction(...)`; the two vote methods did not, so vote
   manipulation did not appear in the moderation trail at all. **F-1, fixed:** `COMMENT_VOTED`
   and `ANSWER_VOTED`, with the direction as metadata and a withdrawal recorded too.
2. **`voteType` was not validated.** A `null` vote type travelled all the way to
   `setVote(null)` and was handed to `save`; the only thing that stopped it was the
   `nullable = false` column, at flush time, surfacing as a 409 where a client expects a 400.
   **F-2, fixed** at the boundary with `@NotNull`.
3. **Neither was `@Transactional`.** The other write methods in the class are. Fixed with
   F-1 — `AuditWriter` joins the caller's transaction on purpose, so without one a vote could
   commit while its entry did not.
4. **There was no toggle-off path.** A second vote in the same direction rewrote the vote
   instead of removing it, and `VoteType` (`UP`, `DOWN`) had no third value for removal.
   **F-3, fixed** with `NONE`, which deletes the row — a withdrawal rather than a third
   direction, chosen over a toggle because a toggle would have changed what an existing
   client's retry does without asking it.

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
`com.pse.user.service`. A version in the house style was written at `com/pse/user/service/`: a
manual constructor factory instead of `@InjectMocks`, AssertJ instead of JUnit `assertEquals`,
`method_scenario_expectation` names. The same intent as `1cd449b` (ProfessorServiceTests).

**This entry said "it was moved". It was not.** The original stayed where it was, and so did
`AccountServiceTests`, so 16 tests went on pinning the same contract twice, in the style the
rewrite existed to replace. Both were deleted in batch 5 and the bundle did not move; the
process finding is [P-4](test-findings.md#p-4--a-moved-test-file-was-copied-not-moved).

### Prompt/code mismatches

The code won in every case: `AuditCursorCodec` is in `com.pse.audit.service`;
`AuditRevertService` is in `com.pse.audit.revert` and takes a `List<AuditRevertHandler>`
rather than a `Map`; `RateLimitService` takes a `PlatformTransactionManager` rather than a
`TransactionTemplate`; `LoginLocationService` was not injecting `RestClient`.

---

## Settled questions

### The BUG-1 nanosecond hypothesis — measured, and it does not hold

**The hypothesis was.** `AuditLog.@PrePersist` writes nanosecond precision through
`Instant.now()`, while the Postgres column **truncates** to microseconds. A cursor built from
an entity still in the persistence context carries `…123456789` while the row holds
`…123456`. Since `.123456 < .123456789`, the keyset predicate matches the same row again and
it **repeats** at the top of the next page.

**Two of its premises were wrong, and the third does not lead where it was thought to.**

1. *"Only a real Postgres can show this."* Both baselines declare `created_at timestamp(6)`
   — the H2 one as well — so whatever precision is lost on PostgreSQL is lost on H2 too. Most
   of this was measurable with no database at all, and
   `AuditTimestampPrecisionTests` measures it.
2. *"The column truncates."* **It rounds.** PostgreSQL 16 answers `.123457` for
   `.1234569`, and H2 rounds too. That is not a detail: truncation can only move an instant
   backwards, which is what the hypothesis's arithmetic depended on. Rounding moves it
   forwards half the time, so the mechanism as described could not have been derived from
   what the column actually does.
3. *The premise that did hold:* `Instant.now()` really does carry nanoseconds on this
   platform, so the entity really does hold digits the column cannot store. That much is
   pinned, as a property of the clock rather than as a constant.

**And the defect does not reproduce.** Against a real PostgreSQL 16 with the production
migrations, `pagingOneRowAtATimeNeverServesTheSameRowTwice` walks the log one row at a time
and no row is served twice. The read path builds its cursor from `page.getLast()` — a row the
query loaded, so it carries the stored value — and the keyset predicate pairs a strict
`createdAt <` with an id tiebreaker, which is the shape that makes a repeat impossible even
when two rows share a microsecond.

BUG-1 therefore has no explanation on the backend, which is where the two bug reports in
[Findings](#findings) already left it. What is different now is that the timestamp
explanation has been ruled out rather than left standing as the leading theory.

**The Testcontainers question was the wrong question.** It was recorded as the blocker for
the whole integration layer: adding the dependency would put Docker in a build that
deliberately did not need it. The pipeline already ran a real `postgres:16` as a **GitLab CI
service** for the migration smoke test, and a service is a plain TCP server — no Docker
socket, no privileged runner, no dependency. `com.pse.support.PostgresTestDatabase` is that
job's setup generalised, tests opt in with
`@EnabledIfEnvironmentVariable(named = "POSTGRES_SMOKE_JDBC_URL", …)`, and the local build is
as Docker-free as it was. (The `CLAUDE.md` this document cited for the Docker-free rule is
not in the repository and never has been — `git log --all -- CLAUDE.md` is empty. The rule
itself is real and visible in the test profile; only the citation was.)

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
- **Deliberately not tested here:** the cursor's effect on the database query — a Criteria
  predicate, which needs a database. Nanosecond/microsecond precision, likewise.
- **Mocks used:** none; the class has no dependencies.
- **Residual risk: closed.** Producing a cursor correctly and *applying* it correctly are
  separate things, and both are now covered: the precision question by
  `AuditTimestampPrecisionPostgresTests`, and the predicate and page boundary of all four
  cursor endpoints by `CursorPaginationPostgresTests`. See
  [The integration layer](#the-integration-layer).
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
  - The coordinate regex rejects whitespace around the comma (`"49.0, 8.4"` is invalid).
    Harmless today because IPinfo returns no space, but it would silently drop the map if the
    provider's format changed.
- **Since closed (F-8):** the two risks that used to head this list are gone. The broad
  `catch (Exception)` is split into `RestClientResponseException` (logged with the status, so
  401/403 and 429 are distinguishable) and `ResourceAccessException` (network or timeout), and
  the six failure-mode tests each assert their own sentence instead of one generic one. A token
  revoked *after* startup — which no log line fired once at boot can catch — is reported as
  `locationLookupEnabled` in `GET /system/status`. A per-request warning is still deliberately
  not added.
- **Test count:** 42 (good: 12, bad: 30)

### CatalogueRevertHandler.LectureHandler / .ProfessorHandler

- **Responsibility:** reverts lecture and professor field edits, mutual assignments included.
  The only handler pair in `com.pse.audit.revert` that declares a *collection* field.
- **Behaviours tested:**
  - `LectureHandler.currentValues`: all seven fields (`professors` as a list of UUID
    strings), an **empty list** (not a missing key) for a lecture with no professors, a
    deleted lecture not appearing in the map, an empty target list
  - **BUG-3, in two deterministic halves:** with a `LinkedHashSet` fixture, that the handler
    produces an order the declared `Set` type does not define; and that `RevertValues.sameValue`
    counts the same two elements in reverse order as **the same value**. The second assertion
    was inverted when the finding was fixed — it read "as different" before — which is what
    writing it deterministically bought: it pins the fix as reliably as it pinned the defect
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
- **Residual risk:** none outstanding. BUG-3 is fixed — `sameValue` compares collections as
  multisets — which matters most for exactly the reason the finding gave: real order varies per
  run because `Professor` has no `hashCode`, so the defect looked **flaky** in production, the
  same edit reverting once and giving `VALUE_CHANGED` the next time. The handler still hands
  the check an ordered list, and that is still pinned; nothing reads the order any more.
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
  `NOT_FOUND` + the `TARGET_MISSING` refusal code.
- **Deliberately not tested:** a `warning.getStudent()` NPE. `Warning.student` is
  `@ManyToOne(optional = false)`, so a row with a null student cannot exist; a test would
  assert over an unreachable state.
- **Mocks used:** `WarningRepository` (for both `findAllById` and `findById`, the second of
  which only this handler has) and `ModerationUserService`.
- **Residual risk:** the race itself is still there and stays — nothing holds a lock between
  the revertibility check and the revert, so the check can say "revertible" and the row can be
  gone by the time the revert runs. Locking would only move the window, since the operator's
  decision is older than either query. What F-11 was actually about is fixed: the refusal
  carries `AuditRevertRefusal.TARGET_MISSING` and the wording the check itself uses, so the
  panel says the entry can no longer be reverted rather than reporting a missing record.
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
  - That the administrator id list is **not** queried for an empty target list — the same
    assertion F-12 recorded as a characterization, inverted when the finding was fixed rather
    than deleted, so the order of the two queries cannot drift back
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
  that the answer path does not touch the comment vote table; that every vote, **withdrawal
  included**, writes its activity entry and a refused one writes none; and that `NONE` deletes
  the row rather than storing a third direction. And, as characterization, the two gaps that
  remain deliberate: no toggle-off on a repeated identical vote, and a `null` `voteType`
  reaching `save` because rejection lives at the boundary.
- **Deliberately not tested:** `submitComment` / `submitAnswer` / the report methods and the
  notification path — the class's remaining missed lines, a later batch. That the unique
  constraint really does prevent the second row is an integration concern; only *what the
  code hands to* `save` is verified here.
- **Mocks used:** the four repositories the two methods touch (`CommentRepository`,
  `AnswerRepository`, `CommentVoteRepository`, `AnswerVoteRepository`) plus `AuditWriter`. The
  constructor's other four dependencies (`LectureService`, the two report repositories,
  `NotificationRepository`) are passed as **`null`** rather than mocks: putting mocks there
  would let a future edit start using these collaborators silently, while `null` turns that
  into an immediate NPE in the method's own test. `AuditWriter` was on that list until F-1 was
  closed — it *was* the finding.
- **Residual risk:** the two remaining gaps are deliberate and written down as such. F-1 (no
  audit) and F-3 (no way to withdraw a vote) are fixed; F-2 was fixed at the boundary, so a
  `null` `voteType` is a 400 rather than the 409 it used to produce, and the characterization
  test that reaches `save` is what stands between a future unvalidated caller and a constraint
  violation at flush time.
- **Test count:** 16 (good: 11, bad: 5)

### StudentService

- **Responsibility:** assembles profile information from an entity graph and soft-deletes the
  account.
- **Behaviours tested:**
  - `getUserInformation`: the credibility score being ups minus downs, the case that comes
    out to zero, the average score plus the rating/comment counts, a zero average with no
    ratings (rather than a division by zero), the 404 for a student that is not found, and
    that the derived score reaches the response **without** being written back to the entity
  - That the score counts **all** votes reaching the student who wrote the content,
    regardless of who cast them (pinned so that a future "don't count your own vote" change
    is a deliberate one)
  - `getUserRatings`: each rating being mapped to a `LectureResponse` plus the average score,
    the count embedded in the message (`"Success, found 2 ratings."`), `success = true` even
    for an empty list, and a 404 for a student that is not found
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
- **Residual risk:** none outstanding. All three entries that stood here are closed:
  - **No path threw** — every failure was a response carrying `success = false` and HTTP 200,
    so a caller reading the status mistook a broken lookup for a successful one. F-5: the four
    failures throw `ApiException` now, 404 or 401, and the body a client parses is unchanged.
  - `getUserInformation` called `student.setCredibilityScore(...)` inside a `readOnly = true`
    transaction. F-9: the write is gone, so the dirty-checking question it raised no longer
    has to be answered at the integration layer.
  - Typos in the message strings (`couldnt`, `succesfully`) were going out to the client;
    the three in `deleteAccount` were fixed in `edaf2bc` and the remaining five in `src/main`
    in `57658c3`, with the tests that pin them updated alongside (F-10 closed). Two of those
    three strings no longer exist at all — F-5 replaced the responses that carried them.
- **Test count:** 13 (good: 7, bad: 6)

### AccountService

- **Responsibility:** a thin facade over `StudentService` with exactly one piece of logic of
  its own: revoking the tokens issued to an account when it is deleted.
- **Behaviours tested:** the two read paths delegating unchanged with `student.getId()`; that
  `invalidateAllAuthTokensForEmail` is called on a **successful** deletion and **not** called
  on a failed one — in both shapes a failure can take, the thrown `ApiException` that
  `StudentService` produces since F-5 and the unsuccessful response the guard still refuses to
  act on; and `requestLogout` embedding the returned session count in the message (three
  sessions and zero sessions).
- **Deliberately not tested:** `AuthService.invalidateAllAuthTokensForEmail` actually revoking
  the tokens — `AuthService`'s job. That a deleted account's token can no longer make requests
  is an integration concern (`TokenAuthenticationService` rejects `DELETED`).
- **Mocks used:** `AuthService` and `StudentService`. `StudentService` is mocked because what
  is under examination is not the deletion itself but whether token revocation happens
  **based on its outcome**.
- **Residual risk:** without the `success` condition the account would go `DELETED` while
  every token stayed valid until it expired, and a student token lives for a year — which is
  why the failed-deletion branch is the single most valuable test in this batch. F-5 moved
  that branch: the failure throws now, so the condition is no longer the only thing enforcing
  the rule. It is kept, and tested against the collaborator's contract rather than against
  today's implementation of it, so the rule outlives another change to how failure is
  signalled. The class throws an NPE on `getId()`/`getKitEmail()` if `student` arrives as
  `null`; not tested, because the principal is supplied by the security chain.
- **Test count:** 7 (good: 4, bad: 3)

### BugReportRevertHandler

- **Responsibility:** reverts an administrator's edit to a bug report — status, severity and
  the fields the moderation panel can change on one.
- **Behaviours tested:** the declared target type; `currentValues` mapping every field the
  handler can revert; an id with **no surviving row** being absent from the map rather than
  mapped to `null`; an empty target list; `applyInverse` replaying the recorded values through
  `ModerationBugReportService`; and a `before` half carrying one field leaving the others
  `null`.
- **Deliberately not tested:** `ModerationBugReportService.update` itself, and the GitLab issue
  the report may be linked to — `RestClientGitLabClient` is a separate class, covered by its own
  tests since batch 5.
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
  passes this test and fails nobody until a user complains. The `PUBLIC_ROUTES_ANSWERING_SERVER_ERROR`
  exemption list is gone with F-14 and F-15: a public route answering 5xx is a plain failure.
- **Test count:** 6

### ApiProtocolContractTests

- **Responsibility:** the status codes the API answers with, swept across the surface rather
  than asserted one endpoint at a time.
- **Behaviours tested:** every body-reading route answering an unreadable media type with the
  declared status (415 since F-17 was fixed) and carrying the project's `BasicResponse` body
  rather than a `ProblemDetail`; malformed JSON in the *right* media type still being a clean
  400; a path called with a verb it does not map answering 405 with the project error body; and
  every such refusal naming the verbs that **would** have worked in an `Allow` header.
- **Deliberately not tested:** nothing outstanding. The `Allow` assertion this section used to
  defer arrived with F-16, as its own sweep rather than as a line in
  `wrongVerbCarriesTheProjectErrorBody`: the header is built in one place from the mapping's
  own verb set, so a route that stopped emitting it would otherwise fail silently.
- **Mocks used:** none, as above.
- **Residual risk:** none outstanding. F-16 was the last wrong status here, and closing it
  tested the batch's own claim — flipping `WRONG_VERB_STATUS` carried 93 refusals across two
  suites with no other edit.
- **Test count:** 6

### ApiOwnershipMatrixTests

- **Responsibility:** horizontal authorization — whether an authenticated caller can reach a
  row belonging to another student.
- **Behaviours tested:** the classification ratchet over all 61 id-taking routes; the
  cross-user probe on the one owner-scoped route, asserted on the **row** first and the status
  second — the row check is what proved the refusal back when the status was a 200, and it
  stays the primary assertion because a status is evidence about the answer, not about the
  table; the owner's own call still working; `/ratings/own` being scoped by the principal
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

### ModerationCatalogService

- **Responsibility:** the catalogue behind the ratings — correcting a lecture or a professor
  that was entered wrong, and the assignment between them.
- **Behaviours tested:**
  - Both rejection gates: a `null` request and a request whose every field is `null`, each
    refused **before** the row is looked up
  - Every validation bound, at the bound and past it: name 300, code 100, professor names
    200, semester year 1900 and 2200 at both ends
  - Trimming before comparison — a name resubmitted with surrounding whitespace is not a
    change
  - Every field resubmitted unchanged recording nothing, and the whole method then saving
    nothing and writing no audit entry
  - `professorIds` and `lectureIds`: an id that does not resolve being a 404, an empty list
    clearing the assignment, and a reassignment being written **from the owning (lecture)
    side** with the detach and attach loops verified on both lectures
  - **BUG-3's write side**: the same professors in a different order recording **no** change
    and no audit entry at all — the two halves of what the bogus change used to produce
  - The audit entry: action, target type and the label built from the row *after* the edit
- **Deliberately not tested:** `deleteLecture` / `deleteProfessor`, which were already
  covered; the cascade behaviour they rely on is an integration concern.
- **Mocks used:** the five constructor dependencies. `AuditWriter` is mocked and captured
  rather than stubbed, because the field diff it receives *is* the observable behaviour of
  these methods — the response says only "Updated … successfully" either way.
- **Residual risk:** 7 branches remain, in the delete paths and the label helpers. BUG-3 is
  fixed on both sides through one `sameAssignment` helper; the test that pinned the defect
  states the fix, which is what a deterministic characterization test is for.
- **Test count:** 29

### ModerationUserService

- **Responsibility:** the administrator's view of an account — listing, filtering, and the
  field edit with its protection rules.
- **Behaviours tested:**
  - Every query-parameter rejection, each verified to happen **before the first repository
    call**: limit out of range or not a number, a cursor with no limit (refused before the
    cursor is even decoded), an unknown status, role or sort, a search over 200 characters,
    and the refusal to filter for `DELETED` at all
  - The accepted sort spellings, since the parser trims and ignores case — a blank value is
    the default rather than an error
  - The protection matrix on `updateStudent`: self-status, self-role, an administrator
    target for an ordinary caller, and the elevated operator's address, which is refused for
    **everybody including an elevated caller**
  - Promotion saving the admin row and demotion deleting it, with the moderation-history
    refusal checked up front rather than left to the constraint
  - Session revocation on a changed address, on a block, and on either role change, asserted
    through the token rows and the `sessionsRevoked` metadata
  - `blockedAt` stamped from the injected `Clock` and cleared again on unblock
  - The `biography == null → ""` normalization, the same one `UserRevertHandler` depends on
- **Deliberately not tested:** the Criteria predicates (`rolePredicate`, `cursorPredicate`),
  which build a query rather than compute an answer — they belong to the integration layer,
  and mocking `CriteriaBuilder` would assert the shape of a query nobody runs.
- **Mocks used:** all ten constructor dependencies, plus a `Clock.fixed`.
- **Residual risk:** 27 branches remain, most of them in `getStudents`'s two ordering modes
  and the predicates above.
- **Test count:** 49

### ModerationContentService

- **Responsibility:** moderating a comment or an answer — editing the text, and the
  visibility switch the student app reads.
- **Behaviours tested:** the shared `contentChanges` guard from both sides; blank and
  overlong content; content and status resubmitted unchanged writing nothing; the audit
  preview being truncated to 120 characters **with a visible ellipsis** and left whole at the
  boundary; the lecture label with a code, with a blank code and with no code at all; and the
  answer path being audited as an `ANSWER_UPDATED` labelled through its parent comment.
- **Deliberately not tested:** the listing methods' response assembly, which is mapping; the
  rating deletion path, already covered.
- **Mocks used:** all ten constructor dependencies.
- **Residual risk:** 12 branches remain, in `getRatings`'s specification lambda and the
  listing helpers.
- **Test count:** 29

### RestClientGitLabClient

- **Responsibility:** opens an issue in the project's GitLab tracker, and decides whether the
  integration is configured at all. The only class in the codebase that holds a credential and
  sends it somewhere.
- **Behaviours tested:**
  - `isEnabled`: all three of base URL, project id and token required; `null`, empty and
    whitespace-only each rejected for each of them; a base URL of nothing but slashes
    (`"///"`) disabling the integration, because the trailing-slash trim runs before the
    emptiness check
  - `createIssue` with the integration off: **503** `"GitLab integration is not configured"`,
    with **no request sent at all** — asserted by the mock server, which fails on any request
    it was not told to expect
  - The request itself: `POST /api/v4/projects/{id}/issues`, the `PRIVATE-TOKEN` header, the
    JSON content type, and `title` / `description` in the body
  - **F-18:** a project id shaped like `group/project` reaching the tracker as **one** path
    segment (`group%2Fproject`), not as a double-encoded `group%252Fproject`
  - Project id and token trimmed before use
  - The answer: an empty body and a body with no `web_url` both **502**; an `iid` that is
    missing or not a number giving a `CreatedIssue` with a `null` issue number and the URL
    intact
  - Failures: a 500, a 401 and a transport failure all becoming **502 "Could not reach
    GitLab"**, and the client's own 502 **not** being rewritten by the catch-all
  - **The credential:** given a failure whose own message contains the token, neither the log
    line nor the message the caller receives repeats it, and the log carries no stack trace
- **Deliberately not tested:** the configured timeouts. They live in a
  `SimpleClientHttpRequestFactory` built in the constructor; asserting on them means either
  reflection over a Spring class or a real slow socket, and the mock server bypasses the
  factory entirely. Also not tested: what GitLab does with the issue — that is the tracker's
  behaviour, not this class's.
- **Mocks used:** none in the Mockito sense. `MockRestServiceServer` bound to a
  `RestClient.Builder` drives the HTTP conversation, and Logback's `ListAppender` reads the log,
  because "the token is not in the log" is an assertion about a log line and nothing else can
  make it.
- **Residual risk:** a revoked token and an unreachable tracker are indistinguishable to the
  caller — both 502 — so an administrator whose issue creation stops working cannot tell from
  the response which one to fix; the distinction exists only in the ERROR line, and only as an
  exception class name. Narrowing that is a product decision, not a test one. The `@Autowired`
  marker on the public constructor is now load-bearing: removing it breaks every
  `@SpringBootTest`, and nothing in the unit layer would notice.
- **Test count:** 25

### TokenAuthenticationService

- **Responsibility:** turns a bearer token into an authenticated caller, or refuses it. Every
  authenticated request in the application passes through this one method.
- **Behaviours tested:**
  - The input gate: `null`, empty, whitespace-only and over-long tokens refused **without
    reaching the database**, and a token of exactly the 512-character limit still looked up
  - That the lookup uses the **SHA-256 hash** and never the plaintext
  - The legacy upgrade: a token found by its plaintext gets a hash written, its
    `legacyValue` cleared and the row saved; a token found by hash never looks for one
  - A token whose student is gone, and `BLOCKED` / `DELETED` accounts, each refused —
    separately, because they are separate arms of the same condition
  - That a refused request does **not** update `lastSeenAt` and does not save
  - The five-minute "last seen" window on both sides of its boundary and exactly on it, with a
    fixed clock
  - The session tier: an `APP` session never queries the admin table; an `ADMIN` session with
    no admin row is refused; one with an admin row carries it; and a token with **no** session
    type is treated as neither
- **Deliberately not tested:** that expired and revoked tokens are filtered — that lives in the
  repository query's name (`…AndRevokedFalseAndExpiresAtAfter…`) and is an integration concern;
  at this level it arrives as an empty result. `@Transactional` semantics likewise.
- **Mocks used:** `TokenRepository`, `AdminRepository`, `StudentRepository`, plus `Clock.fixed`.
  `HashGenerator` is static and is used for real — unlike Argon2 in `OtpService`, token hashing
  is SHA-256 and costs nothing.
- **Residual risk:** the untyped-token arm is pinned as characterization, not endorsed. If
  session types are ever made mandatory, this is the test that has to change, and it names the
  decision rather than leaving it to be rediscovered.
- **Test count:** 24

### AccessRefusalAuditor

- **Responsibility:** records the requests authorization turned down, for the panel's refusal
  view.
- **Behaviours tested:** an anonymous caller and a principal that is not one of ours both
  produce **no** record; an authenticated caller produces one carrying the method, the path,
  the `403` and the actor; an administrator arrives as an administrator; and a failing
  `AuditWriter` neither escapes nor changes the answer — it leaves a WARN with the stack trace.
- **Deliberately not tested:** where the entry ends up. That is `AuditWriter`'s job and has its
  own tests.
- **Mocks used:** `AuditWriter`, plus `MockHttpServletRequest` and a real
  `SecurityContextHolder` context, cleared after each test.
- **Residual risk:** the last test is the one that matters and the easiest to delete by
  accident. Without the try/catch a failed audit write turns a correct 403 into a 500, on
  behalf of somebody who was being refused anyway.
- **Test count:** 5

### ModerationBugReportService

- **Responsibility:** the bug report queue — what a student submits, what an administrator
  edits, and the tracker issue opened from it.
- **Behaviours tested:**
  - `sendBugReport`: an invalid token refused before anything is read; **each of the six arms**
    of the validity condition separately, none of them storing anything; and a valid report
    stored trimmed, attributed to its reporter and audited with its severity
  - `updateBugReport`: a `null` request and an all-null request refused **before the report is
    looked up**; an unknown report 404; each field's change recorded as before/after; title and
    description trimmed; both bounds at and past the limit
  - **Every field resubmitted unchanged writing nothing at all** — no save, no audit entry —
    field by field and all four at once
  - `createIssue`: unavailable when the integration is off, without touching the report; a
    missing report **not** marked as a failed attempt; any other refusal marked and rethrown;
    and the existing-issue answer distinguished from the created one
- **Deliberately not tested:** `BugReportIssueTransactions` itself, which is about transaction
  boundaries and belongs to the integration layer — the reason it is a separate class is that
  its failure marker must survive a rolled-back transaction.
- **Mocks used:** all five constructor dependencies. `AuditWriter` is captured rather than
  stubbed: the field diff it receives is the only observable difference between an edit that
  changed something and one that did not.
- **Residual risk:** the idempotency the class promises is enforced inside
  `BugReportIssueTransactions`, so what is verified here is that this class asks for it and
  reports both answers — not that two concurrent requests really produce one issue.
- **Test count:** 32

