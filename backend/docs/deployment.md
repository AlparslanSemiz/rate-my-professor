# Deployment Guide

This guide documents deployment behavior confirmed by repository files.

## Project Scope

This repository contains a Spring Boot backend service with PostgreSQL
persistence, Docker packaging, a Docker Compose local stack, GitLab CI/CD
configuration, API documentation, health/status endpoints, and optional SMTP,
GitLab issue, IPinfo, and Geoapify integrations.

## Prerequisites

| Tool or runtime | Confirmed version or usage |
| --- | --- |
| Java | Java 21 is configured in `pom.xml` and used by the Docker images. |
| Maven | The Maven wrapper uses Maven 3.9.15. |
| Spring Boot | `pom.xml` uses Spring Boot 4.0.6. |
| Docker | Used for image build, local Compose, and server deployment. |
| Docker Compose | Used by `docker-compose.yml`, `docker-compose.prod.yml`, CI deploy, and `scripts/docker-smoke-test.sh`. |
| PostgreSQL | Local Docker Compose uses `postgres:16`. |
| Kaniko | CI image build uses `gcr.io/kaniko-project/executor:v1.23.2-debug`. |
| GitLab CI/CD | The pipeline is defined in `.gitlab-ci.yml`. |

The Maven wrapper is committed as `mvnw` and `mvnw.cmd`; the wrapper
configuration is in `.mvn/wrapper/maven-wrapper.properties`.

## System Components

| Component | Role | Confirmed source |
| --- | --- | --- |
| Backend API | Spring Boot application exposing authentication, account, catalogue, social, moderation, audit, health, and system status endpoints. | `src/main/java/com/pse`, `docs/admin-api.md`, `docker-compose.prod.yml` |
| PostgreSQL database | Runtime persistence for the backend. The app uses JDBC/JPA with PostgreSQL in normal runtime and H2 in tests. | `pom.xml`, `application.properties`, `docker-compose.yml` |
| SMTP server | Sends OTP login emails and successful-login notification emails. | `MailService`, `application.properties`, `.env.example` |
| Admin Web origin | Browser origin allowed through CORS. CI defaults it to the BW Cloud/staging URL. | `CorsConfig`, `.gitlab-ci.yml`, `docs/admin-api.md` |
| GitLab issue integration | Optional backend integration for creating GitLab issues from bug reports. | `RestClientGitLabClient`, `application.properties`, `.env.example` |
| IPinfo and Geoapify | Optional login-location enrichment for notification emails. | `LoginLocationService`, `.env.example` |
| GitLab Container Registry | Stores backend images built by CI. | `.gitlab-ci.yml` |
| BW Cloud/staging host | Deployment target reached by SSH from CI and updated with Docker. | `.gitlab-ci.yml` |

## Configuration

The backend reads configuration from Spring Boot properties and environment
variables. `.env.example` lists expected variables. When running directly,
provide variables through the shell, process manager, or deployment environment.

Do not commit real secret values. `.env` is ignored by `.gitignore`.

### Backend Environment Variables

