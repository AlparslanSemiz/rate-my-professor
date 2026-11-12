# Deployment Guide

This guide describes only what is confirmed in this repository. It covers the Android frontend build and CI pipeline, plus the backend endpoint the app currently targets. Backend server deployment, backend database setup, and BW Cloud provisioning are not defined in this repository and are marked as TODO.

## Repository Scope

Confirmed repository contents:

- Android application module: `:app`
- Gradle build configuration and wrapper
- GitLab CI/CD pipeline: `.gitlab-ci.yml`
- Android Room database code used on the device
- Retrofit API client code for a backend hosted on BW Cloud

Not found in this repository:

- Backend source code
- Dockerfile or Docker Compose configuration
- Server provisioning scripts
- Backend environment-variable examples
- Backend database schema or migration files
- Deployment scripts for BW Cloud

## Prerequisites

Confirmed software and SDK versions:

- Gradle wrapper: `9.4.1` from `gradle/wrapper/gradle-wrapper.properties`
- Android Gradle Plugin: `9.2.1` from `gradle/libs.versions.toml`
- Gradle daemon JVM toolchain: `21` from `gradle/gradle-daemon-jvm.properties`
- Java source/target compatibility for the app: `17` from `app/build.gradle.kts`
- Android compile SDK: API `36`, minor API level `1`
- Android target SDK: `36`
- Android minimum SDK: `26`
- GitLab CI Android image: `ghcr.io/cirruslabs/android-sdk:36`

Local Android builds require an Android SDK configured locally. The checked-out workspace has a generated `local.properties` file with `sdk.dir`, but `local.properties` is ignored by Git and is machine-specific.

For optional instrumentation tests, the GitLab CI job uses:

- AVD name: `ci-api-36`
- Android system image: `system-images;android-36;google_apis;x86_64`
- Device profile: `pixel`

TODO: Confirm the exact supported developer workstation setup outside CI, including whether JDK 21 is required everywhere or whether the Gradle toolchain should provision it.

## System Components

### Android application

The app is an Android Java application:

- Root project name: `Rate My Professor`
- Gradle module: `:app`
- Application ID: `com.example.ratemyprofessor`
- Namespace: `com.example.ratemyprofessor`
- App label: `My Application_Java`
- Launcher activity: `com.example.ratemyprofessor.Activities.StartActivity`

The manifest requests:

- `android.permission.INTERNET`
- `android.permission.ACCESS_NETWORK_STATE`

The app sets `android:usesCleartextTraffic="true"` in `app/src/main/AndroidManifest.xml`, although the configured backend URL uses HTTPS.

### Backend API

The Android app communicates with a backend through Retrofit and OkHttp. The configured base URL is hardcoded in `app/src/main/java/com/example/ratemyprofessor/ServerCommunication/RetrofitClient.java`:

```text
https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org/
```

The Retrofit client also configures:

- Connect timeout: `10` seconds
- Read timeout: `10` seconds
- HTTP logging interceptor level: `BODY`
- IPv4-only DNS filtering
- Gson parsing with a custom `LocalDateTime` deserializer using ISO local date-time format

Confirmed backend routes expected by the Android app:

| Method | Path |
| --- | --- |
| `POST` | `/auth/request-login` |
| `POST` | `/auth/login` |
| `POST` | `/auth/validate` |
| `POST` | `/auth/logout-all` |
| `PATCH` | `/account/deleteAccount` |
| `GET` | `/data/professor` |
| `GET` | `/data/lectures` |
| `POST` | `/social/comments` |
| `GET` | `/social/comments/{lecture_id}` |
| `GET` | `/ratings/{lectureId}` |
| `POST` | `/ratings/rate` |
| `POST` | `/social/answers` |
| `POST` | `/social/comments/vote/comment/{commentID}` |
| `POST` | `/social/comments/vote/answer/{answerID}` |
| `GET` | `/social/sync/comments` |
| `GET` | `/account/information` |
| `GET` | `/account/ratings` |
| `POST` | `/comments/report` |
| `POST` | `/answers/report` |
| `GET` | dynamic image URL through Retrofit `@Url` |

