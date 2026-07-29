-- Makes the administrative moderation actions take effect in the shared schema.
--
-- Every statement here is additive or relaxing, and every one is idempotent, so
-- the migration is safe to run against a database that Hibernate ddl-auto=update
-- has already touched.
--
-- The ALTER COLUMN ... DROP NOT NULL is the reason this file has to exist at all:
-- Hibernate's update mode adds columns but never relaxes an existing constraint,
-- so without it every warning notification insert fails on the deployed database.

-- Warnings are delivered to the student through the existing notification feed.
-- A warning notification has no answer, so answer_id must become nullable, and a
-- discriminator plus a message column are needed to tell the two kinds apart.
-- The DEFAULT matters: this migration is applied while the previous build is
-- still serving traffic, and that build inserts notifications without knowing
-- about the type column. Without a default those inserts would violate the NOT
-- NULL set below and every reply notification would fail until the new build
-- rolled out.
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "type" VARCHAR(20) DEFAULT 'ANSWER';
ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'ANSWER';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "notifications" ALTER COLUMN "answer_id" DROP NOT NULL;

-- Every row that predates the discriminator is an answer notification.
UPDATE "notifications" SET "type" = 'ANSWER' WHERE "type" IS NULL;

DO $migration$
BEGIN
    -- Only enforce NOT NULL once the backfill above has run, so re-running the
    -- migration on a partially migrated database cannot fail.
    IF NOT EXISTS (
        SELECT 1 FROM "notifications" WHERE "type" IS NULL
    ) THEN
        ALTER TABLE "notifications" ALTER COLUMN "type" SET NOT NULL;
    END IF;
END
$migration$;

ALTER TABLE "notifications"
    DROP CONSTRAINT IF EXISTS "notifications_type_check";
ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_type_check"
    CHECK ("type" IN ('ANSWER', 'WARNING'));

-- A warning notification carries a message and no answer; an answer notification
-- carries an answer and no message. Neither kind may be empty.
ALTER TABLE "notifications"
    DROP CONSTRAINT IF EXISTS "notifications_payload_check";
ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_payload_check"
    CHECK (
        ("type" = 'ANSWER' AND "answer_id" IS NOT NULL)
        OR ("type" = 'WARNING' AND "message" IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS "notifications_recipient_unseen_idx"
    ON "notifications" ("recipient_id", "seen", "created_at" DESC);

-- DELETE /users/{id} anonymizes rather than removing the row, so that comments,
-- answers, votes, ratings, warnings and reports keep a valid foreign key and no
-- content is left pointing at a dangling id.
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);

-- Supports the moderation user list, which excludes DELETED accounts and orders
-- by join date.
CREATE INDEX IF NOT EXISTS "students_status_created_at_idx"
    ON "students" ("status", "created_at" DESC);

-- Resolving a report as ACTION_TAKEN now hides the reported comment, and the
-- student read path filters on status.
CREATE INDEX IF NOT EXISTS "comments_lecture_status_idx"
    ON "comments" ("lecture_id", "status");

-- Grouped counters behind the warnings/reports columns of GET /users.
CREATE INDEX IF NOT EXISTS "warnings_student_id_idx"
    ON "warnings" ("student_id");