| Variable | Usage | Default or behavior confirmed in repository |
| --- | --- | --- |
| `SERVER_PORT` | Backend HTTP port. | Falls back to `PORT`, then `8080`. |
| `PORT` | Secondary backend HTTP port fallback. | Used only as fallback for `SERVER_PORT`. |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL. | Defaults to `jdbc:postgresql://localhost:5432/postgres`. CI staging defaults to `jdbc:postgresql://host.docker.internal:5432/postgres`. |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username. | Defaults to `postgres`. |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password. | Defaults to empty. Treat as secret. |
| `SPRING_FLYWAY_ENABLED` | Enables versioned Flyway migrations during backend startup. | Defaults to `true`. CI staging also defaults to `true`. |
| `SPRING_FLYWAY_BASELINE_ON_MIGRATE` | Allows the first Flyway deployment to baseline an existing non-empty database previously managed by Hibernate. | The application defaults to `true` for the pre-Flyway case. CI writes `false` for the deployed environment, which was baselined on 2026-09-05. |
| `ADMIN_FRONTEND_ORIGINS` | Comma-separated exact browser origins allowed by CORS. | Local default is `http://localhost:5173,http://127.0.0.1:5173`. Wildcards are rejected. |
| `ADMIN_BOOTSTRAP_EMAILS` | Comma-separated `email` or `email:Display Name` entries promoted to admin on startup. | `application.properties` contains project defaults; `.env.example` contains an example admin email. |
| `ADMIN_SUPERUSER_EMAILS` | Comma-separated addresses of administrators that may also moderate other administrator accounts. | Must already be administrators; this list does not create them. Defaults to `u-kisi4@student.kit.edu`. Not a role: these accounts still report `ADMIN`. |
| `AUTH_RATE_LIMIT_HMAC_KEY` | HMAC key for rate-limit subject hashes. | Must contain at least 32 characters or startup fails. Treat as secret. |
| `AUTH_OTP_TTL` | OTP lifetime. | Defaults to `PT5M`. |
| `AUTH_ADMIN_SESSION_TTL` | Admin session lifetime. | Defaults to `P1D`. |
| `AUTH_STUDENT_SESSION_TTL` | Student session lifetime. | Defaults to `P365D`. |
| `AUTH_RATE_LIMIT_WINDOW` | Rate-limit window. | Defaults to `PT15M`. |
| `AUTH_RATE_LIMIT_REQUEST_EMAIL` | OTP request limit per email. | Defaults to `3`. |
| `AUTH_RATE_LIMIT_REQUEST_IP` | OTP request limit per IP. | Defaults to `20`. |
| `AUTH_RATE_LIMIT_LOGIN_EMAIL` | Login failure limit per email. | Defaults to `10`. |
| `AUTH_RATE_LIMIT_LOGIN_IP` | Login failure limit per IP. | Defaults to `30`. |
| `SPRING_MAIL_HOST` | SMTP host. | Defaults to `localhost`. |
| `SPRING_MAIL_PORT` | SMTP port. | Defaults to `25`; `.env.example` and CI use `587` as the deployment example/default. |
| `SPRING_MAIL_USERNAME` | SMTP username. | Defaults to empty. Treat as secret when used. |
| `SPRING_MAIL_PASSWORD` | SMTP password. | Defaults to empty. Treat as secret when used. |
| `SPRING_MAIL_SMTP_AUTH` | SMTP authentication toggle. | Defaults to `false`; CI staging defaults to `true`. |
| `SPRING_MAIL_STARTTLS` | SMTP STARTTLS toggle. | Defaults to `false`; CI staging defaults to `true`. |
| `MAIL_FROM_ADDRESS` | Sender email address. | Defaults to `no-reply@localhost`. |
| `MAIL_FROM_NAME` | Sender display name. | Defaults to `RateMyProfApp`. |
| `IPINFO_TOKEN` | IPinfo lookup token for login-location emails. | Empty value reports location as unknown. Treat as secret when set. |
| `GEOAPIFY_API_KEY` | Geoapify static map API key for login-location emails. | Empty value skips static map generation. Treat as secret when set. |
| `AUDIT_REVERT_WINDOW` | Time window for reverting administrative field edits. | Defaults to `P7D`. |
| `GITLAB_BASE_URL` | GitLab instance base URL for issue creation. | Empty value disables the integration. |
| `GITLAB_PROJECT_ID` | GitLab project id/path for issue creation. | Empty value disables the integration. |
| `GITLAB_TOKEN` | GitLab API token for issue creation. | Empty value disables the integration. Treat as secret. |
| `GITLAB_TIMEOUT` | GitLab connect/read timeout. | Defaults to `PT10S`. |

Notes:

- `ADMIN_FRONTEND_ORIGINS` must include the exact scheme, host, and port of each
  Admin Web origin.
- A CORS mismatch causes `403 Invalid CORS request` before controller logic runs.
- With any required `GITLAB_*` value empty, `GET /system/status` reports
  `gitlabEnabled:false` and issue creation returns 503.

### GitLab CI/CD Variables

