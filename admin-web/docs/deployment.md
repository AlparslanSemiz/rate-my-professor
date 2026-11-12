# Deployment Guide

This guide documents deployment behavior confirmed by this repository for the
Admin Web React/Vite single-page application.

## Project Scope

This repository owns only the administrator browser application. It does not
own the backend API, PostgreSQL database, Android application, TLS certificates,
DNS, or the host reverse proxy.

Confirmed repository contents:

- React, TypeScript, and Vite source in `src/`
- npm scripts and lockfile in `package.json` and `package-lock.json`
- Vite configuration in `vite.config.ts`
- development environment defaults in `.env`
- a multi-stage production `Dockerfile`
- Nginx runtime configuration template in `docker/nginx.prod.conf.template`
- GitLab CI/CD configuration in `.gitlab-ci.yml`
- an optional SSH/Docker deployment helper in `scripts/deploy-prod.ps1`

## Prerequisites

| Tool or runtime | Confirmed version or usage |
| --- | --- |
| Node.js | CI and the Docker build use `node:24-alpine`. |
| npm | CI runs `npm ci --cache .npm --prefer-offline`. |
| Vite | `package.json` uses Vite 8. |
| TypeScript | `package.json` uses TypeScript 6. |
| Docker | Used for the production image and deployment host container. |
| Nginx | The production runtime image is `nginx:1.29-alpine`. |
| Kaniko | CI builds the production image with `gcr.io/kaniko-project/executor:debug`. |
| GitLab Container Registry | Stores commit-tagged and `latest` Admin Web images built by CI. |
| GitLab CI/CD | The pipeline is defined in `.gitlab-ci.yml`. |
| OpenSSH client and curl | Used by the manual CI deployment job. |

The deployment host must have Docker available. The repository does not include
the host reverse-proxy configuration that exposes the container publicly.

## System Components

| Component | Role | Confirmed source |
| --- | --- | --- |
| Admin Web SPA | Browser application for login, dashboard, users, content moderation, bug reports, catalogue editing, and audit logs. | `src/`, `README.md` |
| API client | Sends JSON requests to `VITE_API_BASE_URL`; attaches bearer tokens after login. | `src/api/ApiClient.ts` |
| Vite dev proxy | Forwards local `/api/*` requests to `VITE_API_TARGET` and rewrites the path. | `vite.config.ts`, `.env` |
| Production image | Builds static files and serves them from Nginx under `VITE_BASE_PATH`. | `Dockerfile`, `docker/nginx.prod.conf.template` |
| GitLab CI/CD | Runs checks, tests, builds static assets, builds the Docker image, and deploys the image manually from `main`. | `.gitlab-ci.yml` |
| Production container | Runtime container named `admin-web-prod`, published only on loopback. | `.gitlab-ci.yml`, `scripts/deploy-prod.ps1` |

## Backend API Contract Used By The Panel

The backend repository's admin API guide is the authoritative contract. This
panel currently calls these backend path groups:

| Area | Paths |
| --- | --- |
| Auth | `/auth/request-login`, `/auth/login`, `/auth/logout`, `/auth/me` |
| Users | `/users`, `/users/:id`, `/users/:id/block`, `/users/:id/unblock`, `/users/:id/warnings`, `/users/:id/warnings/:warningId` |
| Comments | `/comments`, `/comments/:id`, `/comments/reported`, `/comments/reported/:id` |
| Answers | `/answers`, `/answers/:id`, `/answers/reported`, `/answers/reported/:id` |
| Catalogue | `/data/lectures`, `/data/lectures/:id`, `/data/professor`, `/data/professor/:id` |
| Ratings | `/ratings`, `/ratings/:id` |
| Bug reports | `/reports`, `/reports/:id`, `/reports/:id/gitlab-issue` |
| Logs | `/audit-logs`, `/audit-logs/meta`, `/audit-logs/:id/revert` |
| Status | `/system/status` |

Changing the backend API can break the panel even when the static deployment
itself succeeds. Keep backend changes compatible or update this panel and the
backend together.

## Configuration

Vite environment values are read when the dev server starts or when the
production bundle is built. Values baked into the static bundle cannot be
changed by restarting the container; rebuild the image when they change.

| Variable | Read by | Current default or CI value |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Browser bundle | `.env` uses `/api` for local development. **CI builds with an empty value**, so the deployed panel calls its own origin. |
| `VITE_API_TARGET` | Vite dev server only | `.env` points the `/api` proxy at `https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org`. |
| `VITE_BASE_PATH` | Vite build and Nginx runtime template | CI sets `/admin/`. The Vite dev server serves from `/`. |
| `PUBLIC_URL` | GitLab environment metadata | Used as the GitLab environment URL for `web:deploy`; does not configure the built app. |

Do not put secrets in frontend environment variables. Every `VITE_*` value is
visible to browsers in the built JavaScript.

For local development, `.env` configures the browser to call `/api` and the Vite
dev server to proxy that path to the configured backend:

```env
VITE_API_BASE_URL=/api
VITE_API_TARGET=https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org
```