TODO: Confirm the backend repository, backend runtime, server start command, health-check endpoint, and production API contract.

### Local on-device database

The app uses Room for an on-device database:

- Database class: `com.example.ratemyprofessor.ServerCommunication.Database`
- Database file name: `database.db`
- Room schema version: `6`
- Entities: `Lecture`, `Professor`, `CommentModel`, `Instructor`
- DAO: `SearchService`
- Migration behavior: `fallbackToDestructiveMigration(true)`

`MainViewModel` refreshes local data when it is created. The refresh pulls data from these backend calls and writes it into the local Room database:

- `GET /data/professor`
- `GET /data/lectures`
- `GET /social/sync/comments`

TODO: Confirm whether destructive local migrations are acceptable for production users.

### Stored client data

The app stores client-side data in Android `SharedPreferences`:

- Login storage name: `loginData`
- Stored login keys: `mailAddress`, `OTP`, `authToken`
- Settings storage name: `settings`
- Statistics storage name: `statistics`

Do not put real token values or user data in documentation, CI logs, or committed files.

## Configuration and Environment Variables

### Android application configuration

Confirmed Android app configuration is currently source-code based:

- Backend base URL is hardcoded in `RetrofitClient.BASE_URL`.
- `BuildConfig.SKIP_LOGIN` is set to `false` for `debug` builds.
- `BuildConfig.SKIP_LOGIN` is set to `true` for `release` builds in
  `app/build.gradle.kts`.
- Release minification is disabled with `isMinifyEnabled = false`.
- No signing configuration is defined in `app/build.gradle.kts`.
- No `.env` or environment-variable example file is present.

To change the backend target, update `RetrofitClient.BASE_URL` and rebuild the APK.

Treat the current release `SKIP_LOGIN=true` value as a release blocker unless it
is intentional for the chosen distribution channel. It bypasses the normal login
screen in release artifacts produced by `app:assembleRelease`.

TODO: Replace or document the hardcoded base URL strategy if different environments are needed.
TODO: Confirm release signing, keystore handling, and app distribution channel.

### Local build configuration

The checked-out workspace uses `local.properties` to point Gradle to an Android SDK. It is ignored by Git and should stay machine-specific.

TODO: Confirm whether any additional local properties are required.

### GitLab CI/CD variables

Confirmed variables in `.gitlab-ci.yml`:

- `GRADLE_USER_HOME` is set to `$CI_PROJECT_DIR/.gradle` for Android Gradle jobs.
- `RUN_INSTRUMENTATION_TESTS=true` enables the optional instrumentation-test job.
- `AVD_NAME` is set to `ci-api-36` inside the instrumentation-test job.
- `ANDROID_SYSTEM_IMAGE` is set to `system-images;android-36;google_apis;x86_64` inside the instrumentation-test job.
- Built-in GitLab variables used by the pipeline include `CI_PIPELINE_SOURCE`, `CI_COMMIT_REF_SLUG`, and `CI_COMMIT_BRANCH`.

No secret CI/CD variables are documented in this repository.

TODO: Confirm whether release signing requires protected GitLab variables.

## Required Ports

Confirmed from this repository:

- The Android app does not listen on an inbound port.
- The Android app sends outbound traffic to the configured HTTPS backend URL. No explicit numeric port is configured in the URL.
- Because the configured URL uses `https://` without a port, clients use the standard HTTPS port for that URL.
- MockWebServer tests start a local ephemeral test server during unit tests only.

TODO: Confirm backend inbound ports, database ports, firewall rules, and BW Cloud security-group configuration from the backend or infrastructure repository.

## Build Instructions

From the repository root, make the Gradle wrapper executable on Unix-like systems:

```bash
chmod +x ./gradlew
```

Run lint:

```bash
./gradlew app:lint --no-daemon
```

Run unit tests with coverage:

```bash
./gradlew app:debugUnitTestCoverage --no-daemon
```

Build a debug APK:

```bash
./gradlew app:assembleDebug --no-daemon
```

Debug APK output:

```text
app/build/outputs/apk/debug/*.apk
```

Build a release APK:

```bash
./gradlew app:assembleRelease --no-daemon
```

Release APK output:

```text
app/build/outputs/apk/release/*.apk
```

The repository also contains Windows-oriented VS Code tasks that run `gradlew.bat` with Android Studio's bundled JBR. Confirmed task commands include:

- `.\gradlew.bat assembleDebug`
- `.\gradlew.bat installDebug`
- `adb.exe shell monkey -p com.example.ratemyprofessor -c android.intent.category.LAUNCHER 1`

TODO: Confirm whether production releases should be APKs, AABs, signed APKs, or another package format.

## Deployment

### Android app deployment

Confirmed deployable artifacts are APKs produced by Gradle:

- Debug APK from `app:assembleDebug`
- Release APK from `app:assembleRelease`

For local development on Windows, `.vscode/tasks.json` defines an install task using:

```powershell
.\gradlew.bat installDebug
```

TODO: Confirm the production mobile deployment path, such as direct APK distribution, managed device installation, internal app sharing, or an app store.
TODO: Confirm release signing and versioning procedure beyond `versionCode = 1` and `versionName = "1.0"`.

### Backend and BW Cloud deployment

The Android client currently targets this BW Cloud hostname:

```text
8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org
```

This repository does not contain enough information to deploy or modify that server. There are no backend sources, Docker files, compose files, SSH targets, systemd units, database credentials, migration commands, or deploy scripts.

Do not deploy to BW Cloud from this repository without the missing backend and infrastructure documentation.

TODO: Add the backend deployment guide or link to the backend repository.
TODO: Document how the backend is started on BW Cloud.
TODO: Document how TLS, DNS, reverse proxying, and firewall rules are managed.

## Database Setup and Migrations

### Android Room database

No manual setup is required for the on-device Room database. The app creates `database.db` on the device when `Database.getInstance(context)` is first called.

When `MainViewModel` is created, it calls `Database.updateDB(apiService)`, which refreshes local tables from the backend. The refresh currently deletes and reinserts local professor, lecture, instructor, and comment data based on backend responses.

No explicit Room migration classes are present. The database builder uses `fallbackToDestructiveMigration(true)`, so schema changes can recreate local data instead of applying a custom migration.

### Backend database

TODO: Backend database setup is not documented in this repository.
TODO: Backend migration tooling and commands are not documented in this repository.
TODO: Backend seed data or required initial data are not documented in this repository.

## GitLab CI/CD Pipeline

The pipeline runs for:

- Push pipelines
- Merge request pipelines

Stages:

1. `check`
2. `test`
3. `build`
4. `package`

Jobs:

| Job | Stage | Command | Artifacts |
| --- | --- | --- | --- |
| `android:lint` | `check` | `./gradlew app:lint --no-daemon` | Lint HTML/XML reports for 1 week |
| `android:test` | `test` | `./gradlew app:debugUnitTestCoverage --no-daemon` | JUnit results, JaCoCo reports, test reports for 1 week |
| `android:instrumentation-test` | `test` | Creates API 36 emulator and runs `./gradlew app:connectedDebugAndroidTest --no-daemon` | Android test reports for 1 week |
| `android:build` | `build` | `./gradlew app:assembleDebug --no-daemon` | Debug APKs for 1 week |
| `android:package` | `package` | `./gradlew app:assembleRelease --no-daemon` | Release APKs for 1 month |

The instrumentation-test job is disabled by default. It only runs when:

```text
RUN_INSTRUMENTATION_TESTS == "true"
```