Deployment and scheduled maintenance jobs use these custom CI/CD variables:

| Variable | Purpose |
| --- | --- |
| `SSH_PRIVATE_KEY` | SSH key file used by the CI job for deployment. |
| `DEPLOY_HOST` | Deployment host. |
| `DEPLOY_PORT` | SSH port for the deployment host. |
| `DEPLOY_USER` | SSH user for the deployment host. |
| `DEPLOY_PATH` | Directory created and entered on the deployment host. Must be absolute: the value is used over SSH, where a relative path resolves against the login directory. The deploy job prepends a missing leading slash and says so in its log. |
| `BACKEND_PUBLISHED_PORT` | Optional host port for the Compose-managed backend. Defaults to `8080`. |
| `SPRING_DATASOURCE_URL` | Optional override for the deployed container datasource URL. |
| `SPRING_DATASOURCE_USERNAME` | Optional override for the deployed container datasource username. |
| `SPRING_DATASOURCE_PASSWORD` | Deployed container datasource password. Secret. |
| `SPRING_FLYWAY_ENABLED` | Optional override for Flyway startup migrations. Defaults to `true` in CI. |
| `SPRING_FLYWAY_BASELINE_ON_MIGRATE` | Optional override for initial baselining of pre-Flyway databases. Defaults to `false` in CI. |
| `ADMIN_FRONTEND_ORIGINS` | Optional override for allowed frontend origins. |
| `ADMIN_BOOTSTRAP_EMAILS` | Optional override for admin bootstrap accounts. |
| `ADMIN_SUPERUSER_EMAILS` | Optional override for the administrators that may moderate other administrators. |
| `AUTH_RATE_LIMIT_HMAC_KEY` | Required deployed rate-limit HMAC key. Secret. |
| `SPRING_MAIL_HOST` | SMTP host. |
| `SPRING_MAIL_PORT` | SMTP port. |
| `SPRING_MAIL_USERNAME` | SMTP username. Secret when used. |
| `SPRING_MAIL_PASSWORD` | SMTP password. Secret. |
| `SPRING_MAIL_SMTP_AUTH` | SMTP authentication toggle. |
| `SPRING_MAIL_STARTTLS` | SMTP STARTTLS toggle. |
| `MAIL_FROM_ADDRESS` | Sender email address. |
| `MAIL_FROM_NAME` | Sender display name. |
| `IPINFO_TOKEN` | Optional IPinfo token. Secret when set. |
| `GEOAPIFY_API_KEY` | Optional Geoapify API key. Secret when set. |
| `AUDIT_REVERT_WINDOW` | Optional audit revert window override. |
| `GITLAB_BASE_URL` | Optional GitLab instance base URL for issue creation. |
| `GITLAB_PROJECT_ID` | Optional GitLab project id/path for issue creation. |
| `GITLAB_TOKEN` | Optional GitLab API token for issue creation. Secret when set. |
| `GITLAB_TIMEOUT` | Optional GitLab timeout override. Defaults to `PT10S`. |
| `BACKUP_PASSPHRASE` | Required by scheduled `backup:offsite`. Used to encrypt database backup artifacts before upload. Secret; configure as a masked CI/CD variable. |

GitLab built-in variables used by the pipeline include `CI_REGISTRY`,
`CI_REGISTRY_USER`, `CI_REGISTRY_PASSWORD`, `CI_REGISTRY_IMAGE`,
`CI_COMMIT_SHORT_SHA`, `CI_COMMIT_BRANCH`, `CI_DEFAULT_BRANCH`, and merge request
variables.

## Required Ports

