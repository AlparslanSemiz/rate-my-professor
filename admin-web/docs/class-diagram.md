# Class and package diagrams

Five diagrams rather than one, because they answer different questions and a single
picture of 240 files answers none of them:

1. [Packages and the direction they depend in](#1-packages) — the structure argument.
2. [The API layer](#2-the-api-layer) — the only genuinely class-shaped part.
3. [The domain model](#3-the-domain-model) — the entities and their multiplicities.
4. [A feature in detail: moderation](#4-a-feature-in-detail-moderation) — how a screen is put together.
5. [The shell](#5-the-shell) — routing, session and the authenticated layout.

## Notation

Standard UML, in Mermaid.

| Arrow | Means |
| --- | --- |
| `A --|> B` | **Generalisation.** A is a B. |
| `A ..|> B` | **Realisation.** A implements the interface B. |
| `A --> B` | **Association / navigability.** A holds or uses B. |
| `A *-- B` | **Composition.** B does not exist without A. |
| `A ..> B` | **Dependency.** A refers to B without holding it. |
| `A "1" --> "0..*" B` | Multiplicity on an association. |

Stereotypes are `<<package>>`, `<<interface>>`, `<<abstract>>`, `<<component>>`
(a React function component), `<<hook>>` and `<<module>>` (a file of functions,
not a class).

**No accessors are shown.** Getters and setters are not design. What is listed on a
class is the operations that carry meaning.

Names in the diagrams map to paths under `src/`, with `_` standing in for `/`:
`api_client` is `src/api/client`, `features_moderation` is
`src/features/moderation`, `domain` is `src/domain`.

---

## 1. Packages

The layering rule the codebase actually follows: **a package may depend downward and
sideways within its own layer, never upward.** `src/api` does not know that features
exist; `src/domain`, `src/utils` and `src/theme` import nothing from `@/` at all.

```mermaid
classDiagram
  direction TB

  class features {
    <<package>>
  }
  class layouts {
    <<package>>
  }
  class components {
    <<package>>
  }
  class context {
    <<package>>
  }
  class hooks {
    <<package>>
  }
  class api {
    <<package>>
  }
  class domain {
    <<package>>
  }
  class utils {
    <<package>>
  }
  class theme {
    <<package>>
  }
  class constants {
    <<package>>
  }

  features ..> api
  features ..> domain
  features ..> components
  features ..> context
  features ..> hooks
  features ..> utils
  features ..> constants
  features ..> theme

  layouts ..> features
  layouts ..> context
  layouts ..> components
  layouts ..> constants

  components ..> context
  components ..> constants
  components ..> utils

  context ..> api
  api ..> domain
  api ..> utils

  hooks ..> utils
```

**Nothing points back up, and that is checked rather than claimed.** `src/api` holds
no import of `@/features`, `@/hooks`, `@/components`, `@/layouts` or `@/context`;
`src/domain`, `src/utils` and `src/theme` hold no `@/` import of any kind;
`src/components` holds no import of `@/features`. There are no cycles.

**Two feature-to-feature edges exist**, both one-way:

```mermaid
classDiagram
  direction LR
  class features_comments {
    <<package>>
  }
  class features_moderation {
    <<package>>
  }
  class features_users {
    <<package>>
  }

  features_comments ..> features_moderation : supplies a ModerationApi
  features_moderation ..> features_users : opens UserProfileModal
```

`comments` is a thin binding of two services onto the generic `moderation` screen —
see [diagram 4](#4-a-feature-in-detail-moderation). `moderation` reaches into
`users` for one component: the profile modal an operator opens from a reported
comment's author. Neither edge has a return edge.

### Inside a feature

Every feature is laid out the same way, which is why no diagram is drawn per feature:

| Directory | Holds | Depends on |
| --- | --- | --- |
| `<Feature>Page.tsx` | The screen | its own `hooks/` and `components/` |
| `components/` | Presentation | its own `model/` |
| `hooks/` | Reads, writes and cache keys | `@/api`, its own `model/` |
| `model/` | The feature's rules, as pure functions | `@/domain` only |

`model/` packages re-export explicitly by name — no `export *` — so the surface of a
feature's rules is a written list rather than whatever happens to be exported.

---

## 2. The API layer

One package per backend domain, each behind a barrel. A feature imports
`@/api/catalog`, never a service file.

```mermaid
classDiagram
  direction TB

  namespace api_client {
    class ApiClient {
      +get(path, params) Promise~T~
      +post(path, body) Promise~T~
      +patch(path, body) Promise~T~
      +delete(path) Promise~T~
      +setToken(token)
      +setOnUnauthorized(handler)
    }
    class ApiSession {
      +setToken(token)
      +authorize(headers)
      +expire()
    }
    class ApiRequestBuilder {
      +withQueryString(path, params) string
      +build(path, init) Request
    }
    class ApiResponseParser {
      +parse(response) Promise~T~
    }
    class ApiError {
      +status int
      +reason string
    }
    class HttpService {
      <<abstract>>
      #client ApiClient
    }
  }

  namespace api_moderation {
    class ModerationService~TItem,TReport~ {
      <<abstract>>
      +getAll() Promise
      +update(id, update) Promise
      +delete(id) Promise
      +getReported() Promise
      +updateStatus(id, status) Promise
      +deleteReport(id) Promise
    }
    class ContentService~TItem~ {
      +getAll() Promise
      +update(id, update) Promise
      +delete(id) Promise
    }
    class ReportsService~TReport~ {
      +getReported() Promise
      +updateStatus(id, status) Promise
      +deleteReport(id) Promise
    }
    class CommentsService {
      resource = "comments"
    }
    class AnswersService {
      resource = "answers"
    }
  }

  namespace api_domains {
    class AuthService {
      +requestLoginCode(email) Promise
      +login(email, code) Promise
      +logout() Promise
      +me() Promise~AuthUser~
    }
    class UsersService {
      +list(query) Promise~UserPage~
      +getById(id) Promise~User~
      +update(id, update) Promise
      +delete(id) Promise
      +warn(id, message) Promise
      +getWarnings(id) Promise
    }
    class CatalogService {
      +getLectures() Promise
      +getProfessors() Promise
      +updateLecture(id, update) Promise
      +updateProfessor(id, update) Promise
      +deleteLecture(id) Promise
      +deleteProfessor(id) Promise
    }
    class RatingsService {
      +list(query) Promise~RatingPage~
      +delete(id) Promise
    }
    class FeedbackService {
      +getReports() Promise
      +updateReport(id, update) Promise
      +deleteReport(id) Promise
      +createGitlabIssue(id) Promise
      +isGitlabEnabled() Promise~boolean~
    }
    class AuditLogsService {
      +getLogs(filters) Promise~LogPage~
      +getLogs(filters, cursor) Promise~LogPage~
      +getMeta() Promise~LogMeta~
      +revert(id) Promise
    }
    class SystemStatusService {
      +getStatus() Promise~SystemStatus~
    }
  }

  ApiClient *-- ApiSession
  ApiClient *-- ApiRequestBuilder
  ApiClient *-- ApiResponseParser
  ApiResponseParser ..> ApiError : throws
  HttpService --> ApiClient

  AuthService --|> HttpService
  UsersService --|> HttpService
  CatalogService --|> HttpService
  RatingsService --|> HttpService
  FeedbackService --|> HttpService
  AuditLogsService --|> HttpService
  SystemStatusService --|> HttpService
  ModerationService --|> HttpService

  ModerationService *-- ContentService
  ModerationService *-- ReportsService
  CommentsService --|> ModerationService
  AnswersService --|> ModerationService
```

Three things this diagram is drawn to make visible.

**`HttpService` is a base class rather than a parameter property.**
`tsconfig.app.json` sets `erasableSyntaxOnly`, so
`constructor(private readonly client: ApiClient)` is not available in this project.
Nineteen services had written the same field and the same constructor by hand.

**`CommentsService` and `AnswersService` differ by one string.** The backend names
the list in each response after the resource — `/comments` returns `comments`,
`/answers` returns `answers` — so both are `ModerationService` with their noun
filled in. `ModerationService` *composes* `ContentService` and `ReportsService`
rather than inheriting from them: they are separate endpoint groups, and this is
only the seam that lets a page hold one service instead of two.

**`ApiClient` is where the cross-cutting session rules live**, not the services: the
bearer token, `401` ending the session, and an unreachable backend deliberately
**not** ending it — a rejected origin and a downed host are the same `TypeError` to
`fetch`, so the two cannot be told apart from here.

The `api_domains` grouping above is drawn for legibility. On disk these are five
separate packages — `auth`, `users`, `catalog`, `logs`, `feedback`, `system` — each
with its own barrel, and several are themselves split further (`AuditLogsService`
composes a reader, a meta service and a revert service).

---

## 3. The domain model

The entities the panel passes between layers. These are TypeScript `interface`
declarations, so they carry data and no behaviour; the rules that operate on them
live in each feature's `model/` package and in `src/domain`.

```mermaid
classDiagram
  direction LR

  class AuthUser {
    <<interface>>
    +id string
    +name string
    +email string
    +role UserRole
    +isSuperAdmin boolean
  }
  class User {
    <<interface>>
    +id string
    +username string
    +kitEmail string
    +role UserRole
    +status UserStatus
    +credibilityScore int
    +biography string
  }
  class Warning {
    <<interface>>
    +id string
    +message string
    +issuedBy string
    +createdAt string
  }
  class Lecture {
    <<interface>>
    +id string
    +name string
    +code string
    +semesterYear int
    +semesterSeason SemesterSeason
    +active boolean
  }
  class Professor {
    <<interface>>
    +id string
    +firstName string
    +lastName string
    +averageRating number
    +ratingCount int
    +active boolean
  }
  class Rating {
    <<interface>>
    +id string
    +score int
    +createdAt string
  }
  class ModeratedItem {
    <<interface>>
    +id string
    +kind ContentKind
    +content string
    +status ContentStatus
    +postedAt string
  }
  class ReportItem {
    <<interface>>
    +id string
    +kind ContentKind
    +contentId string
    +reason ReportReason
    +status ReportStatus
  }
  class BugReport {
    <<interface>>
    +id string
    +title string
    +description string
    +severity Severity
    +status BugReportStatus
    +issueUrl string
  }
  class LogEntry {
    <<interface>>
    +id string
    +action LogAction
    +createdAt string
    +changes Map
  }
  class RevertableLogEntry {
    <<interface>>
    +revertible boolean
    +revertBlockedReason string
    +revertedByAuditId string
  }
  class LogActor {
    <<interface>>
    +type LogActorType
    +id string
    +name string
    +email string
    +role UserRole
  }
  class LogTarget {
    <<interface>>
    +type LogTargetType
    +id string
    +label string
  }

  User "1" --> "0..*" Warning : has
  Lecture "0..*" --> "0..*" Professor : taught by
  Lecture "1" --> "0..*" Rating : rated by
  ModeratedItem "1" --> "0..*" ModeratedItem : replies
  ReportItem "0..*" ..> "1" ModeratedItem : reports
  RevertableLogEntry --|> LogEntry
  LogEntry "1" --> "1" LogActor : by
  LogEntry "1" --> "0..1" LogTarget : against
  AuthUser ..> User : the same account, as the session sees it
```

**`UserRole` is `'STUDENT' | 'ADMIN'` and has exactly two values.** The elevated
operator is `isSuperAdmin` on `AuthUser` — a behavioural privilege, not a third role.
See [ADR 0004](adr/0004-elevated-operator-is-behaviour-not-a-role.md).

**Every enum-shaped field is guarded at the boundary.** `src/domain/enumGuard.ts` is
a factory that builds the eight type guards (`isReportStatus`, `isUserStatus`, …) from
their vocabularies, with a `const` type parameter so a guard still narrows to the
literal union rather than to `string`. A value the backend sends that is outside the
vocabulary does not reach a component.

**`Lecture`–`Professor` is many-to-many**, which is why both edit forms accept an
empty array: `professorIds: []` and `lectureIds: []` clear an assignment rather than
meaning "unchanged".

---

## 4. A feature in detail: moderation

The richest feature, and the one that shows the pattern the others follow. The screen
is **generic over its resource**: `ModerationPage` does not know whether it is looking
at comments or answers.

```mermaid
classDiagram
  direction TB

  namespace feature_comments {
    class CommentsPage {
      <<component>>
    }
  }

  namespace feature_moderation {
    class ModerationApi {
      <<interface>>
      +loadContent() Promise
      +loadReports() Promise
      +updateContent(item, update) Promise
      +deleteContent(item) Promise
      +updateReportStatus(report, status) Promise
      +deleteReport(report) Promise
    }
    class ModerationPage {
      <<component>>
    }
    class ContentTab {
      <<component>>
    }
    class ReportsTab {
      <<component>>
    }
    class useModerationPage {
      <<hook>>
      +content
      +reports
      +actions
      +contentFor(report)
    }
    class useModerationContent {
      <<hook>>
      +items
      +search
      +filters
    }
    class useModerationReports {
      <<hook>>
      +items
      +search
      +filters
    }
    class useModerationActions {
      <<hook>>
      +updateContent()
      +deleteContent()
      +updateReportStatus()
      +withdrawReport()
    }
    class moderationKeys {
      <<module>>
      +content(resource)
      +reports(resource)
    }
    class moderation_model {
      <<module>>
      +attachReplies()
      +findContent()
      +toCommentReport()
      +toAnswerReport()
      +hidesContent(status)
    }
  }

  namespace api_moderation {
    class CommentsService {
      +getAll()
      +getReported()
    }
    class AnswersService {
      +getAll()
      +getReported()
    }
  }

  CommentsPage ..|> ModerationApi : implements over two services
  CommentsPage --> CommentsService
  CommentsPage --> AnswersService
  CommentsPage --> ModerationPage : renders

  ModerationPage --> useModerationPage
  ModerationPage *-- ContentTab
  ModerationPage *-- ReportsTab
  useModerationPage *-- useModerationContent
  useModerationPage *-- useModerationReports
  useModerationPage *-- useModerationActions
  useModerationContent ..> ModerationApi
  useModerationReports ..> ModerationApi
  useModerationActions ..> ModerationApi
  useModerationContent ..> moderationKeys
  useModerationReports ..> moderationKeys
  useModerationActions ..> moderationKeys
  useModerationPage ..> moderation_model
  ContentTab ..> moderation_model
  ReportsTab ..> moderation_model
```

**This is the one genuine dependency inversion in the codebase.** `ModerationPage`
depends on the `ModerationApi` *interface*, and `CommentsPage` supplies an
implementation of it built from `CommentsService` and `AnswersService`. The generic
screen therefore has no import of either service, and a second moderated resource
would need a new binding page and nothing else.

**`useModerationPage` returns three objects, not twenty-four fields.** It used to
return them flat, and the page spread them across two tabs by hand —
`contentSearch` here, `reportStatusFilter` there. Each tab now takes the one group it
needs, which is the same shape `useCatalog` returns (`{ lists, actions }`).

**`moderationKeys` is why the generic screen works.** The cache key carries the
resource noun; without it, comments and answers would share a cache entry and show
each other's rows.

**All four writes invalidate both lists**, because the two lists are views of the same
records — setting a report to `ACTION_TAKEN` hides the content behind it. Only
withdrawing a report is narrower.

The other features have the same skeleton with fewer parts:

| Feature | Read hooks | Write hook | `model/` |
| --- | --- | --- | --- |
| `users` | `useUsersPage`, `useUserProfile` | `useUserProfileActions` | `filters`, `counts`, `access`, `confirmation`, `userEdit`, `userChange` |
| `catalog` | `useCatalogLists`, `useRatings` | `useCatalogActions` | `catalog`, `edit`, `deletion` |
| `feedback` | `useFeedbackReports` | `useFeedbackReportActions` | `reports`, `edit` |
| `audit-logs` | `useAuditLogs` | `useRevertAuditEntry` | `auditLogModel` |
| `dashboard` | `useDashboardData` | — | `dashboardModel` |
| `auth` | — | `useLoginFlow` | `loginModel`, `authenticateAdmin` |

---

## 5. The shell

```mermaid
classDiagram
  direction TB

  class App {
    <<component>>
  }
  class ErrorBoundary {
    <<component>>
  }
  class QueryClientProvider {
    <<component>>
  }
  class AuthProvider {
    <<component>>
    +login(token, user)
    +logout()
    +sessionExpired boolean
  }
  class authSessionStorage {
    <<module>>
    +readStoredSession() AuthState
    +storeSession(token, user)
    +clearStoredSession()
  }
  class ProtectedRoute {
    <<component>>
  }
  class AdminLayout {
    <<component>>
  }
  class AdminRoutes {
    <<component>>
  }
  class Sidebar {
    <<component>>
  }
  class LoginPage {
    <<component>>
  }
  class PageLoader {
    <<component>>
  }
  class ApiClient {
  }

  App *-- ErrorBoundary
  ErrorBoundary *-- QueryClientProvider
  QueryClientProvider *-- AuthProvider
  AuthProvider --> authSessionStorage
  AuthProvider --> ApiClient : registers the 401 handler
  App --> LoginPage
  App --> ProtectedRoute
  ProtectedRoute --> AdminLayout : when authenticated
  ProtectedRoute --> LoginPage : otherwise, carrying state.from
  ProtectedRoute ..> PageLoader : while /auth/me is in flight
  AdminLayout *-- Sidebar
  AdminLayout *-- AdminRoutes
  AdminRoutes ..> PageLoader : Suspense fallback
```

**The provider order is deliberate.** `QueryClientProvider` sits *inside* the error
boundary and *outside* `AuthProvider`, and the client is created with `useState` —
one per mounted app rather than one per module — so a test that renders `App` twice
cannot have the second render read the first one's cache.

**`ProtectedRoute` is authentication-only.** There is no role-based route or
navigation gating, by decision
([ADR 0004](adr/0004-elevated-operator-is-behaviour-not-a-role.md)). It stays on
`PageLoader` until `/auth/me` answers, rather than flashing the login screen at a
signed-in operator.

**Each page under `AdminRoutes` is a `React.lazy` chunk**, which is where the code
split lives — see [ADR 0007](adr/0007-route-based-lazy-loading.md).

---

## What these diagrams deliberately leave out

- **Presentational components.** There are around 90, and a diagram of them would be
  a picture of the JSX tree. Where one carries a decision — `ConfirmModal`,
  `ErrorAlert` vs `LoadError` — it is described in `README.md`, not drawn here.
- **Every service in a package.** `AuditLogsService` composes three; `UsersService`
  composes two; `CatalogService` composes lecture and professor services. Diagram 2
  shows the barrel's surface, which is what a caller sees.
- **Accessors.** Deliberately, per the notation note above.
- **Test files.** They sit beside the source and follow it.

## Keeping this true

The diagrams are derived from the code, not maintained in parallel with it. When a
feature gains or loses a hook, a `model/` package or a service, the affected diagram
is redrawn in the same commit — the same rule `docs/DESIGN.md` applies to the theme
and `CHANGELOG.md` applies to reasoning.
