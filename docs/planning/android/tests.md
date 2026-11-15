# Testing Documentation

This document explains the test logic currently implemented for the professor/rating and search/filter user stories.

## Test Locations

The project uses two Android test source sets:

- `src/test`: local JVM tests. These run without an Android device or emulator.
- `src/androidTest`: Android instrumentation tests. These run on a real Android device or emulator.

## Active Test Inventory

Local JVM tests:

- `DomainModelTest`: `professorConstructorStoresImplementedFields`, `lectureConstructorStoresImplementedFields`, `ratingConstructorStoresImplementedFields`, `commentConstructorStoresReadableCommentFields`, `reviewConstructorStoresProfessorRatingAndCommentText`, `userConstructorStoresVerifiedKitStudentIdentityFields`, `loginRequestStoresKitMailAndAuthToken`, `serverResponseStoresLoginVerificationResult`, `professorGetLecturesCurrentlyReturnsEmptyList`, `lectureGetProfessorsCurrentlyReturnsEmptyList`, `commentVoteScoreDefaultsToZero`, `lectureOfferingStoresRelationsAndCurrentAverageRatingPlaceholder`, `notificationConstructorStoresFieldsAndMarkAsReadIsCurrentlyNoOp`, `semesterConstructorStoresImplementedFields`, `userStatisticsConstructorStoresImplementedFields`, `voteConstructorStoresImplementedFields`, `userActionPlaceholdersDoNotMutateCurrentDomainObjects`, `enumValuesExposeSupportedSemesterAndVoteTypes`.
- `APIServiceContractTest`: `retrofitClientUsesConfiguredBaseUrlAndCachesInstance`.
- `APIServiceHttpIntegrationTest`: `requestLoginSendsJsonBodyAndParsesServerResponse`, `loginSendsTokenAndParsesRejectedResponse`, `getProfessorsParsesProfessorListFromJson`, `getLecturesParsesLectureListFromJson`.

Active instrumentation tests:

- `ExampleInstrumentedTest`: `useAppContext`.
- `ProfessorFeatureInstrumentedTest`: `professorAdapterBindsFullNameAndItemCount`, `professorAdapterReportsZeroItemsForEmptyList`, `searchPagerAdapterCreatesProfessorPage`, `searchServiceReturnsProfessorsMatchingFirstNameOrderedByFirstName`, `updateDBReplacesExistingProfessorsWithServerProfessors`, `updateDBReplacesExistingLecturesWithServerLectures`, `updateDBLeavesExistingDataWhenServerBodiesAreNull`.
- `SearchAndFilterInstrumentedTest`: `searchServiceReturnsEmptyProfessorListWhenFirstNameDoesNotMatch`, `searchServiceReturnsAllProfessorsOrderedByFirstNameForBlankQuery`, `deleteProfessorsClearsProfessorTable`, `searchServiceReturnsLecturesMatchingNameOrderedByName`, `searchServiceReturnsEmptyLectureListWhenNameDoesNotMatch`, `searchServiceReturnsAllLecturesOrderedByNameForBlankQuery`, `deleteLecturesClearsLectureTable`, `lectureAdapterBindsLectureNameAndItemCount`, `lectureAdapterReportsZeroItemsForEmptyList`, `searchPagerAdapterCreatesLecturePage`, `searchPagerAdapterTreatsUnknownPositionAsLecturePage`.

Disabled instrumentation placeholders:

- `UserStoryInstrumentedTest`: `kitStudentCanSeeAndRateCurrentProfessor`, `kitStudentCanSearchAndFilterProfessorsByNameLectureAndCriteria`, `kitStudentCanReadAndWriteProfessorComments`, `kitStudentCanLoginWithKitMailVerification`.

## How CI Runs Them

The GitLab pipeline has one CI job per active verification category:

- `android:lint` runs static Android lint only. It does not run unit or instrumentation tests.
- `android:test` runs the local JVM test suite once and generates the JVM coverage report:

```bash
./gradlew app:debugUnitTestCoverage --no-daemon
```

- `android:instrumentation-test` is disabled by default. Set the GitLab CI variable `RUN_INSTRUMENTATION_TESTS=true` to run the full Android instrumentation suite once:

```bash
./gradlew app:connectedDebugAndroidTest --no-daemon
```

Instrumentation is controlled as one unit: when it is disabled, CI does not compile, assemble, or run `src/androidTest`; when it is enabled, CI creates an emulator and `connectedDebugAndroidTest` builds the Android test APK as part of the same Gradle task graph before running the tests.