| Port or variable | Direction | Purpose | Confirmed source |
| --- | --- | --- | --- |
| `8080` | Inbound to backend container/app | Backend HTTP server. Dockerfile exposes it, Compose publishes it, and CI deploy maps it. | `application.properties`, `src/Dockerfile`, `docker-compose.yml`, `.gitlab-ci.yml` |
| `5432` | Inbound to PostgreSQL | Local Compose publishes PostgreSQL. CI staging defaults the backend datasource to `host.docker.internal:5432`. | `application.properties`, `docker-compose.yml`, `.gitlab-ci.yml` |
| `5173` | Browser origin | Local Admin Web origins in CORS defaults. | `application.properties`, `.env.example`, `CorsConfig` |
| `25` | Outbound from backend | Default SMTP port. | `application.properties` |
| `587` | Outbound from backend | SMTP port used in `.env.example` and CI staging default. | `.env.example`, `.gitlab-ci.yml` |
| `DEPLOY_PORT` | Inbound SSH to server | CI deployment SSH port. | `.gitlab-ci.yml` |

The repository references the BW Cloud/staging HTTPS URL
`https://server.example.org` for the
default Admin Web origin and scheduled health check.

## Build Instructions

### Backend JAR

Run the full Maven verification build:

```bash
./mvnw verify
```

The Maven project artifact is `demo` version `0.0.1-SNAPSHOT`, so a package
build produces a jar under `target/`.

The Dockerfile builds the jar with:

```bash
./mvnw clean package -DskipTests
```

The runtime image starts it with:

```bash
java -jar app.jar
```

### Local Docker Compose Stack

Validate the Compose file:

```bash
docker compose config
```

Start the local backend and PostgreSQL stack:

```bash
docker compose up --build -d
```

Stop and remove the local stack:

```bash
docker compose down --remove-orphans
```

`docker-compose.yml` is the local development stack. It builds the backend image
from `src/Dockerfile`, starts `postgres:16`, waits for PostgreSQL health, and
publishes backend port `8080` and PostgreSQL port `5432`.

`scripts/docker-smoke-test.sh` runs `docker compose config`, starts the stack,
checks `GET /health`, and tears the stack down on exit.

### Production Docker Compose Stack

`docker-compose.prod.yml` is the production deployment stack used by CI. It
keeps PostgreSQL outside Compose and manages only the backend application
container:

- Service: `backend`
- Container name: `app-server`
- Image: `${BACKEND_IMAGE}`, set by CI to
  `$CI_REGISTRY_IMAGE/server:$CI_COMMIT_SHORT_SHA`
- Restart policy: `unless-stopped`
- Published port: `${BACKEND_PUBLISHED_PORT:-8080}:${SERVER_PORT:-8080}`
- Host gateway: `host.docker.internal:host-gateway`
- Health check: `GET /health` inside the container
- Volumes: none

The production Compose service receives the same application environment
variables documented above. `SPRING_DATASOURCE_PASSWORD` and
`AUTH_RATE_LIMIT_HMAC_KEY` are required; optional integrations stay disabled when
their variables are empty.

## Database Setup and Schema Management

### Local Database

`docker-compose.yml` defines a local PostgreSQL service:

- Image: `postgres:16`
- Database name: `postgres`
- User: `postgres`
- Published port: `5432`
- Persistent volume: `postgres-data`
- Health check: `pg_isready -U postgres -d postgres`

The backend service in Compose connects to PostgreSQL at
`jdbc:postgresql://postgres:5432/postgres`.

### Deployed Database

The CI deployment starts the backend through `docker-compose.prod.yml` and passes
the datasource configuration through environment variables. PostgreSQL remains a
host or externally managed service, not a production Compose service. The
deployment job defaults the datasource URL to:

```text
jdbc:postgresql://host.docker.internal:5432/postgres
```

The deployed Compose service includes:

