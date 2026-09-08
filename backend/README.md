# Backend

The server behind a KIT lecture-rating app: students rate lectures and professors, ask and
answer questions, and report content; administrators moderate all of it through a separate
admin panel. Spring Boot 4 on Java 21, PostgreSQL with Flyway migrations.

The API is split in two. `/auth/**` and the app routes serve the Android client and hand out
year-long sessions; `/admin/**` serves the admin panel and hands out one-day sessions. Which
session you get is decided by the endpoint you called, not by whether your account is an
administrator — see [docs/admin-api.md](docs/admin-api.md).

## Build and test

```bash
./mvnw verify
```

`verify`, not `test`: the JaCoCo coverage gate (`jacoco:check`) runs in the `verify` phase, and
`test` alone will not enforce it. **The local build needs no Docker.** The suite runs against
in-memory H2, and the tests that require a real PostgreSQL skip themselves unless
`POSTGRES_SMOKE_JDBC_URL` is set — CI provides it through a `postgres:16` service.

The suite has four layers: unit, API/role, integration and end-to-end. The last two need a real
PostgreSQL and run in CI; everything else runs anywhere.

To run those PostgreSQL tests locally, point them at any PostgreSQL 16:

```bash
POSTGRES_SMOKE_JDBC_URL=jdbc:postgresql://localhost:5432/postgres \
POSTGRES_SMOKE_USERNAME=postgres POSTGRES_SMOKE_PASSWORD=your-password \
./mvnw -Dtest='*PostgresTests,PostgreSqlMigrationSmokeTests' test

# the end-to-end journeys, which need their own Spring context and so their own run
POSTGRES_SMOKE_JDBC_URL=jdbc:postgresql://localhost:5432/postgres \
POSTGRES_SMOKE_USERNAME=postgres POSTGRES_SMOKE_PASSWORD=your-password \
./mvnw -Dtest=EndToEndJourneyTests test
```

They drop and recreate the `public` schema, so give them a database you do not mind losing.

### Coverage

Bundle line coverage is gated in two tiers, and both numbers live in `.gitlab-ci.yml`:

| Tier | Value | Effect |
| --- | --- | --- |
| `COVERAGE_LINE_MIN` | 90% | Mandatory. Below it the build fails, locally and in CI. |
| `COVERAGE_LINE_TARGET` | 95% | Advisory. Below it `coverage:line-target` goes yellow and the pipeline still passes. |

Branch coverage has a single mandatory floor of 88%. The floor in `pom.xml` and
`COVERAGE_LINE_MIN` are kept in step by hand — move one, move the other.

## Running it locally

```bash
docker compose up --build
```

Brings up PostgreSQL 16 and the server on `localhost:8080`, with development credentials
already set in `docker-compose.yml`. `GET /health` answers once Flyway has migrated.

For a deployment rather than a local run, `docker-compose.prod.yml` and `.env.example` are the
starting points, and [docs/deployment.md](docs/deployment.md) is the description.

## Documentation

| File | Holds |
| --- | --- |
| [docs/test-plan.md](docs/test-plan.md) | What is tested, at which layer, and why |
| [docs/test-findings.md](docs/test-findings.md) | What the tests found; every entry ends in a decision |
| [docs/admin-api.md](docs/admin-api.md) | The admin API contract |
| [docs/adminweb-tasks.md](docs/adminweb-tasks.md) | The work list handed to the admin panel repo |
| [docs/deployment.md](docs/deployment.md) | Pipeline, CI/CD variables, deployment |
| [docs/TODO.md](docs/TODO.md) | Team working notes |
| [CHANGELOG](CHANGELOG) | Hand-maintained interface changes, newest at the bottom |

The OpenAPI schema is generated from the controllers rather than written by hand, and is served
at `/v3/api-docs` to authenticated administrators.