This report covers code that is exercised by local JVM tests. Android UI classes in `Activities`, `Fragments`, and `Adapters` are excluded from this JVM report because they require Android runtime/instrumentation coverage instead of local unit-test coverage.

Test ownership rule: each behavior should have one owning test layer. JVM tests own domain object behavior, Retrofit client configuration, and Retrofit/Gson/HTTP behavior against MockWebServer. Instrumentation tests own Android runtime behavior: Room DAO execution, adapter view binding, fragment/page mapping, and app context checks.

## Local JVM Tests

Files:

- `src/test/java/com/example/myapplication_java/DomainModelTest.java`
- `src/test/java/com/example/myapplication_java/APIServiceContractTest.java`
- `src/test/java/com/example/myapplication_java/APIServiceHttpIntegrationTest.java`

These tests verify pure Java/domain-model behavior, Retrofit contracts, and emulator-free HTTP integration behavior. They are fast and do not depend on Android framework classes.

### `professorConstructorStoresImplementedFields`

Purpose: verifies that the implemented `Professor` constructor correctly stores the data passed into it.

Covered behavior:

- `id` is stored.
- `firstName` is stored.
- `lastName` is stored.
- `department` is stored.
- `averageRating` is stored with floating-point tolerance.

Why this matters: professor list and profile features depend on these fields being populated correctly after object creation or API deserialization.

### `lectureConstructorStoresImplementedFields`

Purpose: verifies that the implemented `Lecture` constructor correctly stores the data passed into it.

Covered behavior:

- `id` is stored.
- `name` is stored.
- `code` is stored.

Why this matters: lecture search and lecture list rendering depend on these fields being populated correctly.

### `ratingConstructorStoresImplementedFields`

Purpose: verifies that the implemented `Rating` constructor correctly stores its id, value, and category.

Covered behavior:

- `ratingId` is stored.
- `value` is stored.
- `ratingCategory` is stored.
- `ratingCategory` is not null.

Why this matters: rating-related UI and future submit logic need the rating value and category to stay attached to the rating object.

### `commentConstructorStoresReadableCommentFields`

Purpose: verifies that comments keep the text and timestamps needed for the "Kommentare lesen und schreiben" user story.

Covered behavior:

- `commentId` is stored.
- `text` is stored.
- `createdAt` is stored.
- `updatedAt` is stored.

Why this matters: the professor comment list and future comment submission flow depend on comment text and timestamps being preserved.

### `reviewConstructorStoresProfessorRatingAndCommentText`

Purpose: verifies that a review stores both the numeric professor rating and the written experience text.

Covered behavior:

- `reviewId` is stored.
- `createdAt` is stored.
- `updatedAt` is stored.
- `averageGrade` is stored with floating-point tolerance.
- `text` is stored.

Why this matters: this is the domain-model coverage for the "Professoren bewerten" story until the rating submission UI and backend integration are implemented.

### `userConstructorStoresVerifiedKitStudentIdentityFields`

Purpose: verifies that user identity data related to KIT student verification is retained.

Covered behavior:

- `userId` is stored.
- `kitEmail` is stored.
- `kitUserCode` is stored.
- `displayName` is stored.
- `profileImagePath` is stored.

Why this matters: verified login and user-owned comments/ratings depend on the app preserving the student's KIT identity fields.

### `loginRequestStoresKitMailAndAuthToken`

Purpose: verifies the request payload used by the KIT email login flow.

Covered behavior:

- KIT email is stored in `email`.
- Verification token is stored in `loginToken`.

Why this matters: `LoginActivity` and `EnterAuthTokenActivity` send this object to the backend for request-login and token-login routines.

### `serverResponseStoresLoginVerificationResult`

Purpose: verifies the backend response wrapper used by login verification.

Covered behavior:

- Response message is stored.
- Success flag is stored.

Why this matters: the token entry screen uses the success flag and message to decide whether to continue or show an error.

Additional domain-model tests cover the remaining practical JVM-testable behavior:

- `Professor.getLectures()` currently returns an empty list.
- `Lecture.getProfessors()` currently returns an empty list.
- `Comment.addReply(...)` and `Comment.getVoteScore()` currently keep the default vote score at `0`.
- `LectureOffering` stores lecture/professor/semester relations and currently returns the placeholder average rating `5.0`.
- `Notification.markAsRead()` is documented as a current no-op.
- `Semester`, `UserStatistics`, and `Vote` constructors store their implemented fields.
- `User` action placeholder methods currently do not mutate the supplied review/comment objects.
- `SemesterType` and `VoteType` expose the expected enum values.