```text
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### Schema Management

The runtime schema is managed by Flyway. Production migrations live under:

```text
src/main/resources/db/migration/postgresql
```

Test migrations for H2 live under:

```text
src/test/resources/db/migration/h2
```

The first migration, `V1__existing_schema_baseline.sql`, creates the current
schema for fresh databases. Existing non-empty databases from the pre-Flyway
period are baselined at version `1` on first startup. Flyway records applied
migrations in `flyway_schema_history`.

Hibernate no longer changes the schema at runtime:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

Startup fails if the Flyway-managed schema does not match the current JPA
entities. Before deploying against an existing database, take a database backup.

The deployed database was baselined on 2026-09-05 and has a `flyway_schema_history`
table, so CI writes `SPRING_FLYWAY_BASELINE_ON_MIGRATE=false`. A deployment aimed at a
database that has a schema but no history now fails instead of silently declaring that
schema to be version `1`. Set the variable back to `true` only for the single deployment
that adopts a new pre-Flyway database, then remove it again.

## Deployment to BW Cloud or Staging

The confirmed deployment path is the manual GitLab CI job
`server:deploy:staging`, available on the `main` branch for non-scheduled
pipelines.

The job:

1. Uses the image produced by `server:package`:
   `$CI_REGISTRY_IMAGE/server:$CI_COMMIT_SHORT_SHA`.
2. Installs `openssh-client` in an Alpine 3.20 CI image.
3. Uses `SSH_PRIVATE_KEY`, `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, and
   `DEPLOY_PATH` to connect to the target server.
4. Creates `$DEPLOY_PATH` on the server.
5. Copies `docker-compose.prod.yml` to `$DEPLOY_PATH/docker-compose.yml`.
6. Writes the deployment `.env` file from CI/CD variables.
7. Logs in to the GitLab Container Registry on the server.
8. Confirms `docker compose` is available on the server.
9. Pulls the image tag for the current commit through Compose.
10. Removes the legacy standalone `app-server` container if present, so the
    first Compose deployment can claim the same container name.
11. Starts or replaces the detached Compose service with
    `docker compose up -d --remove-orphans`. Flyway runs before the backend
    starts serving requests.
12. Polls `http://localhost:8080/health` inside the Compose service up to 30
    times. The health endpoint checks database reachability and verifies that
    Flyway has no failed or pending migrations.
13. Prints recent Compose service logs and fails the job if health never
    succeeds.

The deployment job defaults `ADMIN_FRONTEND_ORIGINS` to the BW Cloud/staging URL
used elsewhere in the repository and defaults the datasource URL to the Docker
host gateway PostgreSQL address listed above.

## CI/CD Pipeline Usage

The GitLab pipeline is defined in `.gitlab-ci.yml`.

Pipeline sources:

- Push pipelines
- Merge request pipelines
- Scheduled pipelines

Stages:

- `test`
- `package`
- `deploy`

Jobs:

| Job | When it runs | What it does |
| --- | --- | --- |
| `server:test` | Push and merge request pipelines | Runs `./mvnw verify`, then `java scripts/CheckChangedCoverage.java --threshold "$COVERAGE_THRESHOLD"`. Publishes JUnit and JaCoCo artifacts. |
| `server:postgres-migration-smoke` | Push and merge request pipelines | Starts the Spring Boot app test context against a `postgres:16` CI service, checks `/health`, and exercises the PostgreSQL Flyway migrations from `src/main/resources/db/migration/postgresql`. |
| `server:package` | `main` branch, non-scheduled pipelines | Uses Kaniko to build `src/Dockerfile` and push `$CI_REGISTRY_IMAGE/server:$CI_COMMIT_SHORT_SHA`. |
| `server:deploy:staging` | Manual job on `main`, non-scheduled pipelines | SSHes to the deployment host and replaces the Compose-managed `backend` service. |
| `health:check` | Scheduled pipelines only | Curls the configured BW Cloud/staging `/health` URL and expects HTTP 200. |
| `backup:offsite` | Scheduled pipelines only | Copies the newest server-side PostgreSQL dump, verifies it, encrypts it with `BACKUP_PASSPHRASE`, and stores only the encrypted `.gpg` artifact. |

The changed-code coverage threshold is configured as `COVERAGE_THRESHOLD: "30"`.

Scheduled `backup:offsite` is expected to fail when `BACKUP_PASSPHRASE` is not
configured. This prevents CI from uploading a readable dump that contains real
student email addresses.

## Verifying a Successful Deployment

Use the checks that are explicitly supported by the source and CI configuration:

