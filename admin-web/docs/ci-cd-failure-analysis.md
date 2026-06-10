# CI/CD Failure Analysis and Fixes

This document records the CI/CD problems that were blocking the pipeline, why they mattered, and how they were fixed.

## Verification

The project now passes the same checks used by the pipeline:

```bash
npm run lint
npm run test
npm run build
```

Current result:

- `npm run lint` passes.
- `npm run test` passes and runs TypeScript project type checking.
- `npm run build` passes and produces the Vite production output in `dist/`.

## 1. Unused destructured password alias

Original location: `src/api/auth.ts`

Original issue:

```ts
const { password: _, ...user } = match
```

This removed `password` from the returned user object, but it created an unused local variable. ESLint correctly rejected it with `@typescript-eslint/no-unused-vars`.

### Why it mattered

Unused variables create review noise and make intent less explicit. In authentication code, the handling of secret fields should be obvious because mistakes can leak sensitive data.

### Fix

The returned user object is now built explicitly from safe fields:

```ts
const user = {
  id: match.id,
  name: match.name,
  email: match.email,
  role: match.role,
}
```

This avoids the unused variable and makes the security boundary clear.

## 2. Stubbed report status update ignored its inputs

Original location: `src/api/feedback.ts`

Original issue:

```ts
export async function updateReportStatus(_id: number, _status: ReportStatus): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))
}
```

The function accepted an id and status but ignored both.

### Why it mattered

A function should do what its name and signature promise. Ignoring parameters creates fake success behavior: UI code may believe a status was updated when no data changed.

### Fix

The mock implementation now finds the report by id, throws if it does not exist, and updates the status when found. `getReports` also returns a shallow copy so callers do not accidentally mutate the mock data source directly.

## 3. Stubbed user deletion ignored the user id

Original location: `src/api/users.ts`

Original issue:

```ts
export async function deleteUser(id: number): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))
}
```

This failed both ESLint and TypeScript because `noUnusedParameters` is enabled.

### Why it mattered

The function promised to delete a specific user but did not use the identifier. That is a correctness issue, not just a formatting issue. It also blocked both the `check` and `build` stages.

### Fix

The mock user list is now updated by filtering out the matching id. If no user exists for that id, the function throws an error instead of silently pretending success.

## 4. `AuthContext.tsx` mixed component and non-component exports

Original location: `src/context/AuthContext.tsx`

Original issue:

```ts
export function AuthProvider(...) { ... }
export function useAuth() { ... }
```

React Fast Refresh expects component modules to export only components. The file exported both the provider component and the `useAuth` hook, so ESLint rejected it via `react-refresh/only-export-components`.

### Why it mattered

Fast Refresh depends on predictable module boundaries to preserve component state correctly during development. Mixing component and non-component exports can cause inconsistent hot reload behavior and makes module responsibilities less clear.

### Fix

The auth code is now split by responsibility:

- `src/context/AuthContext.tsx` exports `AuthProvider` only.
- `src/context/AuthContextValue.ts` owns the shared context and auth types.
- `src/context/useAuth.ts` exports the `useAuth` hook.

Consumers now import the hook from `src/context/useAuth.ts`.

## 5. Placeholder CI test job

Original issue:

```yaml
web:test:
  script:
    - echo "No test script configured; skipping tests."
```

The test stage existed but did not validate anything.

### Why it mattered

A pipeline stage that always succeeds can create false confidence. Even if the project does not yet have behavioral tests, the stage should still run a meaningful verification command.

### Fix

`package.json` now includes:

```json
"typecheck": "tsc -b",
"test": "npm run typecheck"
```

The GitLab CI `web:test` job now runs:

```bash
npm run test
```

This is not a replacement for future unit or integration tests, but it makes the current test stage enforce a real quality gate without adding new dependencies.

## Current pipeline state

| Stage | Command | Current status |
| --- | --- | --- |
| `check` | `npm run lint` | Passes |
| `test` | `npm run test` | Passes |
| `build` | `npm run build` | Passes |
| `package` | `npm run build` then archive | Should pass after build succeeds |

## Remaining recommendation

The project still does not have behavioral tests. The next engineering improvement should be adding Vitest and React Testing Library tests for authentication, protected routing, and the user/report workflows. That would catch UI regressions that linting and type checking cannot detect.
