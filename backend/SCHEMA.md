# Prisma Schema Documentation

This document explains the source Prisma schema in `prisma/schema.prisma`. The schema defines a PostgreSQL database for passwordless login, students, professors, module offerings, ratings, comments, answers, and moderation reports.

For a visual entity relationship diagram, see `ERD.md`.

## Prisma Setup

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

- Prisma Client is generated into `src/generated/prisma`.
- The datasource uses PostgreSQL.
- The database URL is configured in `prisma.config.ts` through `DATABASE_URL`.
- Migrations are stored in `prisma/migrations`.


## Enums

### `ContentStatus`

Mapped database enum: `content_status`

Values:

- `VISIBLE`: Content is visible to users.
- `HIDDEN`: Content is hidden but still retained.
- `DELETED`: Content is treated as deleted without necessarily removing the row.

Used by:

- `Comment.status`
- `Answer.status`

### `ReportStatus`

Mapped database enum: `report_status`

Values:

- `OPEN`: Report is waiting for review.
- `REVIEWED`: Report was reviewed.
- `DISMISSED`: Report was rejected or ignored.
- `ACTION_TAKEN`: Report resulted in a moderation action.

Used by:

- `CommentReport.status`
- `AnswerReport.status`

### `SemesterSeason`

Mapped database enum: `semester_season`

Values:

- `SUMMER`
- `WINTER`

Used by:

- `Module.semesterSeason`

## Models

### `OneTimePassword`

Database table: `one_time_passwords`

Stores the current Spring Boot login one-time password records used by `TokenService`.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `Int` | Primary key, auto-incremented |
| `email` | `email` | `String` | Email address for the login attempt |
| `value` | `value` | `String` / `Text` | One-time password value |
| `tokenId` | `token_id` | `String?` / `Uuid` | Optional unique link to `Token` |
| `token` | - | `Token?` | Optional relation |

Indexes and constraints:

- Index on `email`.
- Index on `value`.
- Unique constraint on `tokenId`.

Relations:

- Optional one-to-one relation with `Token`.
- If the linked `Token` is deleted, the one-time password is deleted through `onDelete: Cascade`.

### `Token`

Database table: `tokens`

Stores passwordless login tokens.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `email` | `email` | `String` | Email address the token belongs to |
| `value` | `value` | `String` / `Text` | Token value |
| `expiresAt` | `expires_at` | `DateTime` | Expiration timestamp |
| `revoked` | `revoked` | `Boolean` | Defaults to `false` |
| `oneTimePassword` | - | `OneTimePassword?` | Optional reverse relation |

Indexes:

- `email`
- `value`
- `expiresAt`
- `revoked`

### `Professor`

Database table: `professors`

Represents a professor who teaches module offerings.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `firstName` | `first_name` | `String` | Professor first name |
| `lastName` | `last_name` | `String` | Professor last name |
| `isActive` | `is_active` | `Boolean` | Defaults to `true` |
| `averageRating` | `average_rating` | `Decimal(3,2)` | Cached average from rating rows |
| `ratingCount` | `rating_count` | `Int` | Cached number of ratings |
| `modules` | - | `Module[]` | Module offerings taught by the professor |
| `updatedAt` | `updated_at` | `DateTime` | Automatically updated by Prisma |

Indexes:

- Composite index on `lastName, firstName`.
- Index on `isActive`.

Important behavior:

- `averageRating` and `ratingCount` are cached values. Application code must update them when ratings change.

### `Module`

Database table: `lectures`

Represents one module offering taught by exactly one professor. The same module name or code may exist for different professors or semesters.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `name` | `name` | `String` | Module name |
| `code` | `code` | `String?` | Optional module code |
| `semesterYear` | `semester_year` | `Int` | Semester year |
| `semesterSeason` | `semester_season` | `SemesterSeason` | `SUMMER` or `WINTER` |
| `isActive` | `is_active` | `Boolean` | Defaults to `true` |
| `professorId` | `professor_id` | `String` / `Uuid` | Foreign key to `Professor` |
| `professor` | - | `Professor` | Owning professor |
| `comments` | - | `Comment[]` | Comments for this module |
| `ratings` | - | `Rating[]` | Ratings for this module |
| `updatedAt` | `updated_at` | `DateTime` | Automatically updated by Prisma |