If `VITE_API_BASE_URL` is set to an absolute backend URL in development, the
backend must allow the exact local origin in `ADMIN_FRONTEND_ORIGINS`; otherwise
browser requests fail during CORS preflight.

## Required Ports

| Port or variable | Direction | Purpose | Confirmed source |
| --- | --- | --- | --- |
| `80` | Inside `admin-web-prod` | Nginx serves the static app. | `Dockerfile` |
| `WEB_PORT`, default `8081` | Loopback on deployment host | Host port mapped to container port 80 as `127.0.0.1:${WEB_PORT:-8081}:80`. | `.gitlab-ci.yml`, `scripts/deploy-prod.ps1` |
| `DEPLOY_PORT`, default `22` | Inbound SSH to deployment host | Used by CI for host-key scan and remote Docker commands. | `.gitlab-ci.yml` |
| `443` | Browser to public host | Expected public HTTPS entrypoint for `/admin/`; reverse-proxy configuration is outside this repository. | Deployment overview and CI URLs |

The container is intentionally published on `127.0.0.1`, so public traffic must
come through the host reverse proxy.

## Build Instructions

Install dependencies:

```bash
npm ci
```

Run local checks:

```bash
npm run lint
npm run typecheck
npm run test
```

Run the combined check command:

```bash
npm run check
```

Build static production files:

```bash
npm run build
```

The build output is written to `dist/`.

Start the local Vite dev server:

```bash
npm run dev
```

Preview a local production build:

```bash
npm run preview
```

## Production Image

Build the production image locally:

```bash
docker build --target web-prod \
  --build-arg VITE_API_BASE_URL= \
  --build-arg VITE_BASE_PATH=/admin/ \
  -t admin-web-prod:local .
```

Run it like the deployment job does:

```bash
docker rm -f admin-web-prod
docker run -d --name admin-web-prod --restart unless-stopped \
  -p 127.0.0.1:8081:80 admin-web-prod:local
```

Verify the container:

```bash
curl -fsS http://127.0.0.1:8081/admin/
curl -fsS http://127.0.0.1:8081/admin/login
curl -fsS http://127.0.0.1:8081/healthz
```

The Nginx template:

- serves static files from `/usr/share/nginx/html${VITE_BASE_PATH}`;
- caches `${VITE_BASE_PATH}assets/` with immutable long-lived headers;
- serves `${VITE_BASE_PATH}index.html` with `no-store`;
- falls back to `index.html` for client-side routes below `VITE_BASE_PATH`;
- exposes an unprefixed `/healthz` endpoint for container checks.

## Deployment To The Shared Host

The confirmed CI deployment path is the manual `web:deploy` job on `main`.

### CI image build

`web:image`:

1. Runs after `web:build` stage jobs are available in the pipeline.
2. Uses Kaniko, not Docker-in-Docker.
3. Builds the `web-prod` Docker target.
4. Passes `VITE_API_BASE_URL` and `VITE_BASE_PATH` as Docker build arguments.
5. Pushes two tags:
   - `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA`
   - `$CI_REGISTRY_IMAGE:latest`

### The end-to-end job

`web:e2e` is `when: manual` and `allow_failure: true`, so it does not run on a push and
cannot block anything. It needs no backend — it serves the panel from the in-browser
mock — but it runs on `mcr.microsoft.com/playwright:v1.63.0-noble` rather than the
Alpine image the other jobs share, so it pays for that image and a second `npm ci`
before it starts. Start it from the pipeline view when a browser-level check is wanted;
`npm run test:e2e` is the same suite locally.

### CI deployment

`web:deploy`:

1. Runs manually on `main` and is marked `allow_failure: true`.
2. Requires `web:image`.
3. Installs `openssh-client` and `curl` in `alpine:3.22`.
4. Requires `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY`,
   `CI_DEPLOY_USER`, and `CI_DEPLOY_PASSWORD`.
5. Uses `DEPLOY_PORT`, defaulting to `22`.
6. Logs in to the GitLab Container Registry on the deployment host.
7. Pulls `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA`.
8. Removes any existing `admin-web-prod` container.
9. Starts the new container with:

   ```bash
   docker run -d --name admin-web-prod --restart unless-stopped \
     -p 127.0.0.1:${WEB_PORT:-8081}:80 "$IMAGE"
   ```

10. Checks `http://127.0.0.1:${WEB_PORT:-8081}${VITE_BASE_PATH}` and expects
    HTTP 200.
11. Runs `docker image prune -f`.
12. Logs out of the registry.

The job records a GitLab environment named `production` with URL `$PUBLIC_URL`.
That name is CI metadata; the backend CI job currently uses the word `staging`
for the same shared host.

## Manual Deployment Helper

`scripts/deploy-prod.ps1` is an optional PowerShell path that builds directly on
the remote Docker daemon over SSH:

```powershell
pwsh scripts/deploy-prod.ps1
```

Defaults:

