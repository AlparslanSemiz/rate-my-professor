# Testing Documentation

This document explains the test logic currently implemented for the professor/rating and search/filter user stories.

## Test Locations

The project uses two Android test source sets:

- `src/test`: local JVM tests. These run without an Android device or emulator.
- `src/androidTest`: Android instrumentation tests. These run on a real Android device or emulator.

## How CI Runs Them

The GitLab pipeline has two test jobs in the `test` stage:

- `android:test` runs local JVM tests with:

```bash
./gradlew app:test --no-daemon
```

- `android:instrumentation-test` runs Android instrumentation tests with:

```bash
./gradlew app:connectedDebugAndroidTest --no-daemon
```

The instrumentation job needs a GitLab runner with a connected Android emulator or device.

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
- Professor adapter display binding.
- Lecture adapter display binding.
- Search pager professor page selection.
- Search pager lecture page selection.
- Professor DAO insert/search/order behavior.
- Lecture DAO insert/search/order behavior.
- Professor cache refresh from API response into Room.

Not covered yet:

- Submitting a rating.
- Updating visible average rating after a user rating.
- Professor profile navigation after selecting a row.
- Real backend communication.
- Comment creation or display behavior.
- Reporting inappropriate content.
- Searching by last name, lecture, or department.
- Typed search UI behavior.

Those areas are either not implemented yet or not wired deeply enough to test meaningfully.