1. Confirm the backend health endpoint:

   ```bash
   curl -fsS http://localhost:8080/health
   ```

   Expected response:

   ```json
   {"message":"API healthy","success":true}
   ```

   In CD this is the migration gate: the endpoint fails when the database is
   unreachable, when Flyway reports a failed migration, when Flyway has pending
   migrations, or when no migration has been applied or baselined.

2. For the BW Cloud/staging URL referenced by CI, confirm:

   ```bash
   curl -fsS https://server.example.org/health
   ```

3. For an authenticated admin deployment, use `GET /system/status` from the
   Admin Web or an authenticated client. It reports overall status, database
   reachability, counts, last write metadata, and `gitlabEnabled`.

4. Verify CORS for the Admin Web origin:

   ```bash
   curl -i -X POST -H "Origin: <panel origin>" -H "Content-Type: application/json" -d '{"email":"nobody@example.invalid"}' <api base>/auth/request-login
   ```

   `400 Invalid KIT email` means the origin was accepted and the request reached
   controller validation. `403 Invalid CORS request` means the origin is not in
   `ADMIN_FRONTEND_ORIGINS`.

5. Check recent deployment logs. The CI deployment job prints the last 100 lines
   after a successful health check and the last 200 lines after a failed health
   check.

6. When you have direct database access, inspect Flyway's migration history:

   ```sql
   select installed_rank, version, description, type, success
   from flyway_schema_history
   order by installed_rank;
   ```

   On existing databases adopted by Flyway, version `1` may appear as a
   `BASELINE` row. On fresh databases, version `1` appears as a normal SQL
   migration. Future schema changes should appear as `V2`, `V3`, and so on.

## Updating and Restarting

### Through CI

The confirmed update path is:

1. Merge or push the desired commit to `main`.
2. Let `server:test` and `server:package` run.
3. Start the manual `server:deploy:staging` job.
4. Wait for the job's `/health` polling loop to succeed. If Flyway migration or
   Hibernate schema validation fails, the backend does not become healthy and
   the deployment job fails.

The deployment job updates the Compose-managed `backend` service from the
current commit image tag. The first Compose deployment removes the previous
standalone `app-server` container so the Compose service can reuse the existing
container name.

### Local Docker Compose

Rebuild and restart the local stack:

```bash
docker compose up --build -d
```

Stop the local stack:

```bash
docker compose down --remove-orphans
```

Inspect local container state and logs:

```bash
docker compose ps
docker compose logs backend
```

## Basic Troubleshooting

| Symptom | Confirmed cause or check |
| --- | --- |
| Application fails during startup with `AUTH_RATE_LIMIT_HMAC_KEY must contain at least 32 characters` | Set `AUTH_RATE_LIMIT_HMAC_KEY` to an unpredictable value with at least 32 characters. |
| Browser requests fail with `403 Invalid CORS request` | Set `ADMIN_FRONTEND_ORIGINS` to the exact Admin Web origin, including scheme and port. Wildcards are rejected. |
| `GET /health` returns 503 | The backend could not run `SELECT 1` against the configured database, or Flyway reports failed/pending migrations. Check datasource URL, username, password, PostgreSQL reachability, migration logs, `flyway_schema_history`, and port `5432`. |
| `GET /system/status` reports database down or degraded | The database probe or follow-up reads failed. Check database availability and backend logs. |
| GitLab issue creation returns 503 | `GITLAB_BASE_URL`, `GITLAB_PROJECT_ID`, or `GITLAB_TOKEN` is unset, so the integration is disabled. |
| GitLab issue creation returns bad gateway | The backend could not reach GitLab or GitLab did not return the expected issue payload. Check `GITLAB_BASE_URL`, token permissions, network access, and `GITLAB_TIMEOUT`. |
| Admin API rejects every caller | `ADMIN_BOOTSTRAP_EMAILS` may be empty. The startup runner logs a warning when no administrator emails are configured. |
| `scripts/docker-smoke-test.sh` fails | The script checks `GET /health`, the same endpoint used by the Dockerfile, CI deploy, and scheduled CI health checks. Check PostgreSQL reachability first because `/health` performs `SELECT 1`. |