| Parameter | Default |
| --- | --- |
| `SshHost` | `sose2026-android2` |
| `ApiBaseUrl` | `https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org` |
| `BasePath` | `/admin/` |
| `Port` | `8081` |
| `PublicUrl` | `https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org/admin/` |

The script builds the same `web-prod` image, restarts `admin-web-prod`, checks
the loopback container URL, prunes old images, and checks the public URL.

## CI/CD Pipeline Usage

The GitLab pipeline runs only for push pipelines.

Stages:

- `check`
- `test`
- `build`
- `image`
- `deploy`

Jobs:

| Job | When it runs | What it does |
| --- | --- | --- |
| `web:check` | Push pipelines | Runs `npm run lint` and `npm run typecheck`. |
| `web:test` | Push pipelines | Runs `npm run test`. |
| `web:build` | Push pipelines | Runs `npm run build` and publishes `dist/` as a one-week artifact. |
| `web:image` | `main` branch push pipelines | Builds and pushes the `web-prod` Docker image through Kaniko. |
| `web:deploy` | Manual job on `main` branch push pipelines | Pulls the commit image on the deployment host and replaces `admin-web-prod`. |

The shared Node job template:

- uses `node:24-alpine`;
- caches `.npm/` with key `npm-${CI_COMMIT_REF_SLUG}`;
- runs `npm ci --cache .npm --prefer-offline`.

## Verifying A Successful Deployment

After `web:deploy` succeeds, verify:

```bash
curl -fsS https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org/admin/
curl -fsS https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org/admin/login
```

In a browser:

1. Open `/admin/`.
2. Open `/admin/login` directly and confirm the SPA loads instead of a 404.
3. Confirm network requests use the backend URL baked into the build.
4. Sign in with an administrator account.
5. Load `/system/status` through the dashboard.
6. Complete a non-destructive admin workflow.

On the deployment host, the CI job already checks:

```bash
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${WEB_PORT:-8081}/admin/
```

## Updating And Restarting

### Through GitLab CI/CD

1. Push or merge the desired commit to `main`.
2. Let `web:check`, `web:test`, `web:build`, and `web:image` complete.
3. Start the manual `web:deploy` job.
4. Confirm the loopback smoke test passes.
5. Verify `/admin/`, `/admin/login`, and an authenticated backend-backed page.

### Changing build-time values

Rebuild and redeploy the image after changing:

- `VITE_API_BASE_URL`
- `VITE_BASE_PATH`

Restarting the existing container does not change those values in the compiled
JavaScript bundle.

### Rollback

Rollback can use either:

- an older successful pipeline image tagged by commit SHA, then rerun the same
  remote `docker rm` and `docker run` container swap; or
- `scripts/deploy-prod.ps1` from an older compatible commit.

After rollback, repeat the public `/admin/` and `/admin/login` checks plus one
authenticated workflow.

## Database Setup And Migrations

The Admin Web has no database, migration tooling, seed data, or server-side
state in this repository. Database deployment, backups, schema migrations, and
seed data belong to the backend repository and deployment host.

## Basic Troubleshooting

| Symptom | Confirmed cause or check |
| --- | --- |
| App calls the wrong backend | `VITE_API_BASE_URL` was baked in at build time. Rebuild and redeploy the image. Grep the served bundle to see which value shipped: `curl -s https://ratemyprofessor.dev/admin/ \| grep -oE '/admin/assets/[^"]+\.js'`, then grep each for the host. |
| Browser requests fail with CORS errors | The bundle is calling an absolute backend URL instead of its own origin. Rebuild with an empty `VITE_API_BASE_URL`. Adding the origin to the backend's `ADMIN_FRONTEND_ORIGINS` also silences it, but it treats the symptom: same-origin calls never reach the CORS check at all. |
| Local dev server cannot reach the backend | Check `VITE_API_TARGET`; local `/api` requests are proxied there by Vite. |
| Direct navigation to `/admin/login` returns 404 | The request is not reaching the Admin Web Nginx fallback, or `VITE_BASE_PATH` does not match the public path. |
| `/admin/` works but hashed assets 404 | The app was built for a different `VITE_BASE_PATH`, or the reverse proxy strips/preserves the path differently than Nginx expects. |
| `web:image` fails | Check registry credentials and the Kaniko build log. The job builds target `web-prod`. |
| `web:deploy` fails before SSH | Confirm `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY`, `CI_DEPLOY_USER`, and `CI_DEPLOY_PASSWORD` are configured. |
| `web:deploy` smoke test fails | SSH to the host and inspect `docker ps`, `docker logs admin-web-prod`, and `curl http://127.0.0.1:${WEB_PORT:-8081}/admin/`. |
| Public URL fails but loopback smoke test passes | Check the host reverse proxy, TLS, and routing for `/admin/`; those files are outside this repository. |

## Open Questions

1. Should the shared host be labelled staging, production, or both across all
   repositories?
2. Where is the host reverse-proxy configuration version-controlled?
3. Is a cache purge or proxy reload required after deploying a new Admin Web
   image?
4. Which rollback path is preferred for production: older registry image or
   remote rebuild from an older commit?