## API Contract JVM Tests

File: `src/test/java/com/example/myapplication_java/APIServiceContractTest.java`

This test verifies Retrofit client construction that is not covered by the MockWebServer integration tests.

Covered behavior:

- `RetrofitClient.getClient(...)` uses the configured backend base URL and caches the Retrofit instance.

Endpoint paths, HTTP methods, request JSON, and response parsing are intentionally not tested here. They are owned by `APIServiceHttpIntegrationTest` so that the same API behavior is not tested twice.

## Emulator-Free JVM Integration Tests

File: `src/test/java/com/example/myapplication_java/APIServiceHttpIntegrationTest.java`

These tests use Retrofit, Gson, OkHttp, and MockWebServer together on the JVM. They do not need an emulator because MockWebServer is a normal in-process HTTP server and the tests do not use Android `Context`, views, Room, activities, or fragments.

What is integrated:

- Retrofit creates a real `APIService` implementation.
- Gson serializes `LoginRequest` into JSON request bodies.
- OkHttp sends HTTP requests to MockWebServer.
- MockWebServer records the actual HTTP method, URL path, and request body.
- Retrofit/Gson parse fake JSON responses back into `ServerResponse`, `Professor`, and `Lecture` objects.

### `requestLoginSendsJsonBodyAndParsesServerResponse`

Purpose: verifies the request-login flow across Retrofit, JSON serialization, HTTP transport, and response parsing.

Covered behavior:

- `requestLogin(...)` sends `POST /auth/request-login`.
- The JSON request body contains the KIT email and empty token.
- A successful JSON response is parsed into `ServerResponse`.

### `loginSendsTokenAndParsesRejectedResponse`

Purpose: verifies token-login request serialization and failure-response parsing without calling the real backend.

Covered behavior:

- `login(...)` sends `POST /auth/login`.
- The JSON request body contains the KIT email and token.
- A rejected JSON response is parsed with `success == false` and the expected message.

### `getProfessorsParsesProfessorListFromJson`

Purpose: verifies that professor data returned by the backend shape can be parsed into the current `Professor` domain model.

Covered behavior:

- `getProfessors()` sends `GET /data/professor`.
- JSON fields `id`, `firstName`, `lastName`, `department`, and `averageRating` populate a `Professor`.

### `getLecturesParsesLectureListFromJson`

Purpose: verifies that lecture data returned by the backend shape can be parsed into the current `Lecture` domain model.

Covered behavior:

- `getLectures()` sends `GET /data/lectures`.
- JSON fields `id`, `name`, and `code` populate a `Lecture`.

## Android Instrumentation Tests

File: `src/androidTest/java/com/example/myapplication_java/ProfessorFeatureInstrumentedTest.java`

These tests use Android runtime classes, so they belong in `src/androidTest` instead of `src/test`.

The test class creates an in-memory Room database before each test and closes it after each test.

Setup logic:

- `Room.inMemoryDatabaseBuilder(...)` creates a temporary test database.
- `allowMainThreadQueries()` keeps the test simple by allowing DAO calls directly in the test thread.
- `database.searchService()` gives access to the implemented DAO methods.

Teardown logic:

- `database.close()` releases the in-memory database after each test.

### `professorAdapterBindsFullNameAndItemCount`

Purpose: verifies that `ProfessorAdapter` renders implemented professor list data correctly.

Covered behavior:

- Adapter item count matches the input professor list size.
- `onCreateViewHolder(...)` inflates the professor row layout.
- `onBindViewHolder(...)` writes the professor full name into `R.id.profName`.
- The rendered format is `firstName + " " + lastName`.

Why this is instrumentation: inflating Android layouts and reading a `TextView` require Android framework classes.

### `professorAdapterReportsZeroItemsForEmptyList`

Purpose: verifies that `ProfessorAdapter` handles an empty input list without producing phantom rows.

### `searchPagerAdapterCreatesProfessorPage`

Purpose: verifies that the search pager creates the professor-selection page for position `0`.

Covered behavior:

- `SearchPagerAdapter.getItemCount()` returns `2`.
- `createFragment(0)` returns a `SelectionFragment`.
- The created fragment receives the `selection_type` argument with value `PROFESSORS`.

Why this matters: the search screen depends on pager position `0` being the professor list and position `1` being lectures.