The release packaging job only runs on the `main` branch:

```text
CI_COMMIT_BRANCH == "main"
```

There is no CI job in this repository that deploys to BW Cloud or any server.

TODO: Confirm whether a deployment stage should be added after release packaging.

## Verifying a Successful Deployment

### Verify Android build artifacts

After a pipeline or local build, confirm that the expected APK artifact exists:

```text
app/build/outputs/apk/debug/*.apk
app/build/outputs/apk/release/*.apk
```

### Verify app startup

On a device or emulator:

1. Install the APK through the documented local or CI artifact process.
2. Start the app. The launcher activity is `StartActivity`.
3. Confirm that the app can detect network availability.
4. If no login data is stored, confirm that the login screen opens.
5. Request a login code with a KIT email address.
6. Enter the received code and confirm that the app reaches the main screen.

### Verify backend-dependent functionality

The app depends on backend responses for login, profile data, search data, comments, ratings, voting, reports, logout, and account deletion.

After login, verify at least:

- Profile data loads through `GET /account/information`.
- Search data is available after local Room refresh from professor and lecture endpoints.
- Comments or ratings load for a selected lecture offering.

TODO: Add a non-secret health-check endpoint and a test account or test procedure that can be used without exposing production credentials.

## Updating, Restarting, and Basic Troubleshooting

### Updating the Android app

1. Pull or check out the desired repository revision.
2. Rebuild the APK with the appropriate Gradle task.
3. Install or distribute the new APK through the confirmed deployment channel.
4. Verify app startup and backend-dependent screens.

TODO: Confirm whether versionCode/versionName must be changed for every distributed build.

### Restarting

The Android frontend has no long-running server process in this repository. Restarting means closing and reopening the Android app, or reinstalling the APK during development.

TODO: Backend restart commands are not documented in this repository.

### Troubleshooting

Build or CI failures:

- Check the GitLab job artifacts listed in `.gitlab-ci.yml`.
- Confirm the Android SDK level matches compile SDK API 36 with minor API level 1.
- Confirm the Gradle wrapper is executable in Unix-like CI environments.
- For instrumentation tests, confirm `RUN_INSTRUMENTATION_TESTS=true` was set intentionally and that the API 36 Google APIs x86_64 system image is available.

Backend connectivity failures:

- Confirm the device or emulator has network access.
- Confirm `RetrofitClient.BASE_URL` points to the intended backend.
- The client currently filters DNS results to IPv4 addresses.
- The client times out connections and reads after 10 seconds.
- The login UI displays "Cannot reach the server. Check your connection and try again." when the server cannot be reached.

Local data issues:

- The Room database mirrors backend data and is refreshed from backend endpoints.
- Because destructive migration fallback is enabled, local data can be recreated after schema changes.
- If search data is empty, check whether `/data/professor`, `/data/lectures`, and `/social/sync/comments` returned successful responses.

Release issues:

- No signing configuration is present in `app/build.gradle.kts`.
- `BuildConfig.SKIP_LOGIN=true` is currently set for the `release` build type.
- Release minification is disabled.
- TODO: Confirm signing, obfuscation, and distribution requirements.

## Open Questions

1. Where is the backend repository and its deployment documentation?
2. What backend runtime, framework, and required software versions are used?
3. How is the backend deployed to BW Cloud?
4. Which server ports, firewall rules, DNS records, TLS certificates, and reverse proxy settings are required?
5. Which backend database engine is used, and how is it created, migrated, backed up, and restored?
6. Are there backend environment variables or secrets that must be configured outside this repository?
7. Is the hardcoded Android `BASE_URL` the intended production URL, or should environments be configurable per build variant?
8. How should release artifacts be signed and distributed?
9. Should CI/CD deploy anything after `android:package`, or is it intentionally build-only?
10. Are destructive Room migrations acceptable for production users?
11. What non-secret health check or smoke test should be used after deployment?