Indexes:

- `name`
- `code`
- Composite index on `semesterYear, semesterSeason`.
- Composite index on `professorId, isActive`.

Relations:

- Many modules belong to one professor.
- Deleting a professor cascades to their modules.
- A module can have many comments and ratings.

### `Student`

Database table: `students`

Represents a registered student account.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `username` | `username` | `String` | Unique username |
| `kitEmail` | `kit_email` | `String` | Unique KIT email |
| `emailVerifiedAt` | `email_verified_at` | `DateTime?` | Null until email verification |
| `credibilityScore` | `credibility_score` | `Int` | Defaults to `0` |
| `ratings` | - | `Rating[]` | Ratings created by the student |
| `comments` | - | `Comment[]` | Comments created by the student |
| `answers` | - | `Answer[]` | Answers created by the student |
| `commentReports` | - | `CommentReport[]` | Comment reports submitted by the student |
| `answerReports` | - | `AnswerReport[]` | Answer reports submitted by the student |
| `createdAt` | `created_at` | `DateTime` | Defaults to current time |
| `updatedAt` | `updated_at` | `DateTime` | Automatically updated by Prisma |

Constraints:

- `username` must be unique.
- `kitEmail` must be unique.

### `Rating`

Database table: `ratings`

Represents a student's rating for one module.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `studentId` | `student_id` | `String` / `Uuid` | Foreign key to `Student` |
| `moduleId` | `lecture_id` | `String` / `Uuid` | Foreign key to `Module` |
| `student` | - | `Student` | Rating author |
| `module` | - | `Module` | Rated module |
| `topics` | - | `RatingTopic[]` | Topic-specific rating values |
| `createdAt` | `created_at` | `DateTime` | Defaults to current time |
| `updatedAt` | `updated_at` | `DateTime` | Automatically updated by Prisma |

Indexes and constraints:

- Unique constraint on `studentId, moduleId`, so a student can rate a module only once.
- Index on `moduleId`.

Relations:

- Deleting the student or module cascades to the rating.

### `RatingTopic`

Database table: `rating_topics`

Stores topic-specific values for a rating.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `name` | `name` | `String` | Rating topic name |
| `value` | `value` | `Int` / `SmallInt` | Rating value |
| `ratingId` | `rating_id` | `String` / `Uuid` | Foreign key to `Rating` |
| `rating` | - | `Rating` | Parent rating |

Constraints:

- Unique constraint on `ratingId, name`, so the same topic can appear only once per rating.

Relations:

- Deleting a rating cascades to its topic rows.

### `Comment`

Database table: `comments`

Represents free-text feedback from a student on a module.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `content` | `content` | `String` / `Text` | Comment body |
| `status` | `status` | `ContentStatus` | Defaults to `VISIBLE` |
| `studentId` | `student_id` | `String` / `Uuid` | Foreign key to `Student` |
| `moduleId` | `lecture_id` | `String` / `Uuid` | Foreign key to `Module` |
| `student` | - | `Student` | Comment author |
| `module` | - | `Module` | Commented module |
| `answers` | - | `Answer[]` | Replies to this comment |
| `reports` | - | `CommentReport[]` | Reports for this comment |
| `createdAt` | `created_at` | `DateTime` | Defaults to current time |
| `updatedAt` | `updated_at` | `DateTime` | Automatically updated by Prisma |

Indexes:

- Composite index on `moduleId, createdAt` for listing comments by module in time order.
- Index on `studentId`.

Relations:

- Deleting the student or module cascades to the comment.
- A comment may have zero, one, or many answers.

### `Answer`

Database table: `answers`

Represents a reply to a comment.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `content` | `content` | `String` / `Text` | Answer body |
| `status` | `status` | `ContentStatus` | Defaults to `VISIBLE` |
| `studentId` | `student_id` | `String` / `Uuid` | Foreign key to `Student` |
| `commentId` | `comment_id` | `String` / `Uuid` | Foreign key to `Comment` |
| `student` | - | `Student` | Answer author |
| `comment` | - | `Comment` | Parent comment |
| `reports` | - | `AnswerReport[]` | Reports for this answer |
| `createdAt` | `created_at` | `DateTime` | Defaults to current time |
| `updatedAt` | `updated_at` | `DateTime` | Automatically updated by Prisma |

