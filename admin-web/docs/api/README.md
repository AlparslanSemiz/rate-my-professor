# API contract

`openapi.json` is the backend's own OpenAPI 3 document, produced by springdoc and
committed here unchanged. It is the **authority** on the contract between this
panel and the backend — see [ADR 0008](../adr/0008-generated-schema-is-the-contract-authority.md)
for the order of precedence and why it is that way.

`src/types/api.generated.ts` is generated from this file by `npm run schema:types`
and is not edited by hand. The generator runs through `npx` rather than as a
devDependency: its current release peer-requires TypeScript 5 and this project is on
6, so installing it would need `--force`. See
[ADR 0008](../adr/0008-generated-schema-is-the-contract-authority.md#amendment--what-is-in-place-and-what-is-not). Nothing else in `src/` should restate a request or response shape that this
document already carries.

> **The file is not here yet.** It needs a running backend and an admin token, so
> it cannot be produced from this repository alone. The command below is the whole
> procedure; everything downstream of it is specified in `docs/TODO.md` under
> **P1**.

## Refreshing the schema

The document is served at `/v3/api-docs`, behind `hasRole("ADMIN")` — the backend
locks the JSON, the YAML and the per-group documents separately, so a token is
required for all of them. Run this against whichever backend is authoritative for
the release being documented:

```bash
API=https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org
# or, against a backend you are running yourself:
# API=http://localhost:8080

# 1. Ask for a login code. It arrives by mail.
curl -s -X POST "$API/auth/request-login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"unzhz@student.kit.edu"}'

# 2. Exchange the code for a token.
curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"unzhz@student.kit.edu","loginToken":"<code>"}'
# -> { "authToken": "..." }

# 3. Pull the document.
curl -s "$API/v3/api-docs" \
  -H "Authorization: Bearer <authToken>" > docs/api/openapi.json

# 4. Regenerate the types.
npm run schema:types
```

**Commit the body exactly as it arrives.** Do not pretty-print it, sort its keys
or hand-edit a field that looks wrong: the diff between two pulls is the record of
what the backend changed, and a reformat destroys it. If a field looks wrong, that
is a contract mismatch and belongs in `docs/backend-tasks.md`, not in this file.

Mind the login rate limit while doing this — 3 attempts per address and 20 per IP
in 15 minutes. Two failed pulls can lock you out of a demo.

## What is not in here

The backend repository's `docs/admin-api.md` is a much fuller prose description of
the same API, including behaviour no schema can express — which refusals are `409`
rather than `403`, what `metadata.elevated` means, why `POST /reports` deliberately
does not move under `/admin`. It is the **secondary** source: where the two
disagree, this document wins on shape and `admin-api.md` wins on meaning.