### `searchServiceReturnsProfessorsMatchingFirstNameOrderedByFirstName`

Purpose: verifies the implemented Room DAO query for professor search.

Covered behavior:

- Professors can be inserted into the Room database.
- `searchProfessors("A")` returns professors whose `firstName` matches the query.
- Results are ordered by `firstName ASC`.

Important limitation documented by this test: the current query only searches `firstName`, not `lastName`, department, or lecture.

Why this is instrumentation: Room database behavior depends on Android runtime support in this project setup.

### `updateDBReplacesExistingProfessorsWithServerProfessors`

Purpose: verifies the implemented database refresh path for professor data.

Covered behavior:

- Existing cached professors are removed.
- Professors returned by `APIService.getProfessors()` are inserted into Room.
- The final database contains the fake server professors, not the old local professor.
- The DAO still returns results ordered by first name.

How the test avoids real network calls:

- `FakeAPIService` implements `APIService` directly.
- `getProfessors()` returns a successful fake Retrofit `Call`.
- `getLectures()` returns an empty successful response because `Database.updateDB(...)` also refreshes lectures.

Why `waitForProfessorCount(...)` exists:

- `Database.updateDB(...)` inserts data on a background executor.
- The test waits briefly until the expected number of professors appears in the database.
- This avoids asserting before the async insert finishes.

### Additional Database Refresh Tests

The instrumentation suite also covers:

- replacing cached lectures with lectures returned by `APIService.getLectures()`
- preserving existing professor and lecture rows when the fake server response body is `null`
- waiting for asynchronous lecture inserts before asserting final DAO state

## Search And Filter Instrumentation Tests

File: `src/androidTest/java/com/example/myapplication_java/SearchAndFilterInstrumentedTest.java`

These tests cover the implemented search/filter behavior for professor and lecture lists.

The current production implementation supports:

- professor search by `firstName`
- lecture search by `name`
- professor and lecture result ordering
- pager mapping between professor and lecture pages
- lecture row display binding

The current production implementation does not yet support:

- professor search by `lastName`
- professor search by lecture
- professor search by department
- a typed UI search field wired to `SearchService`

### `searchServiceReturnsEmptyProfessorListWhenFirstNameDoesNotMatch`

Purpose: verifies that professor search filters out professors whose first name does not match the query.

Covered behavior:

- Professors can be inserted into the Room database.
- `searchProfessors("Alan")` returns an empty list when no professor `firstName` matches.

Why this matters: search should not return unrelated professor rows.

### Additional Professor DAO Tests

The instrumentation suite also covers:

- blank professor query returns all professors ordered by `firstName ASC`
- `deleteProfessors()` clears the professor table

### `searchServiceReturnsLecturesMatchingNameOrderedByName`

Purpose: verifies the implemented Room DAO query for lecture search.

Covered behavior:

- Lectures can be inserted into the Room database.
- `searchLectures("A")` returns lectures whose `name` matches the query.
- Results are ordered by `name ASC`.

Why this matters: the lecture search tab depends on the DAO returning filtered, predictable lecture results.

### `searchServiceReturnsEmptyLectureListWhenNameDoesNotMatch`

Purpose: verifies that lecture search filters out lectures whose name does not match the query.

Covered behavior:

- Lectures can be inserted into the Room database.
- `searchLectures("Physics")` returns an empty list when no lecture name matches.

Why this matters: lecture search should not return unrelated lecture rows.

### Additional Lecture DAO Tests

The instrumentation suite also covers:

- blank lecture query returns all lectures ordered by `name ASC`
- `deleteLectures()` clears the lecture table

### `lectureAdapterBindsLectureNameAndItemCount`

Purpose: verifies that `LectureAdapter` renders implemented lecture list data correctly.

Covered behavior:

- Adapter item count matches the input lecture list size.
- `onCreateViewHolder(...)` inflates the lecture row layout.
- `onBindViewHolder(...)` writes the lecture name into `R.id.lectureName`.

Why this is instrumentation: inflating Android layouts and reading a `TextView` require Android framework classes.

### `lectureAdapterReportsZeroItemsForEmptyList`

Purpose: verifies that `LectureAdapter` handles an empty input list without producing phantom rows.

### `searchPagerAdapterCreatesLecturePage`

Purpose: verifies that the search pager creates the lecture-selection page for position `1`.

Covered behavior:

- `SearchPagerAdapter.getItemCount()` returns `2`.
- `createFragment(1)` returns a `SelectionFragment`.
- The created fragment receives the `selection_type` argument with value `LECTURES`.

