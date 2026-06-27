# Testing Documentation

This document explains the test logic currently implemented for the professor/rating and search/filter user stories.

## Test Locations

The project uses two Android test source sets:

- `src/test`: local JVM tests. These run without an Android device or emulator.
- `src/androidTest`: Android instrumentation tests. These run on a real Android device or emulator.

## How CI Runs Them

The GitLab pipeline currently runs local JVM tests in the `test` stage:

- `android:test` runs local JVM tests with:

```bash
./gradlew app:test --no-daemon
```

- `.android:instrumentation-test` is kept as a hidden GitLab CI template for Android instrumentation tests:

```bash
./gradlew app:connectedDebugAndroidTest --no-daemon
```

The instrumentation job is temporarily disabled and will not run in CI while it is dot-prefixed. This keeps the test definition integrated with CI but avoids booting an emulator until the runner can execute Android device tests reliably.

## Local JVM Tests

File: `src/test/java/com/example/myapplication_java/DomainModelTest.java`

These tests verify pure Java/domain-model behavior. They are fast and do not depend on Android framework classes.

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

### `lectureAdapterBindsLectureNameAndItemCount`

Purpose: verifies that `LectureAdapter` renders implemented lecture list data correctly.

Covered behavior:

- Adapter item count matches the input lecture list size.
- `onCreateViewHolder(...)` inflates the lecture row layout.
- `onBindViewHolder(...)` writes the lecture name into `R.id.lectureName`.

Why this is instrumentation: inflating Android layouts and reading a `TextView` require Android framework classes.

### `searchPagerAdapterCreatesLecturePage`

Purpose: verifies that the search pager creates the lecture-selection page for position `1`.

Covered behavior:

- `SearchPagerAdapter.getItemCount()` returns `2`.
- `createFragment(1)` returns a `SelectionFragment`.
- The created fragment receives the `selection_type` argument with value `LECTURES`.

Why this matters: the search screen depends on pager position `1` being the lecture list.

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

- Basic `Professor` model construction.
- Basic `Lecture` model construction.
- Basic `Rating` model construction.
- Basic `Review` model construction for rating plus written experience text.
- Basic `Comment` model construction for readable professor comments.
- Basic `User` model construction for KIT identity fields.
- `LoginRequest` payload construction for KIT email and token login.
- `ServerResponse` construction for login verification result handling.
- Professor adapter display binding.
- Lecture adapter display binding.
- Search pager professor page selection.
- Search pager lecture page selection.
- Professor DAO insert/search/order behavior.
- Lecture DAO insert/search/order behavior.
- Professor cache refresh from API response into Room.
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