Indexes:

- Composite index on `commentId, createdAt` for listing answers under a comment in time order.
- Index on `studentId`.

Relations:

- Deleting the student or parent comment cascades to the answer.

### `CommentReport`

Database table: `comment_reports`

Represents a moderation report submitted against a comment.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `reason` | `reason` | `String` / `Text` | Report reason |
| `status` | `status` | `ReportStatus` | Defaults to `OPEN` |
| `reporterId` | `reporter_id` | `String` / `Uuid` | Foreign key to reporting `Student` |
| `commentId` | `comment_id` | `String` / `Uuid` | Foreign key to reported `Comment` |
| `reporter` | - | `Student` | Student who submitted the report |
| `comment` | - | `Comment` | Reported comment |
| `createdAt` | `created_at` | `DateTime` | Defaults to current time |
| `updatedAt` | `updated_at` | `DateTime` | Automatically updated by Prisma |

Indexes and constraints:

- Unique constraint on `reporterId, commentId`, so a student can report the same comment only once.
- Composite index on `status, createdAt` for moderation queues.
- Index on `commentId`.

Relations:

- Deleting the reporter or reported comment cascades to the report.

### `AnswerReport`

Database table: `answer_reports`

Represents a moderation report submitted against an answer.

Fields:

| Prisma field | Database column | Type | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `String` / `Uuid` | Primary key, generated UUID |
| `reason` | `reason` | `String` / `Text` | Report reason |
| `status` | `status` | `ReportStatus` | Defaults to `OPEN` |
| `reporterId` | `reporter_id` | `String` / `Uuid` | Foreign key to reporting `Student` |
| `answerId` | `answer_id` | `String` / `Uuid` | Foreign key to reported `Answer` |
| `reporter` | - | `Student` | Student who submitted the report |
| `answer` | - | `Answer` | Reported answer |
| `createdAt` | `created_at` | `DateTime` | Defaults to current time |
| `updatedAt` | `updated_at` | `DateTime` | Automatically updated by Prisma |

Indexes and constraints:

- Unique constraint on `reporterId, answerId`, so a student can report the same answer only once.
- Composite index on `status, createdAt` for moderation queues.
- Index on `answerId`.

Relations:

- Deleting the reporter or reported answer cascades to the report.

## Relationship Summary

- `Token` has an optional one-to-one relation with `OneTimePassword`.
- `Professor` has many `Module` records.
- `Module` belongs to one `Professor`.
- `Module` has many `Rating` and `Comment` records.
- `Student` has many `Rating`, `Comment`, `Answer`, `CommentReport`, and `AnswerReport` records.
- `Rating` belongs to one `Student` and one `Module`.
- `Rating` has many `RatingTopic` records.
- `Comment` belongs to one `Student` and one `Module`.
- `Comment` has many `Answer` and `CommentReport` records.
- `Answer` belongs to one `Student` and one `Comment`.
- `Answer` has many `AnswerReport` records.

Most relations use `onDelete: Cascade`, so deleting parent rows removes dependent rows automatically. Be careful with deletes for `Student`, `Professor`, `Module`, `Comment`, `Answer`, `Rating`, and `Token`.

## Business Rules Encoded in the Schema

- A student can rate a module only once: `Rating` has `@@unique([studentId, moduleId])`.
- A rating can have only one row per topic name: `RatingTopic` has `@@unique([ratingId, name])`.
- A student can report the same comment only once: `CommentReport` has `@@unique([reporterId, commentId])`.
- A student can report the same answer only once: `AnswerReport` has `@@unique([reporterId, answerId])`.
- Students must have unique usernames and KIT email addresses.
- Content and reports are status-driven, so moderation can hide or resolve records without immediately deleting them.
- Professor rating aggregates are cached and must be kept in sync by application logic.

## Direct SQL Name Reference

| Prisma model | Database table |
| --- | --- |
| `OneTimePassword` | `one_time_passwords` |
| `Token` | `tokens` |
| `Professor` | `professors` |
| `Module` | `lectures` |
| `Student` | `students` |
| `Rating` | `ratings` |
| `RatingTopic` | `rating_topics` |
| `Comment` | `comments` |
| `Answer` | `answers` |
| `CommentReport` | `comment_reports` |
| `AnswerReport` | `answer_reports` |