Why this matters: the search screen depends on pager position `1` being the lecture list.

### `searchPagerAdapterTreatsUnknownPositionAsLecturePage`

Purpose: documents the current fallback behavior where any non-zero pager position creates the lecture page.

## Disabled User Story Instrumentation Tests

File: `src/androidTest/java/com/example/myapplication_java/UserStoryInstrumentedTest.java`

This class is annotated with `@Ignore`, so none of these tests run locally or in CI yet. They are intentionally kept as disabled instrumentation test placeholders for the user stories that require full Android UI and backend wiring.

The class-level disabled reason is:

- professor profile flow is not fully wired
- comment flow is not fully wired
- search UI filtering is not fully wired
- KIT login flow is not reliable enough for automated instrumentation yet

### `kitStudentCanSeeAndRateCurrentProfessor`

Purpose: acceptance coverage for "Professoren bewerten".

Expected future behavior:

- Open a professor details screen.
- Show current professor data.
- Submit a rating.
- Verify the visible rating state updates.

### `kitStudentCanSearchAndFilterProfessorsByNameLectureAndCriteria`

Purpose: acceptance coverage for "Professoren suchen/filtern".

Expected future behavior:

- Drive the search UI.
- Filter professors by name.
- Filter professors by lecture.
- Filter professors by additional criteria.

### `kitStudentCanReadAndWriteProfessorComments`

Purpose: acceptance coverage for "Kommentare lesen und schreiben".

Expected future behavior:

- Open the professor comment area.
- Render existing comments.
- Submit a new comment.
- Verify the new comment appears.

### `kitStudentCanLoginWithKitMailVerification`

Purpose: acceptance coverage for "Login mit KIT-Mail".

Expected future behavior:

- Enter a KIT email address.
- Request a login token.
- Enter the token.
- Verify navigation into the app after successful verification.

## Test Helper Classes

### `FakeAPIService`

A test double for `APIService`.

It is used to test `Database.updateDB(...)` without depending on the real backend.

Implemented methods:

- `getProfessors()` returns fake professor data.
- `getLectures()` returns fake lecture data.

Unsupported methods:

- `requestLogin(...)`
- `login(...)`

Those throw `UnsupportedOperationException` because the current test class does not test login behavior.

### `SuccessfulCall<T>`

A minimal fake Retrofit `Call<T>` implementation.

It immediately returns `Response.success(body)` when either `execute()` or `enqueue(...)` is called.

This is enough for `Database.updateDB(...)`, because the production code uses `enqueue(...)`.

## Current Coverage Boundaries

Covered now:

- Domain-model constructors and current placeholder behavior for `Professor`, `Lecture`, `Rating`, `RatingCategory`, `Comment`, `Review`, `User`, `LectureOffering`, `Notification`, `Semester`, `UserStatistics`, and `Vote`.
- Enum values for `SemesterType` and `VoteType`.
- Basic `Review` model construction for rating plus written experience text.
- Basic `Comment` model construction for readable professor comments.
- Basic `User` model construction for KIT identity fields.
- `LoginRequest` payload construction for KIT email and token login.
- `ServerResponse` construction for login verification result handling.
- Retrofit client base URL and singleton/cache behavior.
- Retrofit/Gson/OkHttp integration against MockWebServer for login, professor list, and lecture list HTTP calls.
- Professor adapter display binding.
- Professor adapter empty-list behavior.
- Lecture adapter display binding.
- Lecture adapter empty-list behavior.
- Search pager professor page selection.
- Search pager lecture page selection.
- Search pager non-zero fallback behavior.
- Professor DAO insert/search/order behavior.
- Professor DAO blank-query and delete behavior.
- Lecture DAO insert/search/order behavior.
- Lecture DAO blank-query and delete behavior.
- Professor cache refresh from API response into Room.
- Lecture cache refresh from API response into Room.
- Database refresh behavior when API response bodies are null.
- Disabled instrumentation acceptance placeholders for the four current user stories.

Not covered yet:

- Submitting a rating.
- Updating visible average rating after a user rating.
- Professor profile navigation after selecting a row.
- Real backend communication.
- Comment creation or display behavior.
- Reporting inappropriate content.
- Searching by last name, lecture, or department.
- Typed search UI behavior.
- Enforcing that an email address belongs to the KIT domain.

Those areas are either not implemented yet or not wired deeply enough to test meaningfully.
