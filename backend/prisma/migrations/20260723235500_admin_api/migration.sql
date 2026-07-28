CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_type" VARCHAR(20) NOT NULL,
    "actor_id" UUID NOT NULL,
    "actor_name" VARCHAR(255) NOT NULL,
    "actor_email" VARCHAR(255) NOT NULL,
    "actor_role" VARCHAR(40) NOT NULL,
    "target_type" VARCHAR(40),
    "target_id" UUID,
    "target_label" TEXT,
    "changes" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_actor_type_check" CHECK ("actor_type" IN ('ADMIN', 'USER')),
    CONSTRAINT "audit_logs_action_check" CHECK (
        "action" IN (
            'ADMIN_LOGIN',
            'ADMIN_LOGOUT',
            'USER_WARNING_CREATED',
            'USER_BLOCKED',
            'USER_UNBLOCKED',
            'USER_DELETED',
            'COMMENT_REPORT_STATUS_CHANGED',
            'BUG_REPORT_UPDATED'
        )
    ),
    CONSTRAINT "audit_logs_target_type_check" CHECK (
        "target_type" IS NULL OR "target_type" IN (
            'ADMIN_SESSION',
            'USER',
            'COMMENT_REPORT',
            'BUG_REPORT'
        )
    )
);

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_id_idx"
    ON "audit_logs" ("created_at" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_actor_id_idx" ON "audit_logs" ("actor_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "audit_logs_target_type_idx" ON "audit_logs" ("target_type");

CREATE TABLE IF NOT EXISTS "auth_rate_limit_buckets" (
    "id" UUID NOT NULL,
    "operation" VARCHAR(40) NOT NULL,
    "subject_hash" VARCHAR(64) NOT NULL,
    "window_started_at" TIMESTAMP(6) NOT NULL,
    "attempts" INTEGER NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "auth_rate_limit_buckets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "auth_rate_limit_operation_subject_key"
        UNIQUE ("operation", "subject_hash")
);

CREATE INDEX IF NOT EXISTS "auth_rate_limit_window_idx"
    ON "auth_rate_limit_buckets" ("window_started_at");

DO $migration$
BEGIN
    IF to_regclass('public.tokens') IS NOT NULL THEN
        ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "hash" TEXT;
        ALTER TABLE "tokens" ALTER COLUMN "value" DROP NOT NULL;
        CREATE INDEX IF NOT EXISTS "tokens_hash_idx" ON "tokens" ("hash");
    END IF;

    IF to_regclass('public.one_time_passwords') IS NOT NULL THEN
        ALTER TABLE "one_time_passwords" ADD COLUMN IF NOT EXISTS "hash" TEXT;
        ALTER TABLE "one_time_passwords"
            ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "one_time_passwords"
            ADD COLUMN IF NOT EXISTS "used" BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE "one_time_passwords"
            ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "one_time_passwords" ALTER COLUMN "value" DROP NOT NULL;
        UPDATE "one_time_passwords" SET "used" = TRUE WHERE "hash" IS NULL;
        CREATE INDEX IF NOT EXISTS "one_time_passwords_email_active_idx"
            ON "one_time_passwords" ("email", "used", "expires_at");
    END IF;

    IF to_regclass('public.students') IS NOT NULL THEN
        UPDATE "students"
        SET "created_at" = COALESCE("created_at", "email_verified_at", "updated_at", CURRENT_TIMESTAMP)
        WHERE "created_at" IS NULL;
    END IF;

    IF to_regclass('public.admins') IS NOT NULL THEN
        UPDATE "admins" SET "created_at" = CURRENT_TIMESTAMP WHERE "created_at" IS NULL;
    END IF;

    IF to_regclass('public.warnings') IS NOT NULL THEN
        UPDATE "warnings" SET "created_at" = CURRENT_TIMESTAMP WHERE "created_at" IS NULL;
    END IF;

    IF to_regclass('public.comment_reports') IS NOT NULL THEN
        UPDATE "comment_reports"
        SET "created_at" = COALESCE("created_at", "updated_at", CURRENT_TIMESTAMP)
        WHERE "created_at" IS NULL;
    END IF;

    IF to_regclass('public.bug_reports') IS NOT NULL THEN
        UPDATE "bug_reports"
        SET "created_at" = COALESCE("created_at", "updated_at", CURRENT_TIMESTAMP)
        WHERE "created_at" IS NULL;
    END IF;
END
$migration$;
